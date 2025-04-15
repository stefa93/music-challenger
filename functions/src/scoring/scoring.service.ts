import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as gameData from "../game/game.data"; // Adjusted path
import * as playerData from "../player/player.data"; // Adjusted path
import * as roundData from "../round/round.data"; // Adjusted path
import { GameStatus } from "../game/types"; // Adjusted path
import { TraceId } from "../core/types"; // Adjusted path
import { PlayerSongSubmission, RoundResult, RoundWinnerData } from "../round/types"; // Adjusted path

/**
 * Calculates scores for a completed round based on submitted rankings.
 * Contains the core business logic for scoring.
 * @param gameId The ID of the game.
 * @param roundNumber The number of the round to calculate scores for.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game/round state issues, or internal problems.
 */
export async function calculateScoresService(
  gameId: string,
  roundNumber: number,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction // Make transaction optional
): Promise<void> {
  logger.info(`[${traceId}] Service: calculateScoresService called.`, { gameId, roundNumber });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!Number.isInteger(roundNumber) || roundNumber <= 0) {
    throw new HttpsError("invalid-argument", "Valid round number is required.");
  }
  // --- End Input Validation ---

  try {
    // The transaction is now optional and passed in.
    // DAL functions accept the optional transaction parameter.
    logger.debug(`[${traceId}] Calculate Scores Service ${gameId}/R${roundNumber}: Starting logic ${transaction ? 'within provided transaction' : 'without transaction'}.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }

      const currentRound = await roundData.getRoundByNumber(gameId, roundNumber, traceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${roundNumber} for game ${gameId} not found.`);
      }

      const playersSnapshot = await playerData.getAllPlayers(gameId, traceId, transaction);
      const playerCount = playersSnapshot.size;

      const rankingsSnapshot = await roundData.getAllRankingsForRound(gameId, roundNumber, traceId, transaction); // Corrected order
      logger.debug(`[${traceId}] Fetched state:`, { currentGame, currentRound, playerCount: playersSnapshot.size, rankingCount: rankingsSnapshot.size });
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      const expectedGameStatus = `round${roundNumber}_scoring`; // This might need adjustment if state transition is wrong
      logger.debug(`[${traceId}] Checking game status: Expected=${expectedGameStatus}, Actual=${currentGame.status}`);
      if (currentGame.status !== expectedGameStatus) {
        throw new HttpsError("failed-precondition", `Game is not in the expected scoring phase (expected: ${expectedGameStatus}, actual: ${currentGame.status}).`);
      }
      logger.debug(`[${traceId}] Checking round status: Expected=scoring, Actual=${currentRound.status}`);
      if (currentRound.status !== "scoring") {
        throw new HttpsError("failed-precondition", `Round ${roundNumber} is not in the scoring phase (actual: ${currentRound.status}).`);
      }
      logger.debug(`[${traceId}] Checking ranking count: Expected=${playerCount}, Actual=${rankingsSnapshot.size}`);
      if (rankingsSnapshot.size !== playerCount) {
        throw new HttpsError("failed-precondition", `Ranking count (${rankingsSnapshot.size}) does not match player count (${playerCount}) for round ${roundNumber}. Cannot calculate scores.`);
      }
      // --- End Business Rule Checks ---


      // --- Scoring Logic (Refactored based on decisionLog [2025-04-01 23:15:52]) ---
      logger.debug(`[${traceId}] Transaction (Calculate Scores Service ${gameId}/R${roundNumber}): Starting refactored scoring logic.`);

      const playerSongsMap: { [playerId: string]: PlayerSongSubmission } = currentRound.playerSongs || {};
      logger.debug(`[${traceId}] Player songs map:`, { playerSongsMap });

      // 1. Identify Unique Songs & Duplicates (using trackId)
      const trackIdOccurrences: { [trackId: string]: string[] } = {}; // trackId -> [playerId1, playerId2,...]
      const uniqueSongsMap: { [trackId: string]: PlayerSongSubmission } = {}; // trackId -> first submission object

      Object.entries(playerSongsMap).forEach(([playerId, submission]) => {
        const trackId = submission.trackId;
        if (!trackId) {
            logger.warn(`[${traceId}] Submission from player ${playerId} is missing trackId. Skipping.`);
            return;
        }
        if (!trackIdOccurrences[trackId]) {
          trackIdOccurrences[trackId] = [];
          uniqueSongsMap[trackId] = submission; // Store first submission for this trackId
        }
        trackIdOccurrences[trackId].push(playerId);
      });
      const uniqueTrackIds = Object.keys(uniqueSongsMap);
      const numberOfUniqueSongs = uniqueTrackIds.length;
      logger.debug(`[${traceId}] Unique songs identified by trackId: ${numberOfUniqueSongs}`, { uniqueTrackIds, trackIdOccurrences });

      // 2. Calculate Rank Sums for Unique Songs (using trackId)
      const trackRankSums: { [trackId: string]: number } = {};
      uniqueTrackIds.forEach(trackId => { trackRankSums[trackId] = 0; });

      rankingsSnapshot.forEach(rankingDoc => {
        const rankerPlayerId = rankingDoc.id;
        const rankingData = rankingDoc.data();
        // Submitted rankings are correctly keyed by trackId
        const playerRankings: { [trackId: string]: number } = rankingData?.rankings || {};

        Object.entries(playerRankings).forEach(([trackId, rank]) => {
          if (trackRankSums[trackId] !== undefined) {
            trackRankSums[trackId] += rank;
          } else {
            // This case should ideally not happen if validation is correct,
            // but log if a submitted rank is for a trackId not in the unique list.
            logger.warn(
              `[${traceId}] Ranking found for unexpected trackId '${trackId}' by player ${rankerPlayerId} in game ${gameId}, round ${roundNumber}. This rank was ignored.`
            );
          }
        });
      });
      logger.debug(`[${traceId}] Calculated rank sums by trackId:`, { trackRankSums });

      // 3. Calculate Song Points (by trackId, with Tie Handling, based on TOTAL songs ranked)
      const trackPoints: { [trackId: string]: number } = {};
      // Sort by rank sum (ascending)
      const sortedTracksWithSums: [string, number][] = Object.entries(trackRankSums).sort(([, sumA], [, sumB]) => sumA - sumB);
      logger.debug(`[${traceId}] Sorted tracks by rank sum:`, { sortedTracksWithSums });

      // Use the length of the actual list presented for ranking
      const numberOfSongsRanked = currentRound.songsForRanking?.length || numberOfUniqueSongs; // Fallback to unique songs if songsForRanking is missing
      logger.debug(`[${traceId}] Number of songs considered for point calculation: ${numberOfSongsRanked}`);

      let rankIndex = 0;
      while (rankIndex < sortedTracksWithSums.length) {
          const currentSum = sortedTracksWithSums[rankIndex][1];
          let tieCount = 1;
          // Count how many tracks have the same rank sum
          while (rankIndex + tieCount < sortedTracksWithSums.length && sortedTracksWithSums[rankIndex + tieCount][1] === currentSum) {
              tieCount++;
          }

          let pointsSum = 0;
          for (let i = 0; i < tieCount; i++) {
              const rank = rankIndex + i; // 0-based rank
              const pointsForRank = numberOfSongsRanked - rank; // Use total ranked count for points
              pointsSum += pointsForRank > 0 ? pointsForRank : 0; // Ensure points are not negative
          }
          // Average points for tied tracks and round down
          const pointsPerTrack = Math.floor(pointsSum / tieCount);
          logger.debug(`[${traceId}] Tie calculation: rankIndex=${rankIndex}, tieCount=${tieCount}, pointsSum=${pointsSum}, pointsPerTrack=${pointsPerTrack}`);

          // Assign points to all tied tracks
          for (let i = 0; i < tieCount; i++) {
              const trackId = sortedTracksWithSums[rankIndex + i][0];
              trackPoints[trackId] = pointsPerTrack;
          }
          rankIndex += tieCount; // Move index past the tied group
      }
      logger.debug(`[${traceId}] Calculated track points (with tie handling):`, { trackPoints });

      // 4. Calculate Player Scores for the Round
      const playerRoundScores: { [playerId: string]: { baseScore: number, bonus: number, penalty: number, total: number, jokerUsed: boolean } } = {};

      playersSnapshot.forEach(playerDoc => {
        const playerId = playerDoc.id;
        const submission = playerSongsMap[playerId];
        const submittedTrackId = submission?.trackId;

        let baseScore = 0;
        let penalty = 0;
        const bonus = 0; // Bonus logic deferred
        const jokerUsed = false; // Joker logic deferred

        if (submittedTrackId) {
          // Get score based on the points awarded to the submitted trackId
          baseScore = trackPoints[submittedTrackId] || 0;

          // Apply Duplicate Penalty based on trackId occurrences
          const submitters = trackIdOccurrences[submittedTrackId] || [];
          if (submitters.length > 1) {
            penalty = -(submitters.length - 1);
            logger.debug(`[${traceId}] Applying duplicate penalty of ${penalty} to player ${playerId} for track ${submittedTrackId}`);
          }
        } else {
          logger.warn(`[${traceId}] Player ${playerId} seems to have no valid song submission (or missing trackId) in round ${roundNumber}. Assigning 0 score.`);
        }

        // Calculate total (Joker/Bonus deferred)
        let roundTotal = baseScore + bonus + penalty;
        // Apply Joker Doubling (Deferred)
        // if (jokerUsed) { roundTotal = roundTotal * 2; }

        playerRoundScores[playerId] = {
          baseScore: baseScore,
          bonus: bonus,
          penalty: penalty, // Store penalty
          total: roundTotal,
          jokerUsed: jokerUsed,
        };
        logger.debug(`[${traceId}] Calculated score for player ${playerId}:`, { submittedTrackId, baseScore, penalty, bonus, jokerUsed, roundTotal });
      });

      logger.debug(`[${traceId}] Transaction (Calculate Scores Service ${gameId}/R${roundNumber}): Scoring logic complete. Final round scores:`, { playerRoundScores });
      // --- End Scoring Logic ---

      // --- Prepare Detailed Results for Storage ---
      logger.debug(`[${traceId}] Preparing detailed round results for storage.`);
      const roundResults: RoundResult[] = Object.entries(playerSongsMap).map(([playerId, submission]) => {
          const scoreInfo = playerRoundScores[playerId];
          return {
              playerId: playerId,
              playerName: playersSnapshot.docs.find(doc => doc.id === playerId)?.data()?.name || 'Unknown Player', // Fetch player name
              songName: submission.name,
              songArtist: submission.artist,
              pointsAwarded: scoreInfo?.total || 0, // Use total round score for this player
              isWinner: false, // Will be updated below
          };
      });

      // Determine Winner(s)
      let highestScore = -Infinity;
      let winnerIds: string[] = [];
      Object.entries(playerRoundScores).forEach(([playerId, scoreData]) => {
          if (scoreData.total > highestScore) {
              highestScore = scoreData.total;
              winnerIds = [playerId];
          } else if (scoreData.total === highestScore) {
              winnerIds.push(playerId);
          }
      });

      // Mark winners in roundResults
      roundResults.forEach(result => {
          if (winnerIds.includes(result.playerId)) {
              result.isWinner = true;
          }
      });

      const winnerData: RoundWinnerData | null = winnerIds.length > 0 ? {
          winnerPlayerIds: winnerIds,
          winningScore: highestScore,
      } : null;

      logger.debug(`[${traceId}] Prepared detailed results:`, { roundResults, winnerData });
      // --- End Prepare Detailed Results ---


      // --- Update State ---
      logger.debug(`[${traceId}] Transaction (Calculate Scores Service ${gameId}/R${roundNumber}): Starting writes.`);
      // 1. Write round scores for each player & update total scores
      playersSnapshot.forEach(playerDoc => {
        const playerId = playerDoc.id;
        const scoreData = playerRoundScores[playerId];
        const scoreDocData = {
          roundScore: scoreData.baseScore,
          bonusPoints: scoreData.bonus,
          jokerUsed: scoreData.jokerUsed,
          totalScoreForRound: scoreData.total,
          // calculatedAt added by DAL
        };
        logger.debug(`[${traceId}] Writing score document for player ${playerId}:`, { scoreDocData });
        // Add score document for the round
        roundData.addScoreDocument(gameId, roundNumber, playerId, scoreDocData, traceId, transaction); // Corrected order
        logger.debug(`[${traceId}] Incrementing total score for player ${playerId} by ${scoreData.total}.`);
        // Update player's total score
        playerData.incrementPlayerScore(gameId, playerId, scoreData.total, traceId, transaction); // Corrected order
      });
      logger.debug(`[${traceId}] Transaction (Calculate Scores Service ${gameId}/R${roundNumber}): Wrote round scores and updated total scores.`);

      // 2. Update round status
      const roundUpdate = {
          status: "finished" as const, // Use const assertion
          results: roundResults, // Store detailed results
          winnerData: winnerData, // Store winner data
      };
      logger.debug(`[${traceId}] Updating round ${roundNumber} status:`, { roundUpdate });
      roundData.updateRoundDetails(gameId, roundNumber, roundUpdate, traceId, transaction); // Corrected order

      // 3. Update game status
      const isLastRound = currentGame.currentRound === currentGame.totalRounds;
      const nextGameStatus = isLastRound ? "finished" : (`round${currentGame.currentRound}_finished` as GameStatus); // Use const assertion and type assertion
      const gameUpdate = { status: nextGameStatus };
      logger.debug(`[${traceId}] Updating game ${gameId} status:`, { isLastRound, gameUpdate });
      gameData.updateGameDetails(gameId, gameUpdate, traceId, transaction); // Corrected order
      logger.debug(`[${traceId}] Transaction (Calculate Scores Service ${gameId}/R${roundNumber}): Updated round and game status.`, { gameUpdate });
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Calculate Scores Service ${gameId}/R${roundNumber}): Writes completed.`);
    // No transaction wrapper needed here.

    logger.info(`[${traceId}] Service: Scores calculated successfully for game ${gameId}, round ${roundNumber}.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: calculateScoresService failed for game ${gameId}, round ${roundNumber}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while calculating scores.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}