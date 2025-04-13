import axios from "axios";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v1/https";
import { MusicTrack } from "./types"; // Adjusted path
import { MusicProviderService } from "./musicProvider.interface"; // Adjusted path

// Deezer API Configuration
const DEEZER_API_BASE_URL = "https://api.deezer.com";
const DEEZER_SEARCH_ENDPOINT = `${DEEZER_API_BASE_URL}/search`;
const DEEZER_TRACK_ENDPOINT = `${DEEZER_API_BASE_URL}/track`;

/**
 * Maps a raw Deezer track object (from search or track endpoint) to the generic MusicTrack interface.
 */
// Include raw data for filtering purposes if needed later
const mapDeezerTrackToMusicTrack = (deezerTrack: any): (MusicTrack & { rawDeezerData?: any }) | null => {
  if (!deezerTrack || !deezerTrack.id || !deezerTrack.title) {
    // Basic validation
    return null;
  }
  return {
    trackId: deezerTrack.id.toString(),
    name: deezerTrack.title,
    artistName: deezerTrack.artist?.name ?? "Unknown Artist",
    albumName: deezerTrack.album?.title,
    previewUrl: deezerTrack.preview || null,
    albumImageUrl: deezerTrack.album?.cover_small ?? deezerTrack.album?.cover,
    durationMs: deezerTrack.duration ? deezerTrack.duration * 1000 : undefined, // Deezer duration is in seconds
    providerUrl: deezerTrack.link,
    // Optionally include raw data if needed for filtering later, though explicit flags are usually top-level
    // rawDeezerData: deezerTrack // Uncomment if needed
  };
};

export class DeezerMusicService implements MusicProviderService {
  // Add allowExplicit parameter (optional, defaults to true), keep limit optional
  async searchTracks(query: string, traceId: string, allowExplicit: boolean = true, limit: number = 10): Promise<MusicTrack[]> {
    const functionName = "DeezerMusicService.searchTracks";
    // Log allowExplicit, but note it's not used in the Deezer API call itself
    logger.info(`[${traceId}] ${functionName} called.`, { query, limit, allowExplicit });

    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    const searchUrl = `${DEEZER_SEARCH_ENDPOINT}?${searchParams.toString()}`;
    logger.debug(`[${traceId}] Calling Deezer search endpoint: ${searchUrl}`);

    try {
      const response = await axios.get(searchUrl);
      logger.debug(`[${traceId}] Deezer search response status: ${response.status}`);

      // Check for Deezer API errors within the response data
      if (response.data?.error) {
        logger.error(`[${traceId}] Deezer search API returned an error:`, response.data.error);
        throw new HttpsError("internal", `Deezer search failed: ${response.data.error.message || "Unknown Deezer error"}`);
      }

      if (!response.data?.data || !Array.isArray(response.data.data)) {
        logger.warn(`[${traceId}] Deezer search returned no data or unexpected format for query: "${query}"`);
        return []; // Return empty array if no results or bad format
      }

      // Map results to generic MusicTrack type
      const tracks: MusicTrack[] = response.data.data
        .map(mapDeezerTrackToMusicTrack) // Map first
        .filter((track: (MusicTrack & { rawDeezerData?: any }) | null): track is MusicTrack => track !== null); // Explicitly type track parameter

      // TODO: Potentially filter 'tracks' here based on allowExplicit and Deezer's explicit flags if needed
      // Deezer track object has `explicit_content_lyrics` and `explicit_content_cover` flags (numeric codes)
      // Example filter (if needed):
      // const filteredTracks = allowExplicit ? tracks : tracks.filter(t => !(t.rawDeezerData?.explicit_content_lyrics > 0 || t.rawDeezerData?.explicit_content_cover > 0));
      // logger.info(`[${traceId}] ${functionName} completed successfully. Found ${filteredTracks.length} tracks after filtering.`);
      // return filteredTracks;

      // logger.info(`[${traceId}] ${functionName} completed successfully. Found ${tracks.length} tracks. (Explicit filtering not applied at API level)`);
      // return tracks; // Return unfiltered tracks for now

      // Filter based on allowExplicit and Deezer's flags AFTER mapping and initial filtering
      // Deezer uses numeric codes: explicit_lyrics (1=Explicit, 0=Not Explicit, 2=Unknown), explicit_content_cover (similar)
      const filteredTracks = allowExplicit
        ? tracks // If allowed, return all mapped tracks
        : tracks.filter(track => {
            // Find the original deezer track data used for mapping this track
            const originalDeezerTrack = response.data.data.find((dt: any) => dt.id.toString() === track.trackId);
            // Check explicit flags (treat unknown as potentially explicit for safety if filtering)
            const isExplicitLyrics = originalDeezerTrack?.explicit_lyrics === 1 || originalDeezerTrack?.explicit_lyrics === 2;
            const isExplicitCover = originalDeezerTrack?.explicit_content_cover === 1 || originalDeezerTrack?.explicit_content_cover === 2;
            // Keep the track only if neither lyrics nor cover are explicit (or unknown)
            return !isExplicitLyrics && !isExplicitCover;
          });

      logger.info(`[${traceId}] ${functionName} completed successfully. Found ${filteredTracks.length} tracks after filtering (allowExplicit=${allowExplicit}).`);
      return filteredTracks;

    } catch (error: any) {
      logger.error(`[${traceId}] ${functionName} failed:`, { query, error: error.response?.data || error.message || error });
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        throw new HttpsError("internal", `Failed to search Deezer tracks (HTTP ${status}).`, { originalError: error.message });
      }
      // Rethrow HttpsError from Deezer API error check
      if (error instanceof HttpsError) {
          throw error;
      }
      // Generic internal error
      throw new HttpsError("internal", "An unexpected error occurred during Deezer track search.", { originalError: error.message });
    }
  }

  async getTrackDetails(trackId: string, traceId: string): Promise<MusicTrack | null> {
    const functionName = "DeezerMusicService.getTrackDetails";
    logger.info(`[${traceId}] ${functionName} called for trackId: ${trackId}`);

    const trackUrl = `${DEEZER_TRACK_ENDPOINT}/${trackId}`;
    logger.debug(`[${traceId}] Calling Deezer track endpoint: ${trackUrl}`);

    try {
      const response = await axios.get(trackUrl);
      logger.debug(`[${traceId}] Deezer track response status: ${response.status}`);

      // Check for Deezer API errors (e.g., track not found returns an error object)
      if (response.data?.error) {
        // Track not found is a common case, log as warning, return null
        if (response.data.error.code === 800) {
             logger.warn(`[${traceId}] Deezer track ${trackId} not found.`);
             return null;
        }
        // Other Deezer errors
        logger.error(`[${traceId}] Deezer track API returned an error for ID ${trackId}:`, response.data.error);
        throw new HttpsError("internal", `Deezer track lookup failed: ${response.data.error.message || "Unknown Deezer error"}`);
      }

      const track = mapDeezerTrackToMusicTrack(response.data);

      if (!track) {
        logger.error(`[${traceId}] Failed to map Deezer track details for ID ${trackId}. Response data:`, response.data);
        throw new HttpsError("internal", "Failed to process track details from Deezer.");
      }

      logger.info(`[${traceId}] ${functionName} completed successfully for trackId: ${trackId}.`);
      return track;

    } catch (error: any) {
      logger.error(`[${traceId}] ${functionName} failed for trackId ${trackId}:`, { error: error.response?.data || error.message || error });
       if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
         // Treat 404 from Axios also as track not found
        if (status === 404) {
            logger.warn(`[${traceId}] Deezer track ${trackId} not found (HTTP 404).`);
            return null;
        }
        throw new HttpsError("internal", `Failed to get Deezer track details (HTTP ${status}).`, { originalError: error.message });
      }
       // Rethrow HttpsError from Deezer API error check
      if (error instanceof HttpsError) {
          throw error;
      }
      // Generic internal error
      throw new HttpsError("internal", "An unexpected error occurred fetching Deezer track details.", { originalError: error.message });
    }
  }
}

// Export a singleton instance or the class itself depending on usage pattern
export const deezerMusicService = new DeezerMusicService();