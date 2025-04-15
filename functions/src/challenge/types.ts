// Removed import from config.handlers

/**
 * Represents a predefined song associated with a challenge.
 */
export interface PredefinedSong {
  trackId: string;
  title: string;
  artist: string;
  previewUrl: string; // Preview URL is required
  albumImageUrl?: string; // Optional album art URL
}

/**
 * Represents the data structure for a Challenge document in Firestore
 * (stored in the 'challenges' collection).
 */
export interface ChallengeDocument {
  text: string;
  predefinedSongs?: PredefinedSong[]; // Array of predefined songs for this challenge
}

// Note: PredefinedSong is now defined locally.