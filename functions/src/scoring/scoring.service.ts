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
      // TODO: Include gameSongs if they are added later

      // 1. Identify Unique Songs & Duplicates (using song name as temporary ID)
      const songOccurrences: { [songName: string]: string[] } = {}; // songName -> [playerId1, playerId2,...]
      const uniqueSongs: { songName: string, submitterPlayerId: string }[] = []; // Use first submitter for uniqueness
      const songNameToSubmitterId: { [songName: string]: string } = {}; // Map song name back to a submitter ID

      Object.entries(playerSongsMap).forEach(([playerId, submission]) => {
        const songName = submission.name; // Using name as ID for now
        if (!songOccurrences[songName]) {
          songOccurrences[songName] = [];
          uniqueSongs.push({ songName: songName, submitterPlayerId: playerId }); // Add to unique list
          songNameToSubmitterId[songName] = playerId; // Map name to first submitter
        }
        songOccurrences[songName].push(playerId);
      });
      const numberOfUniqueSongs = uniqueSongs.length;
      logger.debug(`[${traceId}] Unique songs identified: ${numberOfUniqueSongs}`, { uniqueSongs, songOccurrences, songNameToSubmitterId });

      // 2. Calculate Rank Sums for Unique Songs
      const songRankSums: { [songName: string]: number } = {};
      uniqueSongs.forEach(us => { songRankSums[us.songName] = 0; });

      rankingsSnapshot.forEach(rankingDoc => {
        const rankerPlayerId = rankingDoc.id; // ID of the player who submitted this ranking
        const rankingData = rankingDoc.data();
        const playerRankings = rankingData?.rankings || {}; // Expected structure: { songNameOrId: rank }

        Object.entries(playerRankings).forEach(([songKey, rank]) => {
          if (songRankSums[songKey] !== undefined) {
            // The key is the song name as expected.
            songRankSums[songKey] += rank as number;
          } else {
            // The key might be a player ID; try to retrieve the submitted song name.
            const submission = playerSongsMap[songKey];
            if (submission && submission.name && songRankSums[submission.name] !== undefined) {
              songRankSums[submission.name] += rank as number;
            } else {
              // If still not found, log a warning.
              logger.warn(
                `[${traceId}] Ranking found for unexpected song key '${songKey}' by player ${rankerPlayerId} in game ${gameId}, round ${roundNumber}. This rank was ignored.`
              );
            }
          }
        });
      });
      logger.debug(`[${traceId}] Calculated rank sums:`, { songRankSums });

      // 3. Calculate Song Points (with Tie Handling)
      const songPoints: { [songName: string]: number } = {};
      const sortedSongsWithSums: [string, number][] = Object.entries(songRankSums).sort(([, sumA], [, sumB]) => sumA - sumB);
      logger.debug(`[${traceId}] Sorted songs by rank sum:`, { sortedSongsWithSums });

      let rankIndex = 0;
      while (rankIndex < sortedSongsWithSums.length) {
          const currentSum = sortedSongsWithSums[rankIndex][1];
          let tieCount = 1;
          // Count how many songs have the same rank sum
          while (rankIndex + tieCount < sortedSongsWithSums.length && sortedSongsWithSums[rankIndex + tieCount][1] === currentSum) {
              tieCount++;
          }

          let pointsSum = 0;
          for (let i = 0; i < tieCount; i++) {
              const rank = rankIndex + i;
              const pointsForRank = numberOfUniqueSongs - rank; // N points for 1st (rank 0), N-1 for 2nd (rank 1)...
              pointsSum += pointsForRank > 0 ? pointsForRank : 0; // Ensure points are not negative
          }
          const pointsPerSong = Math.floor(pointsSum / tieCount); // Average points and round down
          logger.debug(`[${traceId}] Tie calculation: rankIndex=${rankIndex}, tieCount=${tieCount}, pointsSum=${pointsSum}, pointsPerSong=${pointsPerSong}`);
          // Assign points to all tied songs
          for (let i = 0; i < tieCount; i++) {
              const songName = sortedSongsWithSums[rankIndex + i][0];
              songPoints[songName] = pointsPerSong;
          }
          rankIndex += tieCount; // Move index past the tied group
      }
      logger.debug(`[${traceId}] Calculated song points (with tie handling):`, { songPoints });

      // 4. Calculate Player Scores for the Round
      const playerRoundScores: { [playerId: string]: { baseScore: number, bonus: number, penalty: number, total: number, jokerUsed: boolean } } = {};

      playersSnapshot.forEach(playerDoc => {
        const playerId = playerDoc.id;
        const submittedSongName = playerSongsMap[playerId]?.name;

        let baseScore = 0;
        let penalty = 0;
        const bonus = 0; // Bonus logic deferred
        const jokerUsed = false; // Joker logic deferred

        if (submittedSongName) {
          baseScore = songPoints[submittedSongName] || 0;

          // Apply Duplicate Penalty
          const submitters = songOccurrences[submittedSongName] || [];
          if (submitters.length > 1) {
            penalty = -(submitters.length - 1);
          }
        } else {
          logger.warn(`[${traceId}] Player ${playerId} seems to have no song submission in round ${roundNumber}. Assigning 0 score.`);
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
        logger.debug(`[${traceId}] Calculated score for player ${playerId}:`, { submittedSongName, baseScore, penalty, bonus, jokerUsed, roundTotal });
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