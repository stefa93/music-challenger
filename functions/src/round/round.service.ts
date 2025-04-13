import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../core/firestoreClient"; // Adjusted path
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue directly
import * as gameData from "../game/game.data"; // Adjusted path
import * as playerData from "../player/player.data"; // Adjusted path
import * as roundData from "./round.data";
import * as challengeData from "../challenge/challenge.data"; // Added challenge DAL
import { GameStatus, Game } from "../game/types";
import { TraceId } from "../core/types";
import { PlayerSongSubmission, RoundDocument, RoundUpdateData, SongNominationInput } from "./types"; // Added SongNominationInput
// Removed unused PredefinedSong import from "../challenge/types"

/**
 * Submits a player's rankings for the songs in the current round.
 * Contains the core business logic for ranking submission.
 * @param gameId The ID of the game.
 * @param playerId The ID of the player submitting rankings.
 * @param rankings An object mapping song IDs to rank numbers.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game/round state issues, or internal problems.
 */
export async function submitRankingService(
  gameId: string,
  playerId: string,
  rankings: { [songId: string]: number },
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: submitRankingService called.`, { gameId, playerId, rankingCount: Object.keys(rankings).length });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!playerId || typeof playerId !== "string") {
    throw new HttpsError("invalid-argument", "Player ID is required.");
  }
  if (!rankings || typeof rankings !== 'object' || Object.keys(rankings).length === 0) {
    throw new HttpsError("invalid-argument", "Rankings object is required and cannot be empty.");
  }
  // TODO: Add more specific validation for the rankings object:
  // - Check if all required songs are ranked.
  // - Check if ranks are consecutive and valid numbers.
  // - Check if player ranked their own song (if applicable).
  // --- End Input Validation ---

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Submit Ranking Service ${gameId}/${playerId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      const currentRoundNumber = currentGame.currentRound;
      if (!currentRoundNumber || currentRoundNumber <= 0) {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in an active round.`);
      }

      const currentRound = await roundData.getRoundByNumber(gameId, currentRoundNumber, traceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${currentRoundNumber} for game ${gameId} not found.`);
      }

      // Use getActivePlayers to count only those expected to submit
      const activePlayers = await playerData.getActivePlayers(gameId, traceId, transaction);
      const activePlayerCount = activePlayers.length;
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      const expectedGameStatus = `round${currentRoundNumber}_ranking`;
      if (currentGame.status !== expectedGameStatus) {
        throw new HttpsError("failed-precondition", `Game is not in the ranking phase (current: ${currentGame.status}).`);
      }
      if (currentRound.status !== "ranking") { // Assuming round status is updated to 'ranking' before this is called
        throw new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the ranking phase (current: ${currentRound.status}).`);
      }

      // Check if player has already submitted rankings
      const rankingExists = await roundData.checkPlayerRankingExists(gameId, currentRoundNumber, playerId, transaction, traceId);
      if (rankingExists) {
        throw new HttpsError("already-exists", `Player ${playerId} has already submitted rankings for round ${currentRoundNumber}.`);
      }
      // --- End Business Rule Checks ---


      // --- Read Existing Rankings (BEFORE writing new one) ---
      const existingRankingsSnapshot = await roundData.getAllRankingsForRound(gameId, currentRoundNumber, traceId, transaction); // Corrected order
      const existingSubmissionCount = existingRankingsSnapshot.size;
      logger.debug(`[${traceId}] Transaction: Found ${existingSubmissionCount} existing rankings.`);
      // --- End Read Existing Rankings ---


      // --- Update State (ALL WRITES) ---
      // 1. Add the current player's ranking document
      logger.debug(`[${traceId}] Transaction: Writing ranking document for player ${playerId}.`);
      const rankingData = { rankings }; // submittedAt added by DAL
      roundData.addRankingDocument(gameId, currentRoundNumber, playerId, rankingData, transaction, traceId);

      // 2. Check if this submission completes the round
      const newSubmissionCount = existingSubmissionCount + 1;
      logger.debug(`[${traceId}] Transaction (Submit Ranking Service ${gameId}/${playerId}): Ranking submission check - ${newSubmissionCount}/${activePlayerCount} active players.`);

      if (newSubmissionCount === activePlayerCount) {
        logger.info(`[${traceId}] All ${activePlayerCount} active players submitted rankings for round ${currentRoundNumber} in game ${gameId}. Updating status and triggering automatic scoring.`);
        // Update round status to scoring (or directly to finished if scoring is synchronous)
        // Let's keep 'scoring' for now, calculateScoresService will set it to 'finished'
        roundData.updateRoundDetails(gameId, currentRoundNumber, { status: "scoring" }, traceId, transaction); // Corrected order
        // Update game status
        gameData.updateGameDetails(gameId, { status: `round${currentRoundNumber}_scoring` as GameStatus }, traceId, transaction); // Corrected order
        logger.debug(`[${traceId}] Transaction (Submit Ranking Service ${gameId}/${playerId}): Updated round and game status to scoring.`);

        // Score calculation will be triggered separately based on status change.
      }
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Submit Ranking Service ${gameId}/${playerId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Player ${playerId} successfully submitted rankings for game ${gameId}.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: submitRankingService failed for player ${playerId} in game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while submitting rankings.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Starts the next round of the game.
 * Contains the core business logic for advancing rounds.
 * @param gameId The ID of the game.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, or internal problems.
 */
export async function startNextRoundService(
  gameId: string,
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: startNextRoundService called for game ${gameId}.`);

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  // --- End Input Validation ---

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Start Next Round Service ${gameId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      // Order players by join time to ensure consistent host rotation
      const playersSnapshot = await playerData.getAllPlayers(gameId, traceId, transaction); // Consider adding orderBy('joinedAt') if needed for strict rotation
      const playerDocs = playersSnapshot.docs;
      const playerCount = playerDocs.length;
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      if (!currentGame.status?.endsWith("_finished")) {
        // Allow starting next round only if the previous round is marked as finished
        throw new HttpsError("failed-precondition", `Game is not in a finished round state (current: ${currentGame.status}). Cannot start next round.`);
      }
      // Use totalRounds from settings
      const totalRounds = currentGame.settings?.rounds;
      if (!totalRounds) {
        logger.error(`[${traceId}] Missing rounds setting in game document ${gameId}.`);
        throw new HttpsError("internal", "Game configuration error (missing rounds).");
      }
      if (currentGame.currentRound >= totalRounds) {
        // Instead of throwing, update status to finished if this was the last round
        logger.info(`[${traceId}] Game ${gameId} reached final round ${currentGame.currentRound}. Setting status to finished.`);
        gameData.updateGameDetails(gameId, { status: "finished" }, traceId, transaction);
        // Exit the transaction function early as no new round is needed
        return;
      }
      if (playerCount === 0) {
        throw new HttpsError("internal", "Cannot start next round with zero players.");
      }
      // --- End Business Rule Checks ---


      // --- Determine Next Round Details ---
      const nextRoundNumber = currentGame.currentRound + 1;

      // Simple rotation for host: find current host index and go to the next one
      let nextHostId = currentGame.roundHostPlayerId; // Default to current if not found (shouldn't happen)
      if (currentGame.roundHostPlayerId) {
        const currentHostIndex = playerDocs.findIndex(doc => doc.id === currentGame.roundHostPlayerId);
        if (currentHostIndex !== -1) {
          const nextHostIndex = (currentHostIndex + 1) % playerCount;
          nextHostId = playerDocs[nextHostIndex].id;
        } else {
          logger.warn(`[${traceId}] Current host ${currentGame.roundHostPlayerId} not found in player list for rotation. Assigning random host.`);
          nextHostId = playerDocs[Math.floor(Math.random() * playerCount)].id; // Fallback
        }
      } else {
        logger.warn(`[${traceId}] No current host found. Assigning random host.`);
        nextHostId = playerDocs[Math.floor(Math.random() * playerCount)].id; // Fallback if no host was set
      }


      // TODO: Implement more dynamic challenge generation
      const nextChallenge = `Challenge for Round ${nextRoundNumber}!`;
      logger.debug(`[${traceId}] Transaction (Start Next Round Service ${gameId}): Determined next round: ${nextRoundNumber}, host: ${nextHostId}`);
      // --- End Determine Next Round Details ---


      // --- Update State ---
      // 1. Update Game Document
      // Step 1: Set intermediate transitioning status
      logger.debug(`[${traceId}] Transaction: Setting status to transitioning_to_announcing...`);
      gameData.updateGameDetails(gameId, { status: 'transitioning_to_announcing' as GameStatus }, traceId, transaction);
      logger.debug(`[${traceId}] Transaction: Intermediate status set.`);

      // Step 2: Set final status and round details
      const gameUpdates = {
        currentRound: nextRoundNumber,
        roundHostPlayerId: nextHostId,
        challenge: nextChallenge, // Challenge is now set here
        status: `round${nextRoundNumber}_announcing` as GameStatus, // Changed to announcing
      };
      gameData.updateGameDetails(gameId, gameUpdates, traceId, transaction); // Corrected order

      // 2. Create New Round Document
      const nextRoundData = {
        challenge: nextChallenge,
        hostPlayerId: nextHostId,
        status: "announcing" as const, // Changed: Round starts in announcement phase
        gameSongs: [],
        playerSongs: {},
        // createdAt added by DAL
      };
      roundData.createRoundDocument(gameId, nextRoundNumber, nextRoundData, transaction, traceId);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Start Next Round Service ${gameId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Successfully started next round for game ${gameId}.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: startNextRoundService failed for game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the next round.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Transitions a game from the challenge announcement phase to the song selection phase.
 * Contains the core business logic for starting song selection.
 * @param gameId The ID of the game.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, or internal problems.
 */
export async function startSelectionPhaseService(
  gameId: string,
  traceId: TraceId,
  callerPlayerId: string // Added for authorization
): Promise<void> {
  logger.info(`[${traceId}] Service: startSelectionPhaseService called for game ${gameId}.`, { callerPlayerId });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!callerPlayerId || typeof callerPlayerId !== "string") {
    throw new HttpsError("invalid-argument", "Player ID is required for authorization.");
  }
  // --- End Input Validation ---

  let currentGame: Game | null = null; // Use imported Game type

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Start Selection Phase Service ${gameId}): Starting.`);

      // --- Get Current State ---
      currentGame = await gameData.getGameById(gameId, traceId, transaction); // Assign inside transaction
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      const currentRoundNumber = currentGame.currentRound;
      if (!currentRoundNumber || currentRoundNumber <= 0) {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in an active round.`);
      }

      const currentRound = await roundData.getRoundByNumber(gameId, currentRoundNumber, traceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${currentRoundNumber} for game ${gameId} not found.`);
      }
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      const expectedGameStatusSuffix = "_announcing";
      if (!currentGame.status?.endsWith(expectedGameStatusSuffix)) {
        throw new HttpsError("failed-precondition", `Game is not in an announcing phase (current: ${currentGame.status}). Cannot start selection.`);
      }
      if (currentRound.status !== "announcing") {
        throw new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the announcing phase (current: ${currentRound.status}).`);
      }
      // Authorization check: Only the Round Host can start the selection phase
      // TODO: Replace this with UID check once authentication is implemented
      if (callerPlayerId !== currentGame.roundHostPlayerId) {
        logger.warn(`[${traceId}] Permission denied: Player ${callerPlayerId} is not the host (${currentGame.roundHostPlayerId}) for game ${gameId}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can start the song selection phase.");
      }
      // --- End Business Rule Checks ---


      // --- Update State ---
      // 1. Update Game Document Status
      // Step 1: Set intermediate transitioning status
      logger.debug(`[${traceId}] Transaction: Setting status to transitioning_to_selecting...`);
      gameData.updateGameDetails(gameId, { status: 'transitioning_to_selecting' as GameStatus }, traceId, transaction);
      logger.debug(`[${traceId}] Transaction: Intermediate status set.`);

      // Step 2: Set final status
      const nextGameStatus = `round${currentRoundNumber}_selecting` as GameStatus;
      gameData.updateGameDetails(gameId, { status: nextGameStatus }, traceId, transaction); // Corrected order


      // 2. Update Round Document Status
      const nextRoundStatus = "selecting_songs" as const;
      // Set selectionStartTime when updating round status
      const roundUpdates = {
        status: nextRoundStatus,
        selectionStartTime: FieldValue.serverTimestamp()
      };
      roundData.updateRoundDetails(gameId, currentRoundNumber, roundUpdates, traceId, transaction); // Corrected order
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Start Selection Phase Service ${gameId}): Writes completed. Status updated to ${nextGameStatus}.`);

      // Log success inside the transaction where currentGame is guaranteed non-null
      logger.info(`[${traceId}] Service: Successfully started selection phase for round ${currentGame.currentRound} in game ${gameId}.`); // Removed optional chaining as it's non-null here

    }); // --- End Transaction ---

  } catch (error) {
    logger.error(`[${traceId}] Service Error: startSelectionPhaseService failed for game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the selection phase.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Submits a player's song nomination for the current round using Spotify track details.
 * Contains the core business logic for song nomination.
 * @param gameId The ID of the game.
 * @param playerId The ID of the player submitting the song.
 * @param trackDetails An object containing spotifyTrackId, name, and artist.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game/round state issues, or internal problems.
 */
export async function submitSongNominationService(
  gameId: string,
  playerId: string,
  nominationInput: SongNominationInput, // Changed parameter name and type
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: submitSongNominationService called.`, { gameId, playerId, nominationInput });

  // --- Input Validation (basic, handler does more detailed structure check) ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!playerId || typeof playerId !== "string") {
    throw new HttpsError("invalid-argument", "Player ID is required.");
  }
  if (!nominationInput || typeof nominationInput !== 'object' || (!('searchResult' in nominationInput) && !('predefinedTrackId' in nominationInput))) {
    throw new HttpsError("invalid-argument", "Valid nomination input (searchResult or predefinedTrackId) is required.");
  }
  // --- End Input Validation ---

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Submit Nomination Service ${gameId}/${playerId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      const currentRoundNumber = currentGame.currentRound;
      if (!currentRoundNumber || currentRoundNumber <= 0) {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in an active round.`);
      }

      const currentRound = await roundData.getRoundByNumber(gameId, currentRoundNumber, traceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${currentRoundNumber} for game ${gameId} not found.`);
      }

      const activePlayers = await playerData.getActivePlayers(gameId, traceId, transaction);
      const activePlayerCount = activePlayers.length;
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      const expectedGameStatus = `round${currentRoundNumber}_selecting`;
      if (currentGame.status !== expectedGameStatus) {
        throw new HttpsError("failed-precondition", `Game is not in the song selection phase (current: ${currentGame.status}).`);
      }
      if (currentRound.status !== "selecting_songs") {
        throw new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the song selection phase (current: ${currentRound.status}).`);
      }

      // Check if player has already submitted a song for this round
      if (currentRound.playerSongs && currentRound.playerSongs[playerId]) {
        throw new HttpsError("already-exists", `Player ${playerId} has already submitted a song for round ${currentRoundNumber}.`);
      }
      // --- End Business Rule Checks ---


      // --- Read Existing Submissions (BEFORE writing new one) ---
      const existingSubmissionCount = currentRound.playerSongs ? Object.keys(currentRound.playerSongs).length : 0;
      logger.debug(`[${traceId}] Transaction: Found ${existingSubmissionCount} existing song submissions.`);
      // --- End Read Existing Submissions ---


      // --- Prepare Submission Data ---
      let submissionData: Omit<PlayerSongSubmission, "submittedAt">;

      if ('searchResult' in nominationInput) {
        logger.debug(`[${traceId}] Processing search result nomination.`);
        submissionData = nominationInput.searchResult;
        // Ensure previewUrl is present if provided from search
        if (!submissionData.previewUrl) {
           logger.warn(`[${traceId}] Nomination from search result is missing previewUrl.`, { trackId: submissionData.trackId });
           // Decide if this should be an error or just a warning
           // throw new HttpsError("invalid-argument", "Selected track from search is missing a preview URL.");
        }
      } else {
        logger.debug(`[${traceId}] Processing predefined track nomination: ${nominationInput.predefinedTrackId}`);
        if (!currentGame.challenge) {
          throw new HttpsError("failed-precondition", "Cannot nominate predefined song: Game has no current challenge text.");
        }
        const challengeDoc = await challengeData.getChallengeByText(currentGame.challenge, traceId, transaction);
        if (!challengeDoc || !challengeDoc.predefinedSongs) {
          throw new HttpsError("not-found", `Challenge details or predefined songs not found for "${currentGame.challenge}".`);
        }
        const predefinedSong = challengeDoc.predefinedSongs.find(song => song.trackId === nominationInput.predefinedTrackId);
        if (!predefinedSong) {
          throw new HttpsError("not-found", `Selected predefined track ID ${nominationInput.predefinedTrackId} not found in challenge "${currentGame.challenge}".`);
        }
         if (!predefinedSong.previewUrl) {
           logger.warn(`[${traceId}] Selected predefined track is missing previewUrl.`, { trackId: predefinedSong.trackId });
           // Decide if this should be an error or just a warning
           // throw new HttpsError("invalid-argument", "Selected predefined track is missing a preview URL.");
        }
        submissionData = {
          trackId: predefinedSong.trackId,
          name: predefinedSong.title,
          artist: predefinedSong.artist,
          previewUrl: predefinedSong.previewUrl, // Include preview URL
        };
      }
      // --- End Prepare Submission Data ---


      // --- Update State (ALL WRITES) ---
      // 1. Add the current player's song submission
      logger.debug(`[${traceId}] Transaction: Writing song submission for player ${playerId}.`, { submissionData });
      // The DAL function `addPlayerSongSubmission` handles adding the timestamp
      roundData.addPlayerSongSubmission(gameId, currentRoundNumber, playerId, submissionData, transaction, traceId);

      // 2. Check if this submission completes the song selection phase
      const newSubmissionCount = existingSubmissionCount + 1;
      logger.debug(`[${traceId}] Transaction (Submit Nomination Service ${gameId}/${playerId}): Submission check - ${newSubmissionCount}/${activePlayerCount} active players.`);

      // Get the updated playerSongs map AFTER adding the current submission
      // Construct the list of player songs *including* the current submission
      // Note: The current submission (`submissionData`) doesn't have a timestamp yet,
      // but PlayerSongSubmission.submittedAt is now optional.
      const currentSubmissions = currentRound.playerSongs ? Object.values(currentRound.playerSongs) : [];
      const allPlayerSubmissionsIncludingCurrent: PlayerSongSubmission[] = [
          ...currentSubmissions,
          { ...submissionData } // Add current submission (timestamp will be added on write by DAL)
      ];

      if (newSubmissionCount === activePlayerCount) {
        logger.info(`[${traceId}] All ${activePlayerCount} active players submitted songs for round ${currentRoundNumber}. Assembling final song pool and updating status to listening.`);

        // --- Assemble Final Song Pool ---
        // Use the locally constructed list
        const playerNominatedSongs = allPlayerSubmissionsIncludingCurrent;
        const playerNominatedTrackIds = new Set(playerNominatedSongs.map(song => song.trackId));
        let finalSongPool: PlayerSongSubmission[] = [...playerNominatedSongs]; // Start with player songs

        const neededSongs = Math.max(0, 5 - finalSongPool.length);
        logger.debug(`[${traceId}] Assembling final pool: ${finalSongPool.length} player songs, need ${neededSongs} more for minimum of 5.`);

        if (neededSongs > 0) {
          if (!currentGame.challenge) {
            throw new HttpsError("failed-precondition", "Cannot assemble final pool: Game has no current challenge text.");
          }
          const challengeDoc = await challengeData.getChallengeByText(currentGame.challenge, traceId, transaction);
          if (!challengeDoc || !challengeDoc.predefinedSongs || challengeDoc.predefinedSongs.length === 0) {
            logger.warn(`[${traceId}] Cannot add predefined songs: Challenge details or predefined songs not found/empty for "${currentGame.challenge}". Pool might be < 5.`);
          } else {
            const availablePredefined = challengeDoc.predefinedSongs.filter(
              song => !playerNominatedTrackIds.has(song.trackId) // Exclude songs already nominated
            );

            if (availablePredefined.length < neededSongs) {
               logger.warn(`[${traceId}] Not enough unique predefined songs available (${availablePredefined.length}) to reach 5 total songs. Adding all available.`);
            }

            // Shuffle available predefined songs to add variety
            const shuffledPredefined = availablePredefined.sort(() => 0.5 - Math.random());
            const songsToAdd = shuffledPredefined.slice(0, neededSongs);

            logger.debug(`[${traceId}] Adding ${songsToAdd.length} predefined songs to the pool.`);
            songsToAdd.forEach(song => {
              // Add predefined song, omitting submittedAt as it's optional
              finalSongPool.push({
                trackId: song.trackId,
                name: song.title,
                artist: song.artist,
                previewUrl: song.previewUrl,
                // submittedAt is omitted here
              });
            });
          }
        }
        logger.info(`[${traceId}] Final song pool size for ranking: ${finalSongPool.length}`);
        // --- End Assemble Final Song Pool ---


        // --- Update Statuses ---
        // Step 1: Set intermediate transitioning status
        logger.debug(`[${traceId}] Transaction: Setting status to transitioning_to_listening...`);
        gameData.updateGameDetails(gameId, { status: 'transitioning_to_listening' as GameStatus }, traceId, transaction);
        logger.debug(`[${traceId}] Transaction: Intermediate status set.`);

        // Step 2: Set final round and game status, including the final song pool
        const roundUpdates: RoundUpdateData = {
            status: "listening",
            songsForRanking: finalSongPool // Add the final list
        };
        roundData.updateRoundDetails(gameId, currentRoundNumber, roundUpdates, traceId, transaction);

        gameData.updateGameDetails(gameId, { status: `round${currentRoundNumber}_listening` as GameStatus }, traceId, transaction);
        // --- End Update Statuses ---
      }
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Submit Nomination Service ${gameId}/${playerId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Player ${playerId} successfully submitted song nomination for game ${gameId}.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: submitSongNominationService failed for player ${playerId} in game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while submitting the song nomination.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}


/**
 * Sets the challenge for the current round.
 * Contains the core business logic for setting the challenge.
 * @param gameId The ID of the game.
 * @param roundId The ID/number of the round (e.g., "1", "2").
 * @param callerPlayerId The Player ID of the user calling the function (temporary auth).
 * @param challenge The challenge string to set.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game/round state issues, authorization failures, or internal problems.
 */
export async function setChallengeService(
  gameId: string,
  roundId: string, // Keep as string to match handler/DAL expectations
  callerPlayerId: string, // Changed from callerUid
  challenge: string,
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: setChallengeService called.`, { gameId, roundId, callerPlayerId, challenge });

  // --- Input Validation (Basic - handler does more) ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!roundId || typeof roundId !== "string") {
    throw new HttpsError("invalid-argument", "Round ID is required.");
  }
  if (!callerPlayerId || typeof callerPlayerId !== "string") { // Changed from callerUid
    throw new HttpsError("invalid-argument", "Caller Player ID is required for authorization."); // Changed message
  }
  if (!challenge || typeof challenge !== "string" || challenge.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Challenge cannot be empty.");
  }
  // Length validation done in handler
  // --- End Input Validation ---

  const roundNumber = parseInt(roundId, 10);
  if (isNaN(roundNumber)) {
    logger.error(`[${traceId}] Invalid round ID format: ${roundId}`);
    throw new HttpsError("invalid-argument", "Round ID must be a valid number string.");
  }

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Set Challenge Service ${gameId}/${roundId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      if (currentGame.currentRound !== roundNumber) {
        throw new HttpsError("failed-precondition", `Attempting to set challenge for round ${roundNumber}, but game is currently in round ${currentGame.currentRound}.`);
      }

      const currentRound = await roundData.getRoundByNumber(gameId, roundNumber, traceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${roundNumber} for game ${gameId} not found.`);
      }
      // --- End Get Current State ---


      // --- Business Rule & Authorization Checks ---
      const expectedGameStatus = `round${roundNumber}_announcing`;
      if (currentGame.status !== expectedGameStatus) {
        throw new HttpsError("failed-precondition", `Game is not in the challenge announcement phase (current: ${currentGame.status}).`);
      }
      if (currentRound.status !== "announcing") {
        throw new HttpsError("failed-precondition", `Round ${roundNumber} is not in the announcing phase (current: ${currentRound.status}).`);
      }

      // Authorization: Check if the caller's playerId matches the round's hostPlayerId
      // TODO: Replace this with UID check once authentication is implemented
      if (callerPlayerId !== currentRound.hostPlayerId) {
        logger.warn(`[${traceId}] Authorization failed: Caller ${callerPlayerId} is not the host (${currentRound.hostPlayerId}) for round ${roundNumber}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can set the challenge.");
      }
      if (currentRound.status !== "announcing") {
        throw new HttpsError("failed-precondition", `Round ${roundNumber} is not in the announcing phase (current: ${currentRound.status}).`);
      }

      // Authorization: Check if caller is the host for this round
      if (currentRound.hostPlayerId !== callerPlayerId) { // Corrected variable name
        logger.warn(`[${traceId}] Authorization failed: Caller ${callerPlayerId} is not the host (${currentRound.hostPlayerId}) for round ${roundNumber}.`); // Corrected variable name
        throw new HttpsError("permission-denied", "Only the Round Host can set the challenge.");
      }

      // Check if challenge is already set
      if (currentRound.challenge && currentRound.challenge.trim().length > 0) {
        logger.warn(`[${traceId}] Challenge already set for round ${roundNumber} to: "${currentRound.challenge}".`);
        throw new HttpsError("failed-precondition", `The challenge for round ${roundNumber} has already been set.`);
      }
      // --- End Business Rule & Authorization Checks ---


      // --- Update State (ALL WRITES) ---
      const updates = { challenge: challenge.trim() };

      // 1. Update Round Document
      logger.debug(`[${traceId}] Transaction: Updating challenge for round ${roundNumber}.`);
      roundData.updateRoundDetails(gameId, roundNumber, updates, traceId, transaction);

      // 2. Update Game Document (optional, but useful for display)
      // Note: Game status remains '_announcing' until host explicitly starts selection phase
      logger.debug(`[${traceId}] Transaction: Updating challenge in game document.`);
      gameData.updateGameDetails(gameId, updates, traceId, transaction);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Set Challenge Service ${gameId}/${roundId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Successfully set challenge for round ${roundId} in game ${gameId}.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: setChallengeService failed for game ${gameId}, round ${roundId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while setting the challenge.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}


/**
 * Transitions a game from the listening phase to the ranking phase.
 * Contains the core business logic for starting ranking.
 * @param gameId The ID of the game.
 * @param callerUid The UID of the user calling the function.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, authorization failures, or internal problems.
 */
export async function startRankingPhaseService(
  gameId: string,
  callerPlayerId: string, // Changed parameter name
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: startRankingPhaseService called for game ${gameId} by ${callerPlayerId}.`);

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!callerPlayerId || typeof callerPlayerId !== "string") { // Changed callerUid to callerPlayerId
    throw new HttpsError("invalid-argument", "Caller Player ID is required for authorization."); // Changed message
  }
  // --- End Input Validation ---

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Start Ranking Phase Service ${gameId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      const currentRoundNumber = currentGame.currentRound;
      if (!currentRoundNumber || currentRoundNumber <= 0) {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in an active round.`);
      }
      // --- End Get Current State ---


      // --- Business Rule & Authorization Checks ---
      const expectedGameStatus = `round${currentRoundNumber}_listening`;
      if (currentGame.status !== expectedGameStatus) {
        throw new HttpsError("failed-precondition", `Game is not in the listening phase (current: ${currentGame.status}). Cannot start ranking.`);
      }
      // Authorization: Check if caller is the host for this round
      // TODO: Replace this with UID check once authentication is implemented
      if (currentGame.roundHostPlayerId !== callerPlayerId) {
        logger.warn(`[${traceId}] Authorization failed: Caller Player ID (${callerPlayerId}) is not the host (${currentGame.roundHostPlayerId}) for round ${currentRoundNumber}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can start the ranking phase.");
      }


      /**
       * Allows the round host to control the synchronized playback state.
       * @param gameId The ID of the game.
       * @param callerUid The UID of the user calling the function.
       * @param action The playback action ('play', 'pause', 'next', 'prev', 'seekToIndex').
       * @param targetIndex Optional index for 'seekToIndex' action.
       * @param traceId For logging purposes.
       * @throws HttpsError for validation errors, game state issues, authorization failures, or internal problems.
       */
      // --- End Business Rule & Authorization Checks ---


      // --- Update State ---
      // 1. Update Game Document Status
      // Step 1: Set intermediate transitioning status
      logger.debug(`[${traceId}] Transaction: Setting status to transitioning_to_ranking...`);
      gameData.updateGameDetails(gameId, { status: 'transitioning_to_ranking' as GameStatus }, traceId, transaction);
      logger.debug(`[${traceId}] Transaction: Intermediate status set.`);

      // Step 2: Set final status
      const nextGameStatus = `round${currentRoundNumber}_ranking` as GameStatus;
      gameData.updateGameDetails(gameId, { status: nextGameStatus }, traceId, transaction); // Corrected order

      // 2. Update Round Document Status and set rankingStartTime
      const roundUpdates: RoundUpdateData = {
        status: "ranking",
        rankingStartTime: FieldValue.serverTimestamp()
      };
      roundData.updateRoundDetails(gameId, currentRoundNumber, roundUpdates, traceId, transaction);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Start Ranking Phase Service ${gameId}): Writes completed. Status updated to ${nextGameStatus}.`);
    }); // --- End Transaction --- Correctly placed closing brace for transaction

    logger.info(`[${traceId}] Service: Successfully started ranking phase for game ${gameId}.`); // This log is now correctly outside the transaction but inside the try block

  } catch (error) { // This catch correctly corresponds to the try block starting on line 578
    logger.error(`[${traceId}] Service Error: startRankingPhaseService failed for game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the ranking phase.", { originalError: error instanceof Error ? error.message : String(error) });
  }
} // This brace correctly closes the startRankingPhaseService function


/**
 * Allows the round host to control the synchronized playback state.
 * @param gameId The ID of the game.
 * @param callerUid The UID of the user calling the function.
 * @param action The playback action ('play', 'pause', 'next', 'prev', 'seekToIndex').
 * @param targetIndex Optional index for 'seekToIndex' action.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, authorization failures, or internal problems.
 */
export async function controlPlaybackService(
  gameId: string,
  callerUid: string,
  action: 'play' | 'pause' | 'next' | 'prev' | 'seekToIndex',
  targetIndex: number | undefined | null, // Only used for seekToIndex
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: controlPlaybackService called.`, { gameId, callerUid, action, targetIndex });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!callerUid || typeof callerUid !== "string") {
    throw new HttpsError("invalid-argument", "Caller UID is required for authorization.");
  }
  const validActions = ['play', 'pause', 'next', 'prev', 'seekToIndex'];
  if (!action || !validActions.includes(action)) {
    throw new HttpsError("invalid-argument", `Invalid playback action specified: ${action}. Must be one of ${validActions.join(', ')}.`);
  }
  if (action === 'seekToIndex' && (targetIndex === undefined || targetIndex === null || typeof targetIndex !== 'number' || !Number.isInteger(targetIndex) || targetIndex < 0)) {
    throw new HttpsError("invalid-argument", "A valid non-negative integer 'targetIndex' is required for the 'seekToIndex' action.");
  }
  // --- End Input Validation ---

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Control Playback Service ${gameId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      const currentRoundNumber = currentGame.currentRound;
      if (!currentRoundNumber || currentRoundNumber <= 0) {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in an active round.`);
      }
      const currentRound = await roundData.getRoundByNumber(gameId, currentRoundNumber, traceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${currentRoundNumber} for game ${gameId} not found.`);
      }
      // --- End Get Current State ---


      // --- Business Rule & Authorization Checks ---
      const expectedGameStatus = `round${currentRoundNumber}_listening`;
      if (currentGame.status !== expectedGameStatus) {
        throw new HttpsError("failed-precondition", `Game is not in the listening phase (current: ${currentGame.status}). Cannot control playback.`);
      }
      // Authorization: Check if caller is the host for this round
      if (currentGame.roundHostPlayerId !== callerUid) {
        logger.warn(`[${traceId}] Authorization failed: Caller ${callerUid} is not the host (${currentGame.roundHostPlayerId}) for round ${currentRoundNumber}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can control playback.");
      }
      // --- End Business Rule & Authorization Checks ---

      // --- Calculate New Playback State ---
      const currentPlayingIndex = currentRound.currentPlayingTrackIndex ?? 0; // Default to 0 if undefined
      const currentIsPlaying = currentRound.isPlaying ?? false; // Default to false if undefined
      const numTracks = currentRound.playerSongs ? Object.keys(currentRound.playerSongs).length : 0; // Or however tracks are stored/counted

      let nextPlayingIndex = currentPlayingIndex;
      let nextIsPlaying = currentIsPlaying;

      switch (action) {
        case 'play':
          nextIsPlaying = true;
          break;
        case 'pause':
          nextIsPlaying = false;
          break;
        case 'next':
          if (numTracks > 0) {
            nextPlayingIndex = (currentPlayingIndex + 1) % numTracks;
          }
          // Keep isPlaying state unless explicitly paused
          break;
        case 'prev':
          if (numTracks > 0) {
            nextPlayingIndex = (currentPlayingIndex - 1 + numTracks) % numTracks;
          }
          // Keep isPlaying state unless explicitly paused
          break;
        case 'seekToIndex':
          // Validate targetIndex against number of tracks
          if (targetIndex! >= 0 && targetIndex! < numTracks) {
            nextPlayingIndex = targetIndex!;
          } else {
            logger.warn(`[${traceId}] Invalid targetIndex ${targetIndex} for seekToIndex (numTracks: ${numTracks}). Ignoring seek.`);
            // Don't change index if invalid
          }
          // Keep isPlaying state unless explicitly paused
          break;
      }

      const updates: Partial<RoundDocument> = {};
      if (nextPlayingIndex !== currentPlayingIndex) {
        updates.currentPlayingTrackIndex = nextPlayingIndex;
      }
      if (nextIsPlaying !== currentIsPlaying) {
        updates.isPlaying = nextIsPlaying;
      }
      // --- End Calculate New Playback State ---


      // --- Update State ---
      if (Object.keys(updates).length > 0) {
        logger.debug(`[${traceId}] Transaction (Control Playback Service ${gameId}): Updating round playback state:`, updates);
        roundData.updateRoundDetails(gameId, currentRoundNumber, updates, traceId, transaction);
      } else {
        logger.debug(`[${traceId}] Transaction (Control Playback Service ${gameId}): No playback state changes needed for action '${action}'.`);
      }
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Control Playback Service ${gameId}): Writes completed (if any).`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Successfully processed playback control action '${action}' for game ${gameId}.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: controlPlaybackService failed for game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while controlling playback.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}