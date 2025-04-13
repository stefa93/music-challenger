import { FirestoreTimestamp } from "../core/types"; // Adjusted import path
import { FieldValue } from "firebase-admin/firestore"; // Import FieldValue

// Define structure for game settings (mirror frontend type)
export interface GameSettings {
  rounds: number;
  maxPlayers: number;
  allowExplicit: boolean;
  selectionTimeLimit: number | null; // seconds or null for none
  rankingTimeLimit: number | null; // seconds or null for none
}

/**
 * Represents the possible statuses of a game.
 * Includes specific round phases for clarity.
 */
export type GameStatus =
  | "waiting"
  | `round${number}_announcing` // Added for challenge announcement phase
  | `round${number}_selecting`
  | `round${number}_listening` // Added for music playback phase
  | `round${number}_discussing`
  | `round${number}_ranking`
  | `round${number}_scoring`
  | `round${number}_finished`
  | "finished";

/**
 * Represents the data structure for a Game document in Firestore (as read).
 */
export interface GameDocument {
  createdAt: FirestoreTimestamp;
  status: GameStatus;
  playerCount: number;
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  roundHostPlayerId?: string | null; // Optional or null before game starts
  challenge?: string | null; // Optional or null before round starts
  creatorPlayerId: string;
  creatorUid?: string | null; // Optional Firebase Auth UID
  startedAt?: FirestoreTimestamp; // Optional, set when game starts
  settings: GameSettings; // Add settings field
}

/**
 * Represents a Game entity within the application, including its ID.
 */
export interface Game extends GameDocument {
  id: string; // Game document ID
}

/**
 * Represents the data structure for updating a Game document in Firestore.
 * Allows FieldValue for timestamp fields that are set during updates.
 */
export type GameUpdateData = Partial<Omit<GameDocument, 'createdAt' | 'startedAt'>> & {
  startedAt?: FirestoreTimestamp | FieldValue; // Allow FieldValue for updates
  // Add other fields that might use FieldValue during updates if needed
};