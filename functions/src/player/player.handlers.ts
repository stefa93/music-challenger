import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { joinGameService } from "./player.service"; // Adjusted path
// import { TraceId } from "../core/types"; // Adjusted path - Removed unused import
import { generateTraceId, handleServiceCall } from "../core/utils"; // Import shared helpers

// Helper functions generateTraceId and handleServiceCall moved to core/utils.ts

// --- Player Handlers ---

export const joinGame = onCall(async (request) => {
  const functionName = "joinGameHandler";
  // Extract traceId or generate fallback BEFORE logging initial trigger
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // gameId is now optional, validation moved to service layer
  const { gameId, playerName } = request.data || {};

  // Basic input validation for playerName
  if (!playerName || typeof playerName !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player name missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player name is required and must be a string.");
  }

  return handleServiceCall(traceId, async () => {
    // Pass gameId (which might be undefined) to the service
    const result = await joinGameService(gameId, playerName, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}.`, { result });
    // Return data expected by the client (gameId, playerId)
    return { success: true, message: `Player ${playerName} joined game ${gameId}.`, ...result };
  });
});

// Removed redundant submitSongNomination handler (now handled in roundHandlers.ts)