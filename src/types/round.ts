import { MusicTrack } from './music'; // Assuming MusicTrack is defined here

/**
 * Represents the input for a player's song nomination sent to the backend.
 * Can be either full track details from search or just the ID of a predefined song.
 */
export type SongNominationInputPayload =
  | { searchResult: Omit<MusicTrack, 'submittedAt' | 'selectionSource'> } // Omit frontend-only fields
  | { predefinedTrackId: string };

// Add other round-related frontend types here if needed later
// e.g., a type for the roundData prop in GameView if 'any' isn't sufficient