import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { createGameService, startGameService, updateGameSettingsService } from "./game.service"; // Adjusted path
// import { TraceId } from "../core/types"; // Adjusted path - Removed unused import
import { GameSettings } from "./types"; // Adjusted path
import { DEFAULT_TOTAL_ROUNDS } from "../core/constants"; // Adjusted path
import { generateTraceId, handleServiceCall } from "../core/utils"; // Import shared helpers

// Helper functions generateTraceId and handleServiceCall moved to core/utils.ts

// --- Game Handlers ---

export const createGame = onCall(async (request) => {
  const functionName = "createGameHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  const { playerName, totalRounds: reqTotalRounds } = request.data || {};
  const totalRounds = reqTotalRounds ?? DEFAULT_TOTAL_ROUNDS; // Use default if not provided
  const userId = request.auth?.uid; // Optional: Pass Auth UID if available

  // Basic input validation at the handler level (more detailed validation in service)
  if (!playerName || typeof playerName !== 'string') {
    logger.error(`[${traceId}] Invalid input: Player name missing or not a string.`);
    throw new HttpsError("invalid-argument", "Player name is required and must be a string.");
  }
  if (reqTotalRounds !== undefined && typeof reqTotalRounds !== 'number') {
    logger.error(`[${traceId}] Invalid input: totalRounds provided but not a number.`);
    throw new HttpsError("invalid-argument", "If provided, totalRounds must be a number.");
  }

  return handleServiceCall(traceId, async () => {
    const result = await createGameService(playerName, totalRounds, traceId, userId);
    logger.info(`[${traceId}] ${functionName} completed successfully.`, { result });
    // Return data expected by the client (gameId, playerId)
    return { success: true, message: `Game ${result.gameId} created.`, ...result };
  });
});

export const startGame = onCall(async (request) => {
  const functionName = "startGameHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // Extract playerId for temporary authorization
  const { gameId, playerId } = request.data || {};
  // const callerUid = request.auth?.uid; // REMOVED - Using playerId from request data
  // TODO: Replace playerId check with request.auth.uid once auth is implemented
 
  // Basic input validation
  if (!playerId || typeof playerId !== 'string') { // Add validation for playerId
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required to start game.");
  }
  if (!gameId || typeof gameId !== 'string') {
    logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
    throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }

  return handleServiceCall(traceId, async () => {
    // Pass playerId for creator verification in the service (TEMPORARY)
    // Note: startGameService currently doesn't use the third arg, but passing for consistency
    await startGameService(gameId, traceId, playerId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}.`);
    return { success: true, message: `Game ${gameId} started.` };
  });
});

export const updateGameSettings = onCall(async (request) => {
  const functionName = "updateGameSettingsHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // Extract playerId instead of relying on auth.uid for now
  const { gameId, newSettings, playerId } = request.data || {};
  // const callerUid = request.auth?.uid; // Removed auth check

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
    logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
    throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  // Add validation for playerId
  if (!playerId || typeof playerId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required to update settings.");
  }
  if (!newSettings || typeof newSettings !== 'object') {
    logger.error(`[${traceId}] Invalid input: newSettings missing or not an object.`);
    throw new HttpsError("invalid-argument", "New settings object is required.");
  }
  // Removed callerUid check

  // More detailed validation of newSettings structure happens in the service layer
  return handleServiceCall(traceId, async () => {
    // Pass playerId for creator verification in the service (TEMPORARY - less secure)
    // TODO: Replace playerId check with callerUid check once authentication is implemented
    await updateGameSettingsService(gameId, newSettings as GameSettings, playerId, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}.`);
    return { success: true, message: `Game ${gameId} settings updated.` };
  });
});