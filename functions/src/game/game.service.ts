import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../core/firestoreClient"; // Adjusted path
import { FieldValue, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore'; // Import FieldValue, QueryDocumentSnapshot, and DocumentData directly
import * as gameData from "./game.data"; // Adjusted path
import * as playerData from "../player/player.data"; // Adjusted path (Anticipating move)
// import { PlayerDocument } from "../player/types"; // Adjusted path (Anticipating move) - Keep commented until player types are resolved
import * as roundData from "../round/round.data"; // Adjusted path (Anticipating move)
import { GameStatus, GameSettings } from "./types"; // Adjusted path
import { TraceId } from "../core/types"; // Adjusted path
import { MAX_PLAYER_NAME_LENGTH, MIN_PLAYERS_TO_START, MIN_ROUNDS, MAX_ROUNDS, MAX_PLAYERS, VALID_ROUNDS, VALID_MAX_PLAYERS, VALID_TIME_LIMITS } from "../core/constants"; // Adjusted path

/**
 * Creates a new game and adds the creator as the first player.
 * Contains the core business logic for game creation.
 * @param playerName The name of the player creating the game.
 * @param totalRounds The total number of rounds for the game.
 * @param traceId For logging purposes.
 * @param userId Optional Firebase Auth UID of the creator.
 * @returns An object containing the new gameId and the creator's playerId.
 * @throws HttpsError for validation errors or internal issues.
 */
export async function createGameService(
  playerName: string,
  totalRounds: number,
  traceId: TraceId,
  userId?: string | null
): Promise<{ gameId: string; playerId: string }> {
  logger.info(`[${traceId}] Service: createGameService called.`, { playerName, totalRounds, userId });

  // --- Input Validation ---
  const trimmedPlayerName = playerName.trim();
  if (!trimmedPlayerName) {
    throw new HttpsError("invalid-argument", "Player name is required.");
  }
  if (trimmedPlayerName.length > MAX_PLAYER_NAME_LENGTH) {
    throw new HttpsError("invalid-argument", `Player name cannot exceed ${MAX_PLAYER_NAME_LENGTH} characters.`);
  }
  if (!Number.isInteger(totalRounds) || totalRounds < MIN_ROUNDS || totalRounds > MAX_ROUNDS) {
    throw new HttpsError("invalid-argument", `Total rounds must be an integer between ${MIN_ROUNDS} and ${MAX_ROUNDS}.`);
  }
  // --- End Input Validation ---

  // Generate IDs
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const creatorPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Create Game Service ${gameId}): Starting.`);

      // Check for game ID collision (unlikely but possible)
      logger.debug(`[${traceId}] Transaction: Calling getGameById for ${gameId}...`);
      const existingGame = await gameData.getGameById(gameId, traceId, transaction);
      logger.debug(`[${traceId}] Transaction: getGameById returned. Exists: ${!!existingGame}`);
      if (existingGame) {
        logger.error(`[${traceId}] Transaction Error (Create Game Service ${gameId}): Game ID collision.`);
        throw new HttpsError("already-exists", `Game ID ${gameId} already exists. Please try again.`);
      }

      // Create Game Document
      const newGameData = {
        status: "waiting" as GameStatus,
        playerCount: 1,
        maxPlayers: MAX_PLAYERS,
        currentRound: 0,
        totalRounds: totalRounds,
        creatorPlayerId: creatorPlayerId,
        creatorUid: userId ?? null,
        settings: { // Add default settings on creation
            rounds: MIN_ROUNDS, // Use config default
            maxPlayers: MAX_PLAYERS, // Use config default
            allowExplicit: true, // Default as per user request
            selectionTimeLimit: 90, // Default value
            rankingTimeLimit: 60, // Default value
        },
        // Timestamps added by DAL function
      };
      logger.debug(`[${traceId}] Transaction: Calling createGameDocument for ${gameId}...`);
      gameData.createGameDocument(gameId, newGameData, transaction, traceId);
      logger.debug(`[${traceId}] Transaction: createGameDocument called.`);

      // Add Creator Player Document
      const newPlayerData = {
        name: trimmedPlayerName,
        score: 0,
        hasJoined: true,
        jokerAvailable: true,
        isCreator: true,
        // Timestamps added by DAL function
      };
      logger.debug(`[${traceId}] Transaction: Calling addPlayerDocument for ${creatorPlayerId} in game ${gameId}...`);
      playerData.addPlayerDocument(gameId, creatorPlayerId, newPlayerData, transaction, traceId);
      logger.debug(`[${traceId}] Transaction: addPlayerDocument called.`);

      logger.debug(`[${traceId}] Transaction (Create Game Service ${gameId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Game ${gameId} created successfully by ${trimmedPlayerName}.`, { gameId, creatorPlayerId });
    return { gameId, playerId: creatorPlayerId };

  } catch (error) {
    logger.error(`[${traceId}] Service Error: createGameService failed for player ${trimmedPlayerName} (GameID attempt: ${gameId}):`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while creating the game.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}


/**
 * Starts a game, changing its status and setting up the first round.
 * Contains the core business logic for starting a game.
 * @param gameId The ID of the game to start.
 * @param traceId For logging purposes.
 * @param callerUid Optional Firebase Auth UID of the caller (for potential creator check).
 * @throws HttpsError for validation errors or internal issues.
 */
export async function startGameService(
  gameId: string,
  traceId: TraceId,
  callerUid?: string | null // Optional: For creator check if implemented later
): Promise<void> {
  logger.info(`[${traceId}] Service: startGameService called for game ${gameId}.`, { callerUid });

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Start Game Service ${gameId}): Starting.`);

      // --- Get Current State ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }

      const playersSnapshot = await playerData.getAllPlayers(gameId, traceId, transaction);
      const playerDocs = playersSnapshot.docs;
      const playerCount = playerDocs.length;
      // --- End Get Current State ---


      // --- Business Rule Checks ---
      // Optional: Check if caller is the creator
      // if (callerUid && currentGame.creatorUid && callerUid !== currentGame.creatorUid) {
      //   throw new HttpsError("permission-denied", "Only the game creator can start the game.");
      // }

      if (currentGame.status !== "waiting") {
        throw new HttpsError("failed-precondition", `Game ${gameId} is not in the 'waiting' state (current: ${currentGame.status}).`);
      }

      if (playerCount < MIN_PLAYERS_TO_START) {
        throw new HttpsError("failed-precondition", `Cannot start game ${gameId}. Need at least ${MIN_PLAYERS_TO_START} players (currently ${playerCount}).`);
      }
      // --- End Business Rule Checks ---


      // --- Determine Round 1 Details ---
      const playerIds = playerDocs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.id); // Use directly imported base Firestore types
      const firstHostId = playerIds[Math.floor(Math.random() * playerIds.length)];
      const firstChallenge = null; // Set initial challenge to null
      const round1Number = 1;
      // --- End Determine Round 1 Details ---


      // --- Update State ---
      // Step 1: Set intermediate transitioning status
      logger.debug(`[${traceId}] Transaction: Setting status to transitioning_to_announcing...`);
      gameData.updateGameDetails(gameId, { status: 'transitioning_to_announcing' as GameStatus }, traceId, transaction);
      logger.debug(`[${traceId}] Transaction: Intermediate status set.`);

      // Update Game Document
      // Step 2: Set final status and round details
      const finalGameUpdates = {
        status: `round${round1Number}_announcing` as GameStatus, // Changed to announcing
        currentRound: round1Number,
        roundHostPlayerId: firstHostId,
        challenge: firstChallenge,
        startedAt: FieldValue.serverTimestamp(),
      };
      gameData.updateGameDetails(gameId, finalGameUpdates, traceId, transaction);

      // Create Round 1 Document
      const round1Data = {
        challenge: firstChallenge,
        hostPlayerId: firstHostId,
        status: "announcing" as const, // Changed: Round starts in announcement phase
        gameSongs: [],
        playerSongs: {},
        // createdAt added by DAL
      };
      roundData.createRoundDocument(gameId, round1Number, round1Data, transaction, traceId);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Start Game Service ${gameId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Game ${gameId} started successfully.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: startGameService failed for game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while starting the game.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}


/**
 * Validates the provided game settings object.
 * @param settings The settings object to validate.
 * @param traceId For logging.
 * @throws HttpsError if validation fails.
 */
function validateGameSettings(settings: Partial<GameSettings>, traceId: TraceId): asserts settings is GameSettings {
    logger.debug(`[${traceId}] Validating game settings:`, settings);

    if (typeof settings !== 'object' || settings === null) {
        throw new HttpsError("invalid-argument", "Settings must be an object.");
    }

    // Validate Rounds
    if (settings.rounds === undefined || !VALID_ROUNDS.includes(settings.rounds)) {
        throw new HttpsError("invalid-argument", `Invalid number of rounds. Must be one of: ${VALID_ROUNDS.join(", ")}.`);
    }

    // Validate Max Players
    if (settings.maxPlayers === undefined || !VALID_MAX_PLAYERS.includes(settings.maxPlayers)) {
        throw new HttpsError("invalid-argument", `Invalid max players. Must be one of: ${VALID_MAX_PLAYERS.join(", ")}.`);
    }

    // Validate Allow Explicit
    if (settings.allowExplicit === undefined || typeof settings.allowExplicit !== 'boolean') {
        throw new HttpsError("invalid-argument", "Invalid value for allowExplicit. Must be true or false.");
    }

    // Validate Selection Time Limit
    if (settings.selectionTimeLimit !== null && (settings.selectionTimeLimit === undefined || !VALID_TIME_LIMITS.includes(settings.selectionTimeLimit))) {
         throw new HttpsError("invalid-argument", `Invalid selection time limit. Must be null or one of: ${VALID_TIME_LIMITS.join(", ")}.`);
    }

    // Validate Ranking Time Limit
    if (settings.rankingTimeLimit !== null && (settings.rankingTimeLimit === undefined || !VALID_TIME_LIMITS.includes(settings.rankingTimeLimit))) {
         throw new HttpsError("invalid-argument", `Invalid ranking time limit. Must be null or one of: ${VALID_TIME_LIMITS.join(", ")}.`);
    }
     logger.debug(`[${traceId}] Game settings validation passed.`);
}


/**
 * Updates the settings for a specific game.
 * Only the game creator can perform this action.
 * @param gameId The ID of the game to update.
 * @param newSettings The new settings object.
 * @param callerUid The Firebase Auth UID of the user attempting the update.
 * @param traceId For logging purposes.
 * @throws HttpsError for validation, permission, or internal errors.
 */
export async function updateGameSettingsService(
  gameId: string,
  newSettings: Partial<GameSettings>,
  callerPlayerId: string, // Changed parameter name from callerUid
  traceId: TraceId
): Promise<void> {
  logger.info(`[${traceId}] Service: updateGameSettingsService called for game ${gameId}.`, { newSettings, callerPlayerId });

  // --- Input Validation ---
  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required.");
  }
  // Changed check from callerUid to callerPlayerId
  if (!callerPlayerId) {
      throw new HttpsError("invalid-argument", "Player ID is required for authorization check.");
  }
  // Validate the structure and values of the settings object
  validateGameSettings(newSettings, traceId);
  // --- End Input Validation ---

  try {
    // Use a transaction to ensure atomicity (read game, check creator, update settings)
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Update Settings Service ${gameId}): Starting.`);

      // --- Get Current Game State & Authorization Check ---
      const currentGame = await gameData.getGameById(gameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${gameId} not found.`);
      }

      // Authorization: Check if the caller's playerId matches the game's creatorPlayerId
      // TODO: Replace this with UID check once authentication is implemented
      if (callerPlayerId !== currentGame.creatorPlayerId) {
          logger.warn(`[${traceId}] Permission denied: Caller Player ID (${callerPlayerId}) does not match creator Player ID (${currentGame.creatorPlayerId}) for game ${gameId}.`);
          throw new HttpsError("permission-denied", "Only the game creator can update settings.");
      }

       // Check if game is in 'waiting' state - Settings can only be changed before starting
       if (currentGame.status !== "waiting") {
           throw new HttpsError("failed-precondition", `Game settings can only be changed while the game is in the 'waiting' state (current: ${currentGame.status}).`);
       }
      // --- End Authorization Check ---


      // --- Update Game Settings ---
      const settingsUpdate = {
        settings: newSettings, // Update the entire settings object
      };
      gameData.updateGameDetails(gameId, settingsUpdate, traceId, transaction);
      // --- End Update Game Settings ---

      logger.debug(`[${traceId}] Transaction (Update Settings Service ${gameId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Settings for game ${gameId} updated successfully.`);

  } catch (error) {
    logger.error(`[${traceId}] Service Error: updateGameSettingsService failed for game ${gameId}:`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while updating game settings.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}