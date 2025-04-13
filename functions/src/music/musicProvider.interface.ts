import { MusicTrack } from "./types"; // Adjusted path

/**
 * Interface defining the contract for music provider services (e.g., Deezer, Spotify).
 * Allows the application to interact with different music APIs through a common interface.
 */
export interface MusicProviderService {
  /**
   * Searches for tracks based on a query string.
   * @param query The search query.
   * @param traceId For logging correlation.
   * @param allowExplicit Optional flag to indicate if explicit content should be included (provider support may vary). Defaults to true if undefined.
   * @param limit Optional limit for the number of results.
   * @returns A promise resolving to an array of MusicTrack objects.
   * @throws HttpsError for API errors or internal issues.
   */
  searchTracks(query: string, traceId: string, allowExplicit?: boolean, limit?: number): Promise<MusicTrack[]>;

  /**
   * Fetches details for a single track by its provider-specific ID.
   * This might be optional if the search results already contain all necessary details.
   * @param trackId The provider-specific ID of the track.
   * @param traceId For logging correlation.
   * @returns A promise resolving to a MusicTrack object or null if not found.
   * @throws HttpsError for API errors or internal issues.
   */
  getTrackDetails?(trackId: string, traceId: string): Promise<MusicTrack | null>;

  // Add other common methods if needed in the future, e.g.:
  // getAlbumDetails?(albumId: string, traceId: string): Promise<MusicAlbum | null>;
  // getArtistDetails?(artistId: string, traceId: string): Promise<MusicArtist | null>;
}