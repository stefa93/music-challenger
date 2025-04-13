import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { submitRankingService, startNextRoundService, startSelectionPhaseService, submitSongNominationService, setChallengeService, startRankingPhaseService, controlPlaybackService } from "./round.service"; // Adjusted path
// import { TraceId } from "../core/types"; // Adjusted path - Removed unused import
import { onDocumentUpdated } from "firebase-functions/v2/firestore"; // Added
import { calculateScoresService } from "../scoring/scoring.service"; // Adjusted path (Anticipating move)
import { Round } from "./types"; // Adjusted path
import { generateTraceId, handleServiceCall } from "../core/utils"; // Import shared helpers

// Helper functions generateTraceId and handleServiceCall moved to core/utils.ts

// --- Round Handlers ---

export const submitRanking = onCall(async (request) => {
  const functionName = "submitRankingHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  const { gameId, playerId, rankings } = request.data || {};
  // Optional: Validate caller UID matches playerId if auth is implemented

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  if (!playerId || typeof playerId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required and must be a string.");
  }
  if (!rankings || typeof rankings !== 'object' || Object.keys(rankings).length === 0) {
      logger.error(`[${traceId}] Invalid input: Rankings missing, not an object, or empty.`);
      throw new HttpsError("invalid-argument", "Rankings object is required and cannot be empty.");
  }
  // Note: More detailed validation of the rankings object structure happens in the service layer

  return handleServiceCall(traceId, async () => {
    await submitRankingService(gameId, playerId, rankings, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}, player ${playerId}.`);
    return { success: true, message: "Rankings submitted successfully." };
  });
});

export const startNextRound = onCall(async (request) => {
  const functionName = "startNextRoundHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  const { gameId } = request.data || {};
  // Optional: Validate caller UID if needed (e.g., only host or creator can trigger)

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }

  return handleServiceCall(traceId, async () => {
    await startNextRoundService(gameId, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}.`);
    return { success: true, message: "Next round started." };
  });
});

export const startSelectionPhase = onCall(async (request) => {
  const functionName = "startSelectionPhaseHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // Extract playerId for temporary authorization
  const { gameId, playerId } = request.data || {};
  // TODO: Replace playerId check with request.auth.uid once auth is implemented

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  // Add validation for playerId
  if (!playerId || typeof playerId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required to start selection phase.");
  }

  return handleServiceCall(traceId, async () => {
    // Pass playerId for host verification in the service (TEMPORARY)
    await startSelectionPhaseService(gameId, traceId, playerId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}.`);
    return { success: true, message: "Song selection phase started." };
  });
});

export const submitSongNomination = onCall(async (request) => {
  const functionName = "submitSongNominationHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  const { gameId, playerId, trackDetails } = request.data || {};
  // Optional: Validate caller UID matches playerId if auth is implemented

  // --- Input Validation ---
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  if (!playerId || typeof playerId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required and must be a string.");
  }
  // Adjusted validation for generic track details
  if (!trackDetails || typeof trackDetails !== 'object' ||
      !trackDetails.trackId || typeof trackDetails.trackId !== 'string' || // Check trackId
      !trackDetails.name || typeof trackDetails.name !== 'string' ||
      !trackDetails.artist || typeof trackDetails.artist !== 'string') {
      logger.error(`[${traceId}] Invalid input: Track details missing or invalid structure.`, { trackDetails });
      throw new HttpsError("invalid-argument", "Valid track details (trackId, name, artist) are required.");
  }
  // --- End Input Validation ---

  return handleServiceCall(traceId, async () => {
    // We need to create submitSongNominationService in roundService.ts
    await submitSongNominationService(gameId, playerId, trackDetails, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}, player ${playerId}.`);
    return { success: true, message: "Song nominated successfully." };
  });
});

export const setChallenge = onCall(async (request) => {
  const functionName = "setChallengeHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // Extract playerId for temporary authorization
  const { gameId, roundId, challenge, playerId } = request.data || {};

  // Authentication Check (TEMPORARILY DISABLED FOR DEVELOPMENT - REMEMBER TO RE-ENABLE)
  /*
  if (!request.auth) {
    logger.error(`[${traceId}] Unauthenticated user attempted to set challenge.`);
    throw new HttpsError('unauthenticated', 'You must be logged in to set the challenge.');
  }
  */
  // const callerUid = "DEBUG_BYPASS_USER"; // REMOVED - Using playerId from request data
  // TODO: Replace playerId check with request.auth.uid once auth is implemented

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  if (!roundId || typeof roundId !== 'string') { // Assuming roundId is passed (e.g., "1", "2")
      logger.error(`[${traceId}] Invalid input: Round ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Round ID is required and must be a string.");
  }
  if (!challenge || typeof challenge !== 'string' || challenge.trim().length === 0) {
      logger.error(`[${traceId}] Invalid input: Challenge missing, not a string, or empty.`);
      throw new HttpsError("invalid-argument", "Challenge is required, must be a non-empty string.");
  }
  // Add length validation if needed
  const MAX_CHALLENGE_LENGTH = 150; // Example limit
  if (challenge.length > MAX_CHALLENGE_LENGTH) {
      logger.error(`[${traceId}] Invalid input: Challenge exceeds maximum length of ${MAX_CHALLENGE_LENGTH}.`);
      throw new HttpsError("invalid-argument", `Challenge cannot exceed ${MAX_CHALLENGE_LENGTH} characters.`);
  }
  // Add validation for playerId
  if (!playerId || typeof playerId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required to set challenge.");
  }

  return handleServiceCall(traceId, async () => {
    // Authorization and service call are handled within setChallengeService
    // Pass playerId for host verification in the service (TEMPORARY)
    await setChallengeService(gameId, roundId, playerId, challenge, traceId);
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}, round ${roundId}.`);
    return { success: true, message: "Challenge set successfully." };
  });
});

export const startRankingPhase = onCall(async (request) => {
  const functionName = "startRankingPhaseHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // Extract playerId for temporary authorization
  const { gameId, playerId } = request.data || {};
 
  // Authentication Check
  // TODO: Replace playerId check with request.auth.uid once auth is implemented
  if (!playerId || typeof playerId !== 'string') { // Check for playerId instead of request.auth
    logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
    throw new HttpsError("invalid-argument", "Player ID is required to start ranking phase.");
  }
  // const callerUid = request.auth.uid; // REMOVED - Using playerId from request data

  // Basic input validation
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }

  return handleServiceCall(traceId, async () => {
    // Authorization (is caller the host?) is handled within startRankingPhaseService
    await startRankingPhaseService(gameId, playerId, traceId); // Pass playerId instead of callerUid
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}.`);
    return { success: true, message: "Ranking phase started." };
  });
}); // Correct closing brace for startRankingPhase

// Define controlPlayback at the top level
export const controlPlayback = onCall(async (request) => {
  const functionName = "controlPlaybackHandler";
  const traceId = request.data?.traceId || generateTraceId(functionName);
  logger.info(`[${traceId}] ${functionName} triggered.`, { data: request.data, auth: request.auth });

  // Extract playerId for temporary authorization
  const { gameId, action, targetIndex, playerId } = request.data || {};

  // Authentication Check
  // TODO: Replace playerId check with request.auth.uid once auth is implemented
  if (!playerId || typeof playerId !== 'string') { // Check for playerId instead of request.auth
    logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
    throw new HttpsError("invalid-argument", "Player ID is required to control playback.");
  }
  // const callerUid = request.auth.uid; // REMOVED - Using playerId from request data

  // Basic input validation (more detailed validation in service)
  if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required and must be a string.");
  }
  // Validate action string against allowed types
  const validActions = ['play', 'pause', 'next', 'prev', 'seekToIndex'] as const;
  type PlaybackAction = typeof validActions[number]; // Create type from array

  if (!action || typeof action !== 'string' || !validActions.includes(action as PlaybackAction)) {
     logger.error(`[${traceId}] Invalid input: Action missing or invalid: ${action}.`);
     throw new HttpsError("invalid-argument", `Playback action must be one of: ${validActions.join(', ')}.`);
  }
  // targetIndex validation happens in service

  return handleServiceCall(traceId, async () => {
    // Authorization (is caller the host?) and action validation handled within controlPlaybackService
    // Cast action to the specific literal type after validation
    await controlPlaybackService(gameId, playerId, action as PlaybackAction, targetIndex, traceId); // Pass playerId instead of callerUid
    logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}, action ${action}.`);
    return { success: true, message: "Playback controlled successfully." };
  });
});


// --- Firestore Triggers ---

// Trigger to automatically calculate scores when a round status changes to 'scoring'
export const onRoundStatusUpdate = onDocumentUpdated(
  "games/{gameId}/rounds/{roundNumber}",
  async (event) => {
    const functionName = "onRoundStatusUpdateTrigger";
    const traceId = `${functionName}_${event.id}_${Date.now()}`; // Generate traceId based on event

    if (!event.data) {
      logger.info(`[${traceId}] No data associated with the event.`);
      return;
    }

    const beforeData = event.data.before.data() as Round | undefined; // Cast to Round type
    const afterData = event.data.after.data() as Round | undefined; // Cast to Round type

    if (!beforeData || !afterData) {
      logger.info(`[${traceId}] Before or after data missing, cannot compare status.`);
      return;
    }

    const statusBefore = beforeData.status;
    const statusAfter = afterData.status;

    logger.debug(`[${traceId}] Round ${event.params.roundNumber} in game ${event.params.gameId} status changed from '${statusBefore}' to '${statusAfter}'.`);

    // Check if the status specifically changed TO 'scoring'
    if (statusBefore !== "scoring" && statusAfter === "scoring") {
      const gameId = event.params.gameId;
      const roundNumber = parseInt(event.params.roundNumber, 10); // Firestore params are strings

      if (isNaN(roundNumber)) {
         logger.error(`[${traceId}] Invalid round number parameter: ${event.params.roundNumber}`);
         return;
      }

      logger.info(`[${traceId}] Round status changed to 'scoring'. Triggering score calculation for game ${gameId}, round ${roundNumber}.`);

      try {
        // Call the service function. Note: This runs OUTSIDE the original transaction.
        // calculateScoresService does NOT need the transaction parameter here.
        await calculateScoresService(gameId, roundNumber, traceId);
        logger.info(`[${traceId}] Score calculation completed successfully for game ${gameId}, round ${roundNumber}.`);
      } catch (error) {
        logger.error(`[${traceId}] Error during automatic score calculation for game ${gameId}, round ${roundNumber}:`, error);
        // Consider adding error handling, e.g., updating the round status to 'error_scoring'
      }
    } else {
      logger.debug(`[${traceId}] Status change did not meet trigger condition (not changed to 'scoring'). No action taken.`);
    }
  }
);