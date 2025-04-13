import { functions, httpsCallable } from '@/lib/firebase';
import logger from '@/lib/logger';
import { FirebaseHttpsError } from '@/types/common';
// Removed unused Game and Player imports
import { MusicTrack, MusicSearchSuccessResponse } from '@/types/music';
import { SongNominationInputPayload } from '@/types/round'; // Import new payload type
import { GameSettings } from '@/components/game-phases/LobbyPhase/LobbyPhase';
// --- Admin Types (Mirroring backend types for now) ---
// TODO: Consider sharing types between frontend/backend
interface AdminPopularSongInfo {
    trackId: string;
    title: string;
    artist: string;
    nominationCount: number;
}
interface AdminKPIs {
    averagePlayersPerGame: number | null;
    averageGameDurationMinutes: number | null;
    averageRoundDurationSeconds: number | null;
    jokerUsageRatePercent: number | null;
    topOverallSongs: AdminPopularSongInfo[];
}
interface AdminActiveGameInfo {
    gameId: string;
    status: string; // Assuming GameStatus maps to string
    playerCount: number;
    currentRound: number;
    createdAt: string; // ISO string
}
export interface AdminDashboardDataResponse { // Export for use in AdminPage
    success: true; // Assuming backend functions return this structure on success
    kpis: AdminKPIs;
    activeGames: AdminActiveGameInfo[];
    totalActiveGames: number;
    totalPlayersInActiveGames: number;
}
interface AdminPredefinedSong { // Renamed to avoid conflict
    trackId: string;
    title: string;
    artist: string;
    previewUrl?: string; // Keep optional if backend might not send it
}
export interface AdminChallengeDataResponse { // Export for use in AdminPage
    success: true; // Assuming backend functions return this structure on success
    id: string;
    text: string;
    predefinedSongs?: AdminPredefinedSong[];
}
// --- End Admin Types ---
// Interface for a successful game creation/join response
export interface GameJoinResponse {
    success: true;
    gameId: string;
    playerId: string;
}

// Interface for a generic success response (can be expanded)
export interface GenericSuccessResponse {
    success: true;
    message?: string;
    // Add other potential success fields
}

// Define payload type for joinGameService
interface JoinGamePayload {
    playerName: string;
    gameId?: string; // Make optional as backend might handle finding *any* game if not provided
    traceId: string;
}

// Type guard for HttpsError
function isFirebaseHttpsError(error: unknown): error is FirebaseHttpsError {
    return typeof error === 'object' && error !== null && ('code' in error || 'message' in error);
}

// --- Service Functions ---

export const joinGameService = async (
    payload: JoinGamePayload
): Promise<GameJoinResponse> => {
    const { playerName, gameId, traceId } = payload; // Destructure payload
    logger.info(`[${traceId}] Service: Attempting to join game ${gameId ? `(${gameId}) ` : ''}as ${playerName}...`);
    try {
        const joinGameCallable = httpsCallable<
            JoinGamePayload, // Use the defined payload type
            GameJoinResponse | { success: false, error: string }
        >(functions, 'joinGame');
        // Pass the whole payload object
        const result = await joinGameCallable(payload);

        logger.debug(`[${traceId}] Service: joinGame function result data:`, result.data);

        if (result.data && result.data.success === true) {
            // Type assertion needed because TS doesn't narrow based on success flag alone
            return result.data as GameJoinResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] Service: joinGame function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Join game function returned success: false");
        } else {
            throw new Error("Join game function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] Service: Error calling joinGame function (gameId: ${gameId}):`, err);
        if (isFirebaseHttpsError(err)) {
            // Re-throw with a potentially more specific message or code
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err; // Re-throw original error
        } else {
            throw new Error("An unknown error occurred during join game.");
        }
    }
};

export const createGameService = async (playerName: string, traceId: string): Promise<GameJoinResponse> => {
    logger.info(`[${traceId}] Service: Attempting to create game as ${playerName}...`);
    try {
        // TODO: Add input for totalRounds if desired, passing it here
        const createGameCallable = httpsCallable<{ playerName: string; traceId: string }, GameJoinResponse | { success: false, error: string }>(functions, 'createGame');
        const result = await createGameCallable({ playerName, traceId });

        logger.debug(`[${traceId}] Service: createGame function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GameJoinResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] Service: createGame function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Create game function returned success: false");
        } else {
            throw new Error("Create game function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] Service: Error calling createGame function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred during create game.");
        }
    }
};

// Define payload for startGameService
interface StartGamePayload {
    gameId: string;
    traceId: string;
    playerId: string | null; // Add playerId
}

export const startGameService = async (gameId: string, traceId: string): Promise<GenericSuccessResponse> => {
    logger.info(`[${traceId}] Service: Attempting to start game ${gameId}...`);
    try {
        const startGameCallable = httpsCallable<StartGamePayload, GenericSuccessResponse | { success: false, error: string }>(functions, 'startGame');
        const result = await startGameCallable({ gameId, traceId, playerId: localStorage.getItem('playerId') }); // Send playerId

        logger.debug(`[${traceId}] Service: startGame function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] Service: startGame function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Start game function returned success: false");
        } else {
            throw new Error("Start game function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] Service: Error calling startGame function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred during start game.");
        }
    }
};

// --- Game Settings API ---

interface UpdateSettingsPayload {
    gameId: string;
    newSettings: GameSettings;
    traceId: string;
    playerId: string | null; // Add playerId (make nullable if it can be null)
}

export const updateGameSettingsService = async (
    payload: UpdateSettingsPayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId } = payload;
    logger.info(`[${traceId}] Service: Attempting to update settings for game ${gameId}...`, { settings: payload.newSettings });
    try {
        const updateSettingsCallable = httpsCallable<
            UpdateSettingsPayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'updateGameSettings');
        const result = await updateSettingsCallable(payload);

        logger.debug(`[${traceId}] Service: updateGameSettings function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] Service: updateGameSettings function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Update game settings function returned success: false");
        } else {
            throw new Error("Update game settings function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] Service: Error calling updateGameSettings function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred during update game settings.");
        }
    }
};

// ExchangeCodePayload interface and exchangeSpotifyCodeService function removed (Spotify OAuth specific)

// Add other service functions (e.g., submitNomination, submitRanking, calculateScores) here later

// --- Music Search API ---

// Renamed interface
interface SearchMusicPayload {
    query: string;
    gameId: string;
    playerId: string;
    traceId: string;
    allowExplicit: boolean; // Add allowExplicit flag
}

// Renamed function and updated return type
export const searchMusicTracksAPI = async (
    payload: SearchMusicPayload // Payload now includes allowExplicit
): Promise<MusicTrack[]> => {
    const { traceId, query } = payload;
    logger.info(`[${traceId}] API: Searching music tracks for query "${query}"...`); // Updated log
    try {
        const searchCallable = httpsCallable<
            SearchMusicPayload, // Use the renamed payload type
            // Use generic response type and renamed backend function
            MusicSearchSuccessResponse | { success: false, error: string }
        >(functions, 'searchMusicTracks');
        const result = await searchCallable(payload);

        logger.debug(`[${traceId}] API: searchMusicTracks function result data:`, result.data); // Updated log

        if (result.data && result.data.success === true) {
            // Type assertion needed
            return (result.data as MusicSearchSuccessResponse).results; // Use generic response type
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: searchMusicTracks function returned success=false:`, { data: result.data }); // Updated log
            throw new Error(result.data.error || "Search music tracks function returned success: false"); // Updated error message
        } else {
            throw new Error("Search music tracks function returned unexpected data structure."); // Updated error message
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling searchMusicTracks function:`, err); // Updated log
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred during music track search."); // Updated error message
        }
    }
};

// --- Song Nomination API ---

// TrackDetailsPayload is no longer needed, replaced by SongNominationInputPayload

// Update payload interface to use the new input type
interface SubmitNominationPayload {
    gameId: string;
    playerId: string;
    nominationPayload: SongNominationInputPayload; // Use the new union type
    traceId: string;
}

export const submitSongNominationAPI = async (
    payload: SubmitNominationPayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId, playerId, nominationPayload } = payload;
    const logTrackName = 'searchResult' in nominationPayload ? nominationPayload.searchResult.name : `Predefined ID: ${nominationPayload.predefinedTrackId}`;
    logger.info(`[${traceId}] API: Submitting song nomination for player ${playerId} in game ${gameId}...`, { track: logTrackName });
    try {
        const submitNominationCallable = httpsCallable<
            SubmitNominationPayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'submitSongNomination');
        const result = await submitNominationCallable(payload);

        logger.debug(`[${traceId}] API: submitSongNomination function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: submitSongNomination function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Submit song nomination function returned success: false");
        } else {
            throw new Error("Submit song nomination function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling submitSongNomination function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred during song nomination.");
        }
    }
};

// --- Ranking API ---

interface SubmitRankingPayload {
    gameId: string;
    playerId: string;
    rankings: { [songId: string]: number };
    traceId: string;
}

export const submitRankingAPI = async (
    payload: SubmitRankingPayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId, playerId } = payload;
    logger.info(`[${traceId}] API: Submitting rankings for player ${playerId} in game ${gameId}...`);
    try {
        const submitRankingCallable = httpsCallable<
            SubmitRankingPayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'submitRanking');
        const result = await submitRankingCallable(payload);

        logger.debug(`[${traceId}] API: submitRanking function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: submitRanking function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Submit ranking function returned success: false");
        } else {
            throw new Error("Submit ranking function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling submitRanking function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred during ranking submission.");
        }
    }
};

// --- Round Progression API ---

interface GameActionPayload {
    gameId: string;
    traceId: string;
    playerId: string | null; // Added for temporary authorization, allow null
}

export const startNextRoundAPI = async (
    payload: GameActionPayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId } = payload;
    logger.info(`[${traceId}] API: Attempting to start next round for game ${gameId}...`);
    try {
        const startNextRoundCallable = httpsCallable<
            GameActionPayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'startNextRound');
        const result = await startNextRoundCallable(payload);

        logger.debug(`[${traceId}] API: startNextRound function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: startNextRound function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Start next round function returned success: false");
        } else {
            throw new Error("Start next round function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling startNextRound function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while starting next round.");
        }
    }
};

export const startSelectionPhaseAPI = async (
    payload: GameActionPayload // Now includes playerId
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId, playerId } = payload; // Extract playerId
    logger.info(`[${traceId}] API: Attempting to start selection phase for game ${gameId} by player ${playerId}...`); // Updated log
    try {
        const startSelectionPhaseCallable = httpsCallable<
            GameActionPayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'startSelectionPhase');
        const result = await startSelectionPhaseCallable(payload);

        logger.debug(`[${traceId}] API: startSelectionPhase function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: startSelectionPhase function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Start selection phase function returned success: false");
        } else {
            throw new Error("Start selection phase function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling startSelectionPhase function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while starting selection phase.");
        }
    }
};


// --- Config API ---

interface GetChallengesResponse {
    success: true;
    challenges: string[];
}

export const getPredefinedChallengesAPI = async (
    payload: { traceId: string }
): Promise<string[]> => {
    const { traceId } = payload;
    logger.info(`[${traceId}] API: Fetching predefined challenges...`);
    try {
        const getChallengesCallable = httpsCallable<
            { traceId: string }, // Input payload type
            GetChallengesResponse | { success: false, error: string } // Output type
        >(functions, 'getPredefinedChallenges');
        const result = await getChallengesCallable(payload);

        logger.debug(`[${traceId}] API: getPredefinedChallenges function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return (result.data as GetChallengesResponse).challenges;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: getPredefinedChallenges function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Get predefined challenges function returned success: false");
        } else {
            throw new Error("Get predefined challenges function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling getPredefinedChallenges function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while fetching predefined challenges.");
        }
    }
};


// --- Challenge Details API ---

// Re-define PredefinedSong structure expected from backend
// (Ideally, share types between frontend/backend, but defining here for now)
interface BackendPredefinedSong {
    trackId: string;
    title: string;
    artist: string;
    previewUrl: string;
}

interface GetChallengeDetailsPayload {
    challengeText: string;
    traceId: string;
}

interface GetChallengeDetailsSuccessResponse {
    success: true;
    predefinedSongs: BackendPredefinedSong[];
}

// Function to map backend song type to frontend MusicTrack type
const mapBackendSongToMusicTrack = (song: BackendPredefinedSong): MusicTrack => ({
    trackId: song.trackId,
    name: song.title,
    artistName: song.artist,
    previewUrl: song.previewUrl,
    // Frontend MusicTrack might have other optional fields like albumName, albumImageUrl
    // These are not available directly from the challenge data, set to null or undefined
    albumName: undefined,
    albumImageUrl: undefined,
});


export const getChallengeDetailsAPI = async (
    payload: GetChallengeDetailsPayload
): Promise<MusicTrack[]> => {
    const { traceId, challengeText } = payload;
    logger.info(`[${traceId}] API: Fetching details for challenge "${challengeText}"...`);
    try {
        const getDetailsCallable = httpsCallable<
            GetChallengeDetailsPayload,
            GetChallengeDetailsSuccessResponse | { success: false, error: string }
        >(functions, 'getChallengeDetails'); // Ensure this matches the exported function name
        const result = await getDetailsCallable(payload);

        logger.debug(`[${traceId}] API: getChallengeDetails function result data:`, result.data);

        if (result.data && result.data.success === true) {
            const backendSongs = (result.data as GetChallengeDetailsSuccessResponse).predefinedSongs;
            // Map backend songs to frontend MusicTrack type
            return backendSongs.map(mapBackendSongToMusicTrack);
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: getChallengeDetails function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Get challenge details function returned success: false");
        } else {
            throw new Error("Get challenge details function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling getChallengeDetails function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while fetching challenge details.");
        }
    }
};


// --- Playback Control API ---

type PlaybackAction = 'play' | 'pause' | 'next' | 'prev' | 'seekToIndex';

interface ControlPlaybackPayload {
    gameId: string;
    action: PlaybackAction;
    targetIndex?: number | null; // Optional, only for seekToIndex
    traceId: string;
    playerId: string | null; // Add playerId
}

export const controlPlaybackAPI = async (
    payload: ControlPlaybackPayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId, action } = payload;
    logger.info(`[${traceId}] API: Controlling playback for game ${gameId}...`, { action, targetIndex: payload.targetIndex });
    try {
        const controlPlaybackCallable = httpsCallable<
            ControlPlaybackPayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'controlPlayback');
        const result = await controlPlaybackCallable(payload);

        logger.debug(`[${traceId}] API: controlPlayback function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: controlPlayback function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Control playback function returned success: false");
        } else {
            throw new Error("Control playback function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling controlPlayback function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while controlling playback.");
        }
    }
};

// --- Start Ranking Phase API ---

interface StartRankingPhasePayload {
    gameId: string;
    traceId: string;
    playerId: string | null; // Add playerId
}

export const startRankingPhaseAPI = async (
    payload: StartRankingPhasePayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId } = payload;
    logger.info(`[${traceId}] API: Starting ranking phase for game ${gameId}...`);
    try {
        const startRankingPhaseCallable = httpsCallable<
            StartRankingPhasePayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'startRankingPhase');
        const result = await startRankingPhaseCallable(payload);

        logger.debug(`[${traceId}] API: startRankingPhase function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: startRankingPhase function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Start ranking phase function returned success: false");
        } else {
            throw new Error("Start ranking phase function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling startRankingPhase function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while starting ranking phase.");
        }
    }
};

// --- Admin API Functions ---

export const getAdminDashboardDataAPI = async (
    payload: { traceId: string }
): Promise<AdminDashboardDataResponse> => {
    const { traceId } = payload;
    logger.info(`[${traceId}] API: Fetching admin dashboard data...`);
    try {
        const getDashboardDataCallable = httpsCallable<
            { traceId: string },
            AdminDashboardDataResponse | { success: false, error: string }
        >(functions, 'getAdminDashboardData');
        const result = await getDashboardDataCallable(payload);

        logger.debug(`[${traceId}] API: getAdminDashboardData function result data:`, result.data);

        // Assuming the backend function directly returns the AdminDashboardData structure on success
        // Adjust if the backend wraps it differently (e.g., inside a 'data' property)
        if (result.data) {
            // Basic check if essential data exists; refine as needed
            if ('kpis' in result.data && 'activeGames' in result.data) {
                // We assume success if data looks correct, backend doesn't explicitly add success:true here
                return result.data as AdminDashboardDataResponse;
            } else if ('success' in result.data && result.data.success === false && 'error' in result.data) {
                logger.error(`[${traceId}] API: getAdminDashboardData function returned error:`, { data: result.data });
                throw new Error(result.data.error || "Get admin dashboard data function returned an error");
            }
        }
        throw new Error("Get admin dashboard data function returned unexpected data structure.");

    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling getAdminDashboardData function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while fetching admin dashboard data.");
        }
    }
};

export const getAdminChallengeDataAPI = async (
    payload: { traceId: string }
): Promise<AdminChallengeDataResponse[]> => { // Expecting an array of challenges
    const { traceId } = payload;
    logger.info(`[${traceId}] API: Fetching admin challenge data...`);
    try {
        const getChallengeDataCallable = httpsCallable<
            { traceId: string },
            // Assuming backend returns the array directly on success
            AdminChallengeDataResponse[] | { success: false, error: string }
        >(functions, 'getAdminChallengeData');
        const result = await getChallengeDataCallable(payload);

        logger.debug(`[${traceId}] API: getAdminChallengeData function result data:`, result.data);

        // Assuming the backend function directly returns the array on success
        if (result.data && Array.isArray(result.data)) {
            // We assume success if data is an array
            return result.data as AdminChallengeDataResponse[];
        } else if (result.data && typeof result.data === 'object' && 'success' in result.data && result.data.success === false && 'error' in result.data) {
            // Handle explicit error response from backend
            logger.error(`[${traceId}] API: getAdminChallengeData function returned error:`, { data: result.data });
            throw new Error(result.data.error || "Get admin challenge data function returned an error");
        }
        throw new Error("Get admin challenge data function returned unexpected data structure.");

    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling getAdminChallengeData function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while fetching admin challenge data.");
        }
    }
};

// --- Challenge Setting API ---

interface SetChallengePayload {
    gameId: string;
    roundId: string; // Assuming roundId is passed as string (e.g., "1", "2")
    challenge: string;
    traceId: string;
    playerId: string | null; // Add playerId
}

export const setChallengeAPI = async ( // Payload now includes playerId
    // --- Admin API Functions ---

    payload: SetChallengePayload
): Promise<GenericSuccessResponse> => {
    const { traceId, gameId, roundId, challenge, playerId } = payload; // Extract playerId
    logger.info(`[${traceId}] API: Setting challenge for game ${gameId}, round ${roundId} by player ${playerId}...`, { challenge }); // Updated log
    try {
        const setChallengeCallable = httpsCallable<
            SetChallengePayload,
            GenericSuccessResponse | { success: false, error: string }
        >(functions, 'setChallenge');
        const result = await setChallengeCallable(payload);

        logger.debug(`[${traceId}] API: setChallenge function result data:`, result.data);

        if (result.data && result.data.success === true) {
            return result.data as GenericSuccessResponse;
        } else if (result.data && result.data.success === false) {
            logger.error(`[${traceId}] API: setChallenge function returned success=false:`, { data: result.data });
            throw new Error(result.data.error || "Set challenge function returned success: false");
        } else {
            throw new Error("Set challenge function returned unexpected data structure.");
        }
    } catch (err: unknown) {
        logger.error(`[${traceId}] API: Error calling setChallenge function:`, err);
        if (isFirebaseHttpsError(err)) {
            throw new Error(`Error (${err.code || 'unknown'}): ${err.message}`);
        } else if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("An unknown error occurred while setting the challenge.");
        }
    }
};