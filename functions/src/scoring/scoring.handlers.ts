import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { calculateScoresService } from "./scoring.service"; // Adjusted path
// import { TraceId } from "../core/types"; // Adjusted path - Removed unused import
import { generateTraceId, handleServiceCall } from "../core/utils"; // Import shared helpers

// Helper functions generateTraceId and handleServiceCall moved to core/utils.ts

// --- Scoring Handler ---

export const calculateScores = onCall(async (request) => {
  const functionName = "calculateScoresHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  const { gameId, roundNumber } = request.data || {};
  // Optional: Validate caller UID if needed

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  if (!roundNumber || typeof roundNumber !== 'number' || !Number.isInteger(roundNumber) || roundNumber <= 0) {
      logger.error(`[${traceId}] Invalid input: Round number missing or invalid.`);
      throw new HttpsError("invalid-argument", "A valid round number is required.");
  }

  return handleServiceCall(traceId, async () => {
    await calculateScoresService(gameId, roundNumber, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}, round ${roundNumber}.`);
    return { success: true, message: "Scores calculated successfully." };
  });
});