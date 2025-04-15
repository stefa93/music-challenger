import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../core/firestoreClient";
import { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Import Timestamp directly
import { getMusicProvider } from "../music/music.service";
import * as gameData from "../game/game.data"; // Adjusted path
import * as playerData from "../player/player.data"; // Adjusted path
import * as roundData from "./round.data";
import * as challengeData from "../challenge/challenge.data"; // Added challenge DAL
import { GameStatus, Game } from "../game/types";
import { TraceId } from "../core/types";
import { PlayerSongSubmission, RoundUpdateData, SongNominationInput } from "./types"; // Added SongNominationInput
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

  } catch (caughtError) { // Use a different variable name
    logger.error(`[${traceId}] Service Error: submitRankingService failed for player ${playerId} in game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while submitting rankings.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
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

  } catch (caughtError) { // Use a different variable name
    logger.error(`[${traceId}] Service Error: startNextRoundService failed for game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the next round.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
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

  } catch (caughtError) { // Use a different variable name
    logger.error(`[${traceId}] Service Error: startSelectionPhaseService failed for game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the selection phase.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
  }
}

/**
 * Submits a player's song nomination for the current round.
 * Contains the core business logic for song nomination.
 * @param gameId The ID of the game.
 * @param playerId The ID of the player submitting the song.
 * @param nominationInput An object containing either searchResult or predefinedTrackId.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game/round state issues, or internal problems.
 */
export async function submitSongNominationService(
  gameId: string,
  playerId: string,
  nominationInput: SongNominationInput,
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: submitSongNominationService called.`, { gameId, playerId, nominationInput });

  // --- Input Validation ---
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
        // Ensure the required fields are present, INCLUDING previewUrl
        const { trackId, name, artist, previewUrl, albumImageUrl } = nominationInput.searchResult;
        if (!trackId || !name || !artist) {
            throw new HttpsError("invalid-argument", "Search result nomination is missing required fields (trackId, name, artist).");
        }
        if (!previewUrl) { // Explicitly check for previewUrl here
             logger.error(`[${traceId}] Nomination from search result is missing required previewUrl.`, { trackId: trackId });
             throw new HttpsError("invalid-argument", "Selected track from search must have a preview URL.");
        }
        submissionData = {
            trackId,
            name,
            artist,
            previewUrl, // Now guaranteed to be string
            albumImageUrl,
        };
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
        // Check previewUrl strictly for predefined songs too
         if (!predefinedSong.previewUrl) {
           logger.error(`[${traceId}] Selected predefined track is missing required previewUrl in Firestore.`, { trackId: predefinedSong.trackId });
           // This indicates an issue with the populated data, treat as an error.
           throw new HttpsError("failed-precondition", "Selected predefined track data is incomplete (missing preview URL).");
        }
        submissionData = {
          trackId: predefinedSong.trackId,
          name: predefinedSong.title, // Map title to name
          artist: predefinedSong.artist,
          previewUrl: predefinedSong.previewUrl, // Include preview URL
          albumImageUrl: predefinedSong.albumImageUrl, // Include album image URL
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

      if (newSubmissionCount === activePlayerCount && activePlayerCount > 0) {
        logger.info(`[${traceId}] All ${activePlayerCount} active players submitted songs for round ${currentRoundNumber}. Refreshing previews, assembling final song pool, and updating status to listening.`);

        let minExpiration = Infinity;
        const updatedPlayerSongs: { [playerId: string]: PlayerSongSubmission } = {}; // To store refreshed songs

        // --- Refresh Previews for Player Nominations ---
        // Create a map of existing submissions for easier lookup
        const existingPlayerSongsMap = currentRound.playerSongs || {};

        // Include the current submission in the map to ensure it's processed
        existingPlayerSongsMap[playerId] = { ...submissionData, submittedAt: Timestamp.now() }; // Use direct Timestamp

        // Get music provider inside transaction scope
        const musicProvider = getMusicProvider(); // Get provider instance outside map

        const refreshPromises = Object.entries(existingPlayerSongsMap).map(async ([pId, submission]) => {
           if (!submission?.trackId) return null; // Skip if no trackId

           // Check provider *inside* the callback for TypeScript certainty
           if (!musicProvider) {
               logger.error(`[${traceId}] Music provider became unavailable during refresh loop.`);
               return submission; // Return original submission if provider is gone
           }

           try {
             // Use non-null assertion operator (!) after the null check
             // Check if the provider implements getTrackDetails before calling
             if (typeof musicProvider.getTrackDetails !== 'function') {
                 logger.warn(`[${traceId}] Music provider does not support getTrackDetails. Cannot refresh preview for track ${submission.trackId}.`);
                 return submission; // Return original if method not supported
             }
             const freshDetails = await musicProvider.getTrackDetails(submission.trackId, traceId);
             if (freshDetails?.previewUrl) {
               const expiration = parseExpirationFromUrl(freshDetails.previewUrl);
               if (expiration) {
                 minExpiration = Math.min(minExpiration, expiration);
               } else {
                  logger.warn(`[${traceId}] Could not parse expiration from refreshed preview URL for track ${submission.trackId}. Using default short duration.`);
                  minExpiration = Math.min(minExpiration, Date.now() / 1000 + 30);
               }
               // Update the submission data with the fresh preview URL and ensure correct structure
               updatedPlayerSongs[pId] = {
                 trackId: freshDetails.trackId,
                 name: freshDetails.name,
                 artist: freshDetails.artistName, // Map artistName
                 previewUrl: freshDetails.previewUrl,
                 albumImageUrl: freshDetails.albumImageUrl, // Now allowed by type
                 submittedAt: submission.submittedAt || Timestamp.now() // Use direct Timestamp
               };
               return updatedPlayerSongs[pId]; // Return updated data
             } else {
               // If refresh fails or returns no preview, EXCLUDE the song
               logger.warn(`[${traceId}] Could not refresh preview URL for track ${submission.trackId}. Excluding from this round's playback.`);
               // Do not add to updatedPlayerSongs, effectively removing it
               return null; // Indicate removal
             }
           } catch (fetchError) {
             logger.error(`[${traceId}] Error refreshing track details for ${submission.trackId}:`, fetchError);
             // Exclude on error as well
             logger.warn(`[${traceId}] Excluding track ${submission.trackId} due to error during preview refresh.`);
             return null; // Indicate removal
           }
        });

        await Promise.all(refreshPromises);
        logger.debug(`[${traceId}] Finished refreshing preview URLs. Minimum expiration timestamp (Unix seconds): ${minExpiration === Infinity ? 'N/A' : minExpiration}`);

        // --- Assemble Final Song Pool using refreshed data ---
        const refreshedPlayerSongs = Object.values(updatedPlayerSongs).filter(Boolean) as PlayerSongSubmission[]; // Filter out nulls
        const playerNominatedTrackIds = new Set(refreshedPlayerSongs.map(song => song.trackId));
        let finalSongPool: PlayerSongSubmission[] = [...refreshedPlayerSongs]; // Start with refreshed player songs

        const neededSongs = Math.max(0, 5 - finalSongPool.length); // Ensure minimum 5 songs
        logger.debug(`[${traceId}] Assembling final pool: ${finalSongPool.length} refreshed player songs, need ${neededSongs} more.`);

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
            // Map predefined songs to PlayerSongSubmission structure
            const songsToAdd = shuffledPredefined.slice(0, neededSongs).map(pSong => ({
                trackId: pSong.trackId,
                name: pSong.title, // Map title to name
                artist: pSong.artist,
                previewUrl: pSong.previewUrl,
                albumImageUrl: pSong.albumImageUrl, // Map albumImageUrl
                // Predefined songs don't have a submitter or timestamp in this context
            }));

            // Add predefined songs to the pool
            finalSongPool = [...finalSongPool, ...songsToAdd];
            logger.debug(`[${traceId}] Added ${songsToAdd.length} predefined songs to the pool.`);

            // Log details of added predefined songs
            songsToAdd.forEach(song => {
                logger.debug(`[${traceId}] Added predefined song: ${song.name} by ${song.artist} (ID: ${song.trackId})`);
            });
          }
        }

        // Shuffle the final pool before saving
        finalSongPool = finalSongPool.sort(() => 0.5 - Math.random());
        logger.debug(`[${traceId}] Final song pool assembled with ${finalSongPool.length} songs.`);

        // 3. Update round status, song pool, player songs (with refreshed URLs), and playback end time
        const playbackEndTime = minExpiration !== Infinity
            ? Timestamp.fromMillis(minExpiration * 1000) // Use direct Timestamp
            : Timestamp.fromMillis(Date.now() + 30000); // Use direct Timestamp

        logger.info(`[${traceId}] Setting playback end time to: ${playbackEndTime.toDate().toISOString()}`);

        // Prepare the update data, ensuring finalSongPool is part of RoundUpdateData
        // Prepare the update data, including setting isPlaying to true
        const roundUpdates: RoundUpdateData = {
          status: "listening",
          playerSongs: updatedPlayerSongs, // Store the map with refreshed data
          playbackEndTime: playbackEndTime, // Add the calculated end time
          songsForRanking: finalSongPool, // Assuming final pool is used for ranking
          isPlaying: true, // Set playback to start automatically
        };

        roundData.updateRoundDetails(gameId, currentRoundNumber, roundUpdates, traceId, transaction); // Pass traceId and transaction

        // Update game status
        gameData.updateGameDetails(gameId, { status: `round${currentRoundNumber}_listening` as GameStatus }, traceId, transaction); // Corrected order
        logger.debug(`[${traceId}] Transaction (Submit Nomination Service ${gameId}/${playerId}): Updated round and game status to listening.`);

      }
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Submit Nomination Service ${gameId}/${playerId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Player ${playerId} successfully submitted song nomination for game ${gameId}.`);

  } catch (caughtError) { // Use the correct variable name 'caughtError'
    logger.error(`[${traceId}] Service Error: submitSongNominationService failed for player ${playerId} in game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while submitting the song nomination.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
  }
}

// Helper function to parse expiration timestamp from Deezer preview URL
function parseExpirationFromUrl(url: string): number | null {
  try {
    const urlParams = new URLSearchParams(new URL(url).search);
    const hdnea = urlParams.get('hdnea');
    if (!hdnea) return null;

    const expMatch = hdnea.match(/exp=(\d+)/);
    if (expMatch && expMatch[1]) {
      return parseInt(expMatch[1], 10); // Unix timestamp in seconds
    }
    return null;
  } catch (e) {
    // Use the correct variable name 'e' for the caught error
    logger.error("Error parsing expiration from URL:", url, e);
    return null;
  }
}

/**
 * Sets the challenge for the current round. Only callable by the round host.
 * @param gameId The ID of the game.
 * @param playerId The ID of the player attempting to set the challenge (must be host).
 * @param challengeText The text of the challenge.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, or internal problems.
 */
export async function setChallengeService(
  gameId: string,
  playerId: string,
  challengeText: string,
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: setChallengeService called.`, { gameId, playerId, challengeText });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!playerId || typeof playerId !== "string") {
    throw new HttpsError("invalid-argument", "Player ID is required.");
  }
  if (!challengeText || typeof challengeText !== "string" || challengeText.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Challenge text cannot be empty.");
  }
  // --- End Input Validation ---

  let currentGame: Game | null = null; // Define currentGame here

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Set Challenge Service ${gameId}/${playerId}): Starting.`);

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
        throw new HttpsError("failed-precondition", `Game is not in an announcing phase (current: ${currentGame.status}). Cannot set challenge.`);
      }
       if (currentRound.status !== "announcing") {
        throw new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the announcing phase (current: ${currentRound.status}).`);
      }
      // Authorization check: Only the Round Host can set the challenge
      if (playerId !== currentGame.roundHostPlayerId) {
        logger.warn(`[${traceId}] Permission denied: Player ${playerId} is not the host (${currentGame.roundHostPlayerId}) for game ${gameId}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can set the challenge.");
      }
      // --- End Business Rule Checks ---


      // --- Update State ---
      // 1. Update Game Document
      gameData.updateGameDetails(gameId, { challenge: challengeText }, traceId, transaction);

      // 2. Update Round Document
      roundData.updateRoundDetails(gameId, currentRoundNumber, { challenge: challengeText }, traceId, transaction);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Set Challenge Service ${gameId}/${playerId}): Writes completed.`);
      // Log success inside the transaction
      logger.info(`[${traceId}] Service: Player ${playerId} successfully set challenge for round ${currentGame.currentRound} in game ${gameId}.`);
    }); // --- End Transaction ---

    // Moved log inside transaction where currentGame is guaranteed non-null

  } catch (caughtError) { // Use a different variable name
    logger.error(`[${traceId}] Service Error: setChallengeService failed for player ${playerId} in game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while setting the challenge.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
  }
}


/**
 * Transitions a game from the listening phase to the ranking phase.
 * Contains the core business logic for starting ranking.
 * @param gameId The ID of the game.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, or internal problems.
 */
export async function startRankingPhaseService(
  gameId: string,
  traceId: TraceId,
  callerPlayerId: string // Added for authorization
): Promise<void> {
  logger.info(`[${traceId}] Service: startRankingPhaseService called for game ${gameId}.`, { callerPlayerId });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
   if (!callerPlayerId || typeof callerPlayerId !== "string") {
    throw new HttpsError("invalid-argument", "Player ID is required for authorization.");
  }
  // --- End Input Validation ---

  let currentGame: Game | null = null;

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Start Ranking Phase Service ${gameId}): Starting.`);

      // --- Get Current State ---
      currentGame = await gameData.getGameById(gameId, traceId, transaction);
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
      const expectedGameStatusSuffix = "_listening";
      if (!currentGame.status?.endsWith(expectedGameStatusSuffix)) {
        throw new HttpsError("failed-precondition", `Game is not in a listening phase (current: ${currentGame.status}). Cannot start ranking.`);
      }
       if (currentRound.status !== "listening") {
        throw new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the listening phase (current: ${currentRound.status}).`);
      }
      // Authorization check: Only the Round Host can start the ranking phase
      if (callerPlayerId !== currentGame.roundHostPlayerId) {
        logger.warn(`[${traceId}] Permission denied: Player ${callerPlayerId} is not the host (${currentGame.roundHostPlayerId}) for game ${gameId}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can start the ranking phase.");
      }
      // --- End Business Rule Checks ---


      // --- Update State ---
      // 1. Update Game Document Status
      const nextGameStatus = `round${currentRoundNumber}_ranking` as GameStatus;
      gameData.updateGameDetails(gameId, { status: nextGameStatus }, traceId, transaction);

      // 2. Update Round Document Status and set rankingStartTime
      const roundUpdates = {
        status: "ranking" as const,
        rankingStartTime: FieldValue.serverTimestamp()
      };
      roundData.updateRoundDetails(gameId, currentRoundNumber, roundUpdates, traceId, transaction);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Start Ranking Phase Service ${gameId}): Writes completed. Status updated to ${nextGameStatus}.`);
      // Log success inside the transaction
      logger.info(`[${traceId}] Service: Successfully started ranking phase for round ${currentGame.currentRound} in game ${gameId}.`);
    }); // --- End Transaction --- Correctly placed closing brace for transaction

    // Moved log inside transaction where currentGame is guaranteed non-null

  } catch (caughtError) { // This catch correctly corresponds to the try block starting on line 980
    logger.error(`[${traceId}] Service Error: startRankingPhaseService failed for game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the ranking phase.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
  }
} // This brace correctly closes the startRankingPhaseService function


/**
 * Controls the playback state for the listening phase (e.g., next, previous song).
 * @param gameId The ID of the game.
 * @param playerId The ID of the player initiating the action (must be host).
 * @param action The playback action ('next', 'prev', 'seekToIndex').
 * @param index Optional index for 'seekToIndex'.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation errors, game state issues, or internal problems.
 */
export async function controlPlaybackService(
  gameId: string,
  playerId: string,
  action: 'next' | 'prev' | 'seekToIndex' | 'play' | 'pause', // Add play/pause
  index?: number, // Optional index for seekToIndex
  traceId?: TraceId
): Promise<void> {
  const effectiveTraceId = traceId || `controlPlayback_${Date.now()}`;
  logger.info(`[${effectiveTraceId}] Service: controlPlaybackService called.`, { gameId, playerId, action, index });

  // --- Input Validation ---
  if (!gameId || typeof gameId !== "string") {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  if (!playerId || typeof playerId !== "string") {
    throw new HttpsError("invalid-argument", "Player ID is required.");
  }
  // Allow play/pause actions now
  if (!action || !['next', 'prev', 'seekToIndex', 'play', 'pause'].includes(action)) {
    throw new HttpsError("invalid-argument", "Invalid playback action specified.");
  }
  if (action === 'seekToIndex' && (typeof index !== 'number' || index < 0)) {
     throw new HttpsError("invalid-argument", "Valid index is required for 'seekToIndex' action.");
  }
  // --- End Input Validation ---

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${effectiveTraceId}] Transaction (Control Playback Service ${gameId}/${playerId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, effectiveTraceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }
      const currentRoundNumber = currentGame.currentRound;
      if (!currentRoundNumber || currentRoundNumber <= 0) {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in an active round.`);
      }
      const currentRound = await roundData.getRoundByNumber(gameId, currentRoundNumber, effectiveTraceId, transaction);
      if (!currentRound) {
        throw new HttpsError("not-found", `Round ${currentRoundNumber} for game ${gameId} not found.`);
      }
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      const expectedGameStatusSuffix = "_listening";
      if (!currentGame.status?.endsWith(expectedGameStatusSuffix)) {
        throw new HttpsError("failed-precondition", `Game is not in a listening phase (current: ${currentGame.status}). Cannot control playback.`);
      }
      if (currentRound.status !== "listening") {
        throw new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the listening phase (current: ${currentRound.status}).`);
      }
      // Authorization check: Only the Round Host can control playback
      if (playerId !== currentGame.roundHostPlayerId) {
        logger.warn(`[${effectiveTraceId}] Permission denied: Player ${playerId} is not the host (${currentGame.roundHostPlayerId}) for game ${gameId}.`);
        throw new HttpsError("permission-denied", "Only the Round Host can control playback.");
      }
      // Use songsForRanking as the primary source for the playback pool
      const songPool = currentRound.songsForRanking || [];
      if (!songPool || songPool.length === 0) {
         throw new HttpsError("failed-precondition", "Cannot control playback: Song pool is empty.");
      }
      // --- End Business Rule Checks ---


      // --- Calculate Next State ---
      let currentPlayingIndex = currentRound.currentPlayingTrackIndex ?? 0; // Default to 0 if undefined
      let nextPlayingIndex = currentPlayingIndex;

      let nextIsPlaying = currentRound.isPlaying ?? false; // Get current playing state

      switch (action) {
        case 'play':
          nextIsPlaying = true;
          logger.debug(`[${effectiveTraceId}] Action 'play': Setting isPlaying to true.`);
          break;
        case 'pause':
          nextIsPlaying = false;
          logger.debug(`[${effectiveTraceId}] Action 'pause': Setting isPlaying to false.`);
          break;
        case 'next':
          nextPlayingIndex = (currentPlayingIndex + 1) % songPool.length;
          nextIsPlaying = true; // Assume play on track change
          logger.debug(`[${effectiveTraceId}] Action 'next': Moving from index ${currentPlayingIndex} to ${nextPlayingIndex}, setting isPlaying to true.`);
          break;
        case 'prev':
          nextPlayingIndex = (currentPlayingIndex - 1 + songPool.length) % songPool.length;
          nextIsPlaying = true; // Assume play on track change
           logger.debug(`[${effectiveTraceId}] Action 'prev': Moving from index ${currentPlayingIndex} to ${nextPlayingIndex}, setting isPlaying to true.`);
          break;
        case 'seekToIndex':
          if (index !== undefined && index >= 0 && index < songPool.length) {
            nextPlayingIndex = index;
            nextIsPlaying = true; // Assume play on seek
             logger.debug(`[${effectiveTraceId}] Action 'seekToIndex': Moving from index ${currentPlayingIndex} to ${nextPlayingIndex}, setting isPlaying to true.`);
          } else {
             logger.warn(`[${effectiveTraceId}] Invalid index ${index} provided for 'seekToIndex'. Keeping current index ${currentPlayingIndex}.`);
             // Keep nextPlayingIndex as currentPlayingIndex if index is invalid
          }
          break;
      }
      // --- End Calculate Next State ---


      // --- Update State ---
      const roundUpdates: RoundUpdateData = {};
      if (nextPlayingIndex !== currentPlayingIndex) {
          roundUpdates.currentPlayingTrackIndex = nextPlayingIndex;
      }
      // Always update isPlaying based on the action outcome
      roundUpdates.isPlaying = nextIsPlaying;

      // Only update if there are changes
      if (Object.keys(roundUpdates).length > 0) {
      } else {
          logger.debug(`[${effectiveTraceId}] No state changes needed for action '${action}'.`);
      };
      roundData.updateRoundDetails(gameId, currentRoundNumber, roundUpdates, effectiveTraceId, transaction);
      // --- End Update State ---

      logger.debug(`[${effectiveTraceId}] Transaction (Control Playback Service ${gameId}/${playerId}): Writes completed. Updates:`, roundUpdates);
    }); // --- End Transaction ---

    logger.info(`[${effectiveTraceId}] Service: Successfully processed playback control action '${action}' for game ${gameId}.`);

  } catch (caughtError) { // Use a different variable name
    logger.error(`[${effectiveTraceId}] Service Error: controlPlaybackService failed for game ${gameId}:`, { error: caughtError });
    if (caughtError instanceof HttpsError) {
      throw caughtError; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while controlling playback.", { originalError: caughtError instanceof Error ? caughtError.message : String(caughtError) });
  }
}