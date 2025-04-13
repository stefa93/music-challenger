import { FirestoreTimestamp } from "../core/types"; // Adjusted path
import { FieldValue } from "firebase-admin/firestore"; // Import FieldValue

/**
 * Represents the possible statuses of a single round.
 */
export type RoundStatus =
  | "announcing" // Added for challenge announcement phase
  | "selecting_songs"
  | "listening" // Added for music playback phase
  // Removed duplicate listening status
  | "discussing"
  | "ranking"
  | "scoring"
  | "finished"
  | "error_scoring"; // Added error state

/**
 * Represents a player's song submission within a round.
 */
export interface PlayerSongSubmission {
  trackId: string; // Generic Music Provider Track ID
  name: string; // Track name
  artist: string; // Primary artist name
  submittedAt?: FirestoreTimestamp; // Make optional as predefined songs won't have this
  previewUrl?: string; // Added preview URL, needed for playback
}

/**
 * Represents the input for a player's song nomination.
 * Can be either a full track object from search or just the ID of a predefined song.
 */
export type SongNominationInput =
  | { searchResult: Omit<PlayerSongSubmission, "submittedAt"> }
  | { predefinedTrackId: string };

/**
 * Represents the data structure for a Round document in Firestore.
 */
export interface RoundDocument {
  challenge: string | null; // Allow null for initial state before host sets it
  hostPlayerId: string;
  status: RoundStatus;
  gameSongs: any[]; // Define more specific type if game songs are implemented
  playerSongs: { [playerId: string]: PlayerSongSubmission }; // Map player ID to their submission
  createdAt: FirestoreTimestamp;
  results?: RoundResult[]; // Optional: Detailed results stored after scoring
  winnerData?: RoundWinnerData | null; // Optional: Winner data stored after scoring
  // Playback State (for synchronized listening)
  currentPlayingTrackIndex?: number; // Index in the playerSongs array/list being played
  isPlaying?: boolean; // Is music currently playing for the group?
  selectionStartTime?: FirestoreTimestamp | null; // Timestamp when selecting_songs phase began
  rankingStartTime?: FirestoreTimestamp | null; // Timestamp when ranking phase began
  songsForRanking?: PlayerSongSubmission[]; // Final list of songs (min 5) for listening/ranking
}

/**
 * Represents a Round entity within the application, including its number (ID).
 */
export interface Round extends RoundDocument {
  roundNumber: number; // Round document ID (as a number)
}

/**
 * Represents the data structure for a player's Ranking document in Firestore
 * (stored in the 'rankings' subcollection of a round).
 */
export interface RankingDocument {
  rankings: { [songId: string]: number }; // Map song ID (could be player ID for submitted songs) to rank number
  submittedAt: FirestoreTimestamp;
}

/**
 * Represents the data structure for a player's Score document in Firestore
 * (stored in the 'scores' subcollection of a round).
 */
export interface ScoreDocument {
  roundScore: number; // Base score from rankings
  bonusPoints: number;
  jokerUsed: boolean;
  totalScoreForRound: number;
  calculatedAt: FirestoreTimestamp;
}

/**
 * Represents the detailed result for a single song/player in a finished round.
 */
export interface RoundResult {
  playerId: string;
  playerName: string;
  songName: string;
  songArtist: string;
  pointsAwarded: number;
  isWinner: boolean; // Indicates if this player was one of the round winners
}

/**
 * Represents the data about the winner(s) of a round.
 */
export interface RoundWinnerData {
  winnerPlayerIds: string[]; // Array of player IDs who tied for the win
  winningScore: number;
}

/**
 * Represents the data structure for updating a Round document in Firestore.
 * Allows FieldValue for timestamp fields that are set during updates.
 */
export type RoundUpdateData = Partial<Omit<RoundDocument, 'createdAt' | 'selectionStartTime' | 'rankingStartTime'>> & {
    selectionStartTime?: FirestoreTimestamp | FieldValue | null;
    rankingStartTime?: FirestoreTimestamp | FieldValue | null; // Allow FieldValue for updates
    songsForRanking?: PlayerSongSubmission[]; // Allow updating the final song list
};