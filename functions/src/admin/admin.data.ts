import { db } from '../core/firestoreClient'; // Import the initialized Firestore instance
import * as logger from 'firebase-functions/logger';
import { AdminChallengeData } from './types'; // Import the specific admin type
import { ChallengeDocument } from '../challenge/types';
import { RoundDocument, PlayerSongSubmission } from '../round/types'; // Import RoundDocument and PlayerSongSubmission

const GAMES_COLLECTION = 'games';
const CHALLENGES_COLLECTION = 'challenges';

/**
 * Fetches all games that are currently active (not 'finished').
 * TODO: Add pagination or limits if the number of active games can be large.
 * @returns {Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>>} Firestore query snapshot
 */
export const getActiveGames = async () => {
  logger.info('Querying active games from Firestore...');
  try {
    const snapshot = await db.collection(GAMES_COLLECTION)
      .where('status', '!=', 'finished')
      // .orderBy('createdAt', 'desc') // Optional: order by creation time
      .get();
    logger.info(`Found ${snapshot.size} active games.`);
    return snapshot;
  } catch (error) {
    logger.error('Error fetching active games:', error);
    throw new Error('Failed to fetch active games from Firestore.');
  }
};

/**
 * Fetches all games that are completed ('finished').
 * Needed for calculating historical KPIs like average game duration.
 * TODO: Add pagination, limits, or time range filters if the number of completed games is large.
 * @returns {Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>>} Firestore query snapshot
 */
export const getCompletedGames = async () => {
  logger.info('Querying completed games from Firestore...');
  try {
    const snapshot = await db.collection(GAMES_COLLECTION)
      .where('status', '==', 'finished')
      // .orderBy('finishedAt', 'desc') // Optional: order by completion time if available
      .get();
    logger.info(`Found ${snapshot.size} completed games.`);
    return snapshot;
  } catch (error) {
    logger.error('Error fetching completed games:', error);
    throw new Error('Failed to fetch completed games from Firestore.');
  }
};


/**
 * Fetches all challenges from the challenges collection for admin view.
 * @returns {Promise<AdminChallengeData[]>} Array of challenge documents with IDs
 */
export const getAllChallenges = async (): Promise<AdminChallengeData[]> => {
  logger.info('Querying all challenges from Firestore...');
  try {
    const snapshot = await db.collection(CHALLENGES_COLLECTION).get();
    const challenges = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): AdminChallengeData => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text || 'Error: Missing text', // Provide default or handle error
        predefinedSongs: data.predefinedSongs || [], // Provide default
      };
    });
    logger.info(`Found ${challenges.length} challenges.`);
    return challenges;
  } catch (error) {
    logger.error('Error fetching challenges:', error);
    throw new Error('Failed to fetch challenges from Firestore.');
  }
};

/**
 * Fetches song nomination data from recent completed rounds.
 * NOTE: This can be read-intensive. Consider aggregation for scalability.
 * @param {number} gameLimit - Max number of recent completed games to check.
 * @returns {Promise<Array<{trackId: string, title: string, artist: string}>>} List of nominated songs.
 */
export const getRecentSongNominations = async (gameLimit = 20) => {
  logger.info(`Querying song nominations from last ${gameLimit} completed games...`);
  const nominations: Array<{ trackId: string, title: string, artist: string }> = [];
  try {
    const completedGamesSnapshot = await db.collection(GAMES_COLLECTION)
      .where('status', '==', 'finished')
      .orderBy('createdAt', 'desc') // Assuming createdAt exists and is indexed, or use a dedicated finishedAt timestamp
      .limit(gameLimit)
      .get();

    logger.info(`Found ${completedGamesSnapshot.size} completed games to check for nominations.`);

    for (const gameDoc of completedGamesSnapshot.docs) {
      const roundsSnapshot = await gameDoc.ref.collection('rounds').get();
      roundsSnapshot.forEach(roundDoc => {
        const roundData = roundDoc.data() as RoundDocument;
        // Extract songs from playerSongs map (adjust if using songsForRanking)
        if (roundData.playerSongs) {
          // Cast playerSongs to the correct type before using Object.values
          const playerSongsMap = roundData.playerSongs as { [playerId: string]: PlayerSongSubmission };
          Object.values(playerSongsMap).forEach((song: PlayerSongSubmission) => {
            if (song && song.trackId && song.name && song.artist) { // Check song.name instead of song.title
              nominations.push({
                trackId: song.trackId,
                title: song.name, // Use 'name' as defined in PlayerSongSubmission
                artist: song.artist,
              });
            }
          });
        }
        // Alternatively, extract from songsForRanking if that's the final list
        // if (roundData.songsForRanking) {
        //   roundData.songsForRanking.forEach(song => {
        //      if (song && song.trackId && song.title && song.artist) {
        //       nominations.push({ trackId: song.trackId, title: song.title, artist: song.artist });
        //     }
        //   });
        // }
      });
    }
    logger.info(`Collected ${nominations.length} total song nominations from recent games.`);
    return nominations;
  } catch (error) {
    logger.error('Error fetching song nominations:', error);
    throw new Error('Failed to fetch song nominations from Firestore.');
  }
};

// TODO: Add functions to fetch player counts, round data, etc., as needed for specific KPIs.