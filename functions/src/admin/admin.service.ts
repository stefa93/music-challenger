import * as logger from 'firebase-functions/logger';
import { AdminDashboardData, AdminChallengeData, AdminKPIs, ActiveGameInfo, PopularSongInfo } from './types';
import { getAllChallenges, getActiveGames, getCompletedGames, getRecentSongNominations } from './admin.data';
import { GameStatus } from '../game/types'; // Import GameStatus

const TOP_SONG_LIMIT = 5; // How many popular songs to return

/**
 * Fetches and calculates all data needed for the admin dashboard.
 * @returns {Promise<AdminDashboardData>}
 */
export const getAdminDashboardDataService = async (): Promise<AdminDashboardData> => {
  logger.info('Fetching admin dashboard data...');

  // --- Fetch Raw Data ---
  // Use Promise.all for concurrent fetching
  const [
    activeGamesSnapshot,
    completedGamesSnapshot,
    recentNominations,
  ] = await Promise.all([
    getActiveGames(),
    getCompletedGames(),
    getRecentSongNominations(), // Fetch nominations
  ]);

  const activeGamesRaw = activeGamesSnapshot.docs;
  const completedGamesRaw = completedGamesSnapshot.docs;

  // --- Calculate KPIs ---
  const kpis: AdminKPIs = calculateAdminKPIs(activeGamesRaw, completedGamesRaw, recentNominations);

  // --- Format Active Games ---
  const activeGames: ActiveGameInfo[] = formatActiveGames(activeGamesRaw);

  // --- Assemble Dashboard Data ---
  const totalPlayersInActiveGames = activeGames.reduce((sum, game) => sum + game.playerCount, 0);
  const dashboardData: AdminDashboardData = {
    kpis,
    activeGames,
    totalActiveGames: activeGames.length,
    totalPlayersInActiveGames,
  };

  logger.info('Admin dashboard data prepared.'); // Removed data logging for brevity
  return dashboardData;
};

/**
 * Fetches all challenge data.
 * @returns {Promise<AdminChallengeData[]>}
 */
export const getAdminChallengeDataService = async (): Promise<AdminChallengeData[]> => {
  logger.info('Fetching admin challenge data...');
  const challenges: AdminChallengeData[] = await getAllChallenges();
  logger.info(`Found ${challenges.length} challenges.`);
  return challenges;
};

// --- Helper Functions ---

/**
 * Calculates various KPIs based on game data.
 * @param activeGamesRaw - Raw data for active games.
 * @param completedGamesRaw - Raw data for completed games.
 * @param nominations - List of nominated songs.
 * @returns {AdminKPIs}
 */
const calculateAdminKPIs = (
  activeGamesRaw: FirebaseFirestore.QueryDocumentSnapshot[],
  completedGamesRaw: FirebaseFirestore.QueryDocumentSnapshot[],
  nominations: Array<{trackId: string, title: string, artist: string}>
): AdminKPIs => {
  let totalPlayersInActiveGames = 0;
  activeGamesRaw.forEach(doc => {
    // TODO: Fetch actual player count per game if not stored directly
    totalPlayersInActiveGames += doc.data().playerCount || 0; // Assuming playerCount exists
  });
  const averagePlayersPerGame = activeGamesRaw.length > 0
    ? totalPlayersInActiveGames / activeGamesRaw.length
    : 0;

  // --- Avg Game Duration ---
  let totalDurationMinutes = 0;
  let validCompletedGames = 0;
  completedGamesRaw.forEach(doc => {
    const data = doc.data();
    // Requires 'createdAt' and 'finishedAt' timestamps on the game document
    if (data.createdAt && data.finishedAt && data.createdAt.toMillis && data.finishedAt.toMillis) {
      const durationMillis = data.finishedAt.toMillis() - data.createdAt.toMillis();
      totalDurationMinutes += durationMillis / (1000 * 60);
      validCompletedGames++;
    }
  });
  const averageGameDurationMinutes = validCompletedGames > 0
    ? totalDurationMinutes / validCompletedGames
    : null;

  // --- Top Overall Songs ---
  const songCounts: { [trackId: string]: { count: number, title: string, artist: string } } = {};
  nominations.forEach(song => {
    if (!songCounts[song.trackId]) {
      songCounts[song.trackId] = { count: 0, title: song.title, artist: song.artist };
    }
    songCounts[song.trackId].count++;
  });

  const sortedSongs = Object.entries(songCounts)
    .map(([trackId, data]) => ({ trackId, ...data }))
    .sort((a, b) => b.count - a.count); // Sort descending by count

  const topOverallSongs: PopularSongInfo[] = sortedSongs
    .slice(0, TOP_SONG_LIMIT)
    .map(song => ({
      trackId: song.trackId,
      title: song.title,
      artist: song.artist,
      nominationCount: song.count,
    }));

  // --- Placeholder KPIs ---
  // TODO: Implement avgRoundDurationSeconds (needs round data)
  // TODO: Implement jokerUsageRatePercent (needs player round data)
  logger.warn('Avg Round Duration & Joker Usage KPI calculation is not implemented yet.');

  return {
    averagePlayersPerGame,
    averageGameDurationMinutes,
    averageRoundDurationSeconds: null, // Placeholder
    jokerUsageRatePercent: null, // Placeholder
    topOverallSongs,
  };
};

/**
 * Formats raw active game data into the required structure.
 * @param activeGamesRaw - Raw data for active games.
 * @returns {ActiveGameInfo[]}
 */
const formatActiveGames = (activeGamesRaw: FirebaseFirestore.QueryDocumentSnapshot[]): ActiveGameInfo[] => {
  return activeGamesRaw.map(doc => {
    const data = doc.data();
    const createdAtTimestamp = data.createdAt;
    let createdAtISO = 'N/A';
    if (createdAtTimestamp && createdAtTimestamp.toDate) {
        createdAtISO = createdAtTimestamp.toDate().toISOString();
    } else if (typeof createdAtTimestamp === 'string') {
        // Attempt to parse if it's already a string (less likely for Firestore Timestamps)
        try {
            createdAtISO = new Date(createdAtTimestamp).toISOString();
        } catch (e) { /* ignore parse error */ }
    }

    return {
      gameId: doc.id,
      status: data.status as GameStatus || 'unknown',
      // TODO: Fetch actual player count if needed. Using placeholder/direct field for now.
      playerCount: data.playerCount || 0, // Assuming playerCount field exists
      currentRound: data.currentRound || 0,
      createdAt: createdAtISO,
    };
  });
};