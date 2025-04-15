import { GameStatus } from '../game/types';
import { PredefinedSong } from '../challenge/types'; // Import PredefinedSong type

// Information about a popular song
export interface PopularSongInfo {
  trackId: string;
  title: string;
  artist: string;
  nominationCount: number;
}

// Structure for Key Performance Indicators
export interface AdminKPIs {
    averagePlayersPerGame: number;
    averageGameDurationMinutes: number | null; // In minutes, null if no completed games
    averageRoundDurationSeconds: number | null; // In seconds, null if no completed rounds
    jokerUsageRatePercent: number | null; // Percentage, null if no games completed/jokers used
    topOverallSongs: PopularSongInfo[]; // Top N most nominated songs overall
    // TODO: Add topSongsPerChallenge if needed later
    // TODO: Add most frequent challenges if needed later
}

// Information about a single active game
export interface ActiveGameInfo {
    gameId: string;
    status: GameStatus;
    playerCount: number;
    currentRound: number;
    createdAt: string; // ISO string format
}

// Consolidated data for the main dashboard view
export interface AdminDashboardData {
    kpis: AdminKPIs;
    activeGames: ActiveGameInfo[];
    totalActiveGames: number;
    totalPlayersInActiveGames: number;
}

// Dedicated type for challenge data returned by admin functions, including the ID
export interface AdminChallengeData {
    id: string;
    text: string;
    predefinedSongs?: PredefinedSong[];
}