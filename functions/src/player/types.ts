import { FirestoreTimestamp } from "../core/types"; // Adjusted path

/**
 * Represents the data structure for a Player document in Firestore.
 */
export interface PlayerDocument {
  name: string;
  joinedAt: FirestoreTimestamp;
  score: number;
  hasJoined?: boolean; // Optional, as it might not exist on older docs or is implied
  jokerAvailable?: boolean; // Optional, might be added later
  isCreator?: boolean; // Optional, only true for the game creator
  // Spotify token fields removed as part of generic music provider refactor
}

/**
 * Represents a Player entity within the application, including its ID.
 */
export interface Player extends PlayerDocument {
  id: string; // Player document ID
}