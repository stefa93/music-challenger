import { Timestamp } from 'firebase/firestore';
import { GameSettings } from '@/components/game-phases/LobbyPhase/LobbyPhase'; // Import settings type

/**
 * Represents the possible statuses of a game.
 * Includes specific round phases for clarity.
 * Should mirror the definition in functions/src/types/game.ts
 */
export type GameStatus =
  | "waiting"
  | `round${number}_announcing` // Added for challenge announcement phase
  | `round${number}_selecting`
  | `round${number}_discussing` // Note: This was removed from backend logic but kept in type for now? Check if needed.
  | `round${number}_ranking`
  | `round${number}_scoring`
  | `round${number}_finished`
  | "finished";

export interface Game {
  id: string; // Document ID
  status: GameStatus;
  createdAt: Timestamp;
  currentRound: number;
  totalRounds: number; // Assuming this exists or will be added
  roundHostPlayerId: string;
  challenge: string;
  creatorPlayerId?: string; // Added based on App.tsx usage
  settings?: GameSettings; // Added optional settings field
  // Add other fields as needed based on actual Firestore data
}