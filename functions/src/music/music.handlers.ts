import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getMusicProvider } from "./music.service"; // Adjusted path
// import { TraceId } from "../core/types"; // Adjusted path - Removed unused import
import { generateTraceId, handleServiceCall } from "../core/utils"; // Import shared helpers
// Removed config import as secrets are no longer needed for Deezer public search

// Helper functions generateTraceId and handleServiceCall moved to core/utils.ts

// Spotify handler (exchangeSpotifyCode) removed as Deezer doesn't require user auth flow for search.

// --- Generic Music Search Handler ---

// Renamed handler and removed secrets as Deezer public search doesn't need them
export const searchMusicTracks = onCall(
  // { secrets: [...] }, // Secrets removed
  async (request) => {
    const functionName = "searchMusicTracksHandler"; // Renamed function name for logging
    const loggableData = request.data || {}; // Log all data for now
    const traceId = loggableData.traceId || generateTraceId(functionName);
    logger.info(`[${traceId}] ${functionName} triggered.`, { data: loggableData, auth: request.auth });

    const { query, gameId, playerId, allowExplicit } = request.data || {}; // Extract allowExplicit
    // const callerUid = request.auth?.uid; // Optional: Add auth check if needed

    // --- Input Validation ---
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      logger.error(`[${traceId}] Invalid input: Search query missing or empty.`);
      throw new HttpsError("invalid-argument", "Search query is required.");
    }
    if (!gameId || typeof gameId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Game ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Game ID is required.");
    }
    if (!playerId || typeof playerId !== 'string') {
      logger.error(`[${traceId}] Invalid input: Player ID missing or not a string.`);
      throw new HttpsError("invalid-argument", "Player ID is required.");
    }
    // Validate allowExplicit (optional, could default in service if missing)
    if (allowExplicit !== undefined && typeof allowExplicit !== 'boolean') {
        logger.error(`[${traceId}] Invalid input: allowExplicit must be a boolean if provided.`);
        throw new HttpsError("invalid-argument", "allowExplicit must be a boolean.");
    }
    // --- End Input Validation ---

    return handleServiceCall(traceId, async () => {
      // Pass gameId and playerId optionally for logging context in the service
      // Get the configured music provider and call its search method
      const musicProvider = getMusicProvider();
      // TODO: Consider adding limit parameter if needed from frontend payload
      // Pass allowExplicit (or default if undefined) to the service
      const results = await musicProvider.searchTracks(query, traceId, allowExplicit ?? true);
      logger.info(`[${traceId}] ${functionName} completed successfully for game ${gameId}, player ${playerId}. Found ${results.length} tracks.`);
      return { success: true, results: results };
    });
  }
);