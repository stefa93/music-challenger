import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../core/firestoreClient"; // Adjusted path
import * as gameData from "../game/game.data"; // Adjusted path
import * as playerData from "./player.data"; // Adjusted path
// Removed unused imports: roundData, GameStatus
import { TraceId } from "../core/types"; // Adjusted path
import { MAX_PLAYER_NAME_LENGTH } from "../core/constants"; // Adjusted path

/**
 * Adds a player to an existing game that is waiting for players.
 * Contains the core business logic for joining a game.
 * @param gameId The ID of the game to join.
 * @param playerName The name of the player joining.
 * @param traceId For logging purposes.
 * @returns An object containing the new playerId and the gameId.
 * @throws HttpsError for validation errors, game state issues, or internal problems.
 */
export async function joinGameService(
  gameId: string | undefined, // Make gameId optional
  playerName: string,
  traceId: TraceId
): Promise<{ gameId: string; playerId: string }> {
  logger.info(`[${traceId}] Service: joinGameService called.`, { gameId, playerName });

  // --- Input Validation ---
  // gameId validation removed, handled by logic below
  const trimmedPlayerName = playerName.trim();
  if (!trimmedPlayerName) {
    throw new HttpsError("invalid-argument", "Player name is required.");
  }
  if (trimmedPlayerName.length > MAX_PLAYER_NAME_LENGTH) {
    throw new HttpsError("invalid-argument", `Player name cannot exceed ${MAX_PLAYER_NAME_LENGTH} characters.`);
  }
  // --- End Input Validation ---

  const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let targetGameId: string; // Will hold the final game ID

  // --- Determine Target Game ID ---
  if (gameId) {
    logger.info(`[${traceId}] Service: Attempting to join specific game: ${gameId}`);
    targetGameId = gameId;
  } else {
    logger.info(`[${traceId}] Service: No specific game ID provided, searching for an available game...`);
    const availableGameId = await gameData.findAvailableGame(traceId);
    if (!availableGameId) {
      logger.warn(`[${traceId}] Service: No available games found.`);
      throw new HttpsError("not-found", "No available games found to join.");
    }
    logger.info(`[${traceId}] Service: Found available game: ${availableGameId}`);
    targetGameId = availableGameId;
  }
  // --- End Determine Target Game ID ---

  // If we reach here, targetGameId is guaranteed to be a string.

  try {
    await db.runTransaction(async (transaction) => {
      logger.debug(`[${traceId}] Transaction (Join Game Service ${targetGameId}): Starting.`);

      // --- Get Current State & Perform Checks ---
      // 1. Get Game and check status/player count
      const currentGame = await gameData.getGameById(targetGameId, traceId, transaction);
      if (!currentGame) {
        throw new HttpsError("not-found", `Game ${targetGameId} not found.`);
      }
      if (currentGame.status !== "waiting") {
        throw new HttpsError("failed-precondition", `Game is not waiting for players (status: ${currentGame.status}).`);
      }
      // Use maxPlayers from game settings
      const maxPlayers = currentGame.settings?.maxPlayers; // Access settings
      if (!maxPlayers) {
          // Fallback or error if settings are somehow missing (shouldn't happen with defaults)
          logger.error(`[${traceId}] Missing maxPlayers setting in game document ${targetGameId}.`);
          throw new HttpsError("internal", "Game configuration error (missing maxPlayers).");
      }
      if (currentGame.playerCount >= maxPlayers) {
        throw new HttpsError("resource-exhausted", `Game is full (${currentGame.playerCount}/${maxPlayers} players).`);
      }

      // 2. Check if player name is already taken
      const nameExists = await playerData.checkPlayerNameExists(targetGameId, trimmedPlayerName, transaction, traceId);
      if (nameExists) {
        throw new HttpsError("already-exists", `Player name "${trimmedPlayerName}" is already taken in this game.`);
      }
      // --- End Checks ---


      // --- Update State ---
      // 1. Increment player count in the game document
      // Corrected argument order: gameId, traceId, transaction
      gameData.incrementPlayerCount(targetGameId, traceId, transaction);

      // 2. Add the new player document
      const newPlayerData = {
        name: trimmedPlayerName,
        score: 0,
        hasJoined: true, // Player has joined by calling this function
        jokerAvailable: true, // Give player their joker
        // joinedAt added by DAL
      };
      playerData.addPlayerDocument(targetGameId, newPlayerId, newPlayerData, transaction, traceId);
      // --- End Update State ---

      logger.debug(`[${traceId}] Transaction (Join Game Service ${targetGameId}): Writes completed.`);
    }); // --- End Transaction ---

    logger.info(`[${traceId}] Service: Player ${trimmedPlayerName} successfully joined game ${targetGameId}.`, { playerId: newPlayerId, gameId: targetGameId });
    return { gameId: targetGameId, playerId: newPlayerId };

  } catch (error) {
    // targetGameId will be defined here if an error occurred within the try block after assignment,
    // or it will be the initial 'gameId' (possibly undefined) if the error occurred during findAvailableGame.
    // targetGameId is guaranteed to be defined if error occurs within the try block
    logger.error(`[${traceId}] Service Error: joinGameService failed for player ${trimmedPlayerName} (targetGameId: ${targetGameId}):`, { error });
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsErrors directly
    }
    // Wrap other errors
    throw new HttpsError("internal", "An unexpected error occurred while trying to join the game.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}

// Removed redundant submitSongNominationService (now handled in roundService.ts)