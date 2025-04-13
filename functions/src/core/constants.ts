// Game Constants
export const MAX_PLAYERS = 6; // Default/Maximum players allowed in a game
export const VALID_MAX_PLAYERS = [3, 4, 5, 6]; // Allowed values for maxPlayers setting
export const MIN_ROUNDS = 3; // Minimum allowed rounds (Adjusted from 1)
export const MAX_ROUNDS = 10; // Maximum allowed rounds
export const DEFAULT_TOTAL_ROUNDS = 5; // Default rounds if not specified
export const VALID_ROUNDS = [3, 5, 7, 10]; // Allowed values for rounds setting

// Time Limits (in seconds)
export const VALID_TIME_LIMITS = [60, 90, 120]; // Allowed time limit values (excluding null/None)
export const MIN_PLAYERS_TO_START = 2;

// Player Constants
export const MAX_PLAYER_NAME_LENGTH = 25; // Adjusted back to 25 as per previous service logic

// Song Constants
export const MAX_SONG_NAME_LENGTH = 100;