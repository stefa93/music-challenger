import { onCall } from 'firebase-functions/v2/https'; // Added HttpsError
import { logger } from 'firebase-functions'; // Corrected logger import
import { db } from '../core/firestoreClient';
import { getMusicProvider } from '../music/music.service'; // Import music provider
import { MusicTrack } from '../music/types'; // Import MusicTrack type
import { challengeSongList, ChallengeWithSongs } from './challengeSongList'; // Import the curated list

// Removed old Deezer helper constants

// Removed old DeezerTrack, DeezerSearchResponse, PredefinedSong interfaces
// Removed old searchDeezerTracks function
interface GetChallengesResponse {
  success: true;
  challenges: string[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Fetches the list of predefined challenges from the 'challenges' collection.
 */
export const getPredefinedChallenges = onCall(async (request): Promise<GetChallengesResponse | ErrorResponse> => {
  const traceId = `getChallenges_${Date.now()}`;
  logger.info(`[${traceId}] getPredefinedChallenges function triggered.`);

  // Authentication Check (optional for public challenges, but good practice)
  if (!request.auth) {
    logger.warn(`[${traceId}] Unauthenticated user attempted to get challenges.`);
    // Depending on requirements, you might allow this or throw an error.
    // For now, let's allow unauthenticated access to challenges.
    // throw new HttpsError('unauthenticated', 'You must be logged in to get challenges.');
  }

  try {
    logger.debug(`[${traceId}] Fetching challenges from Firestore collection 'challenges'.`);
    const challengesSnapshot = await db.collection('challenges').get();

    if (challengesSnapshot.empty) {
      logger.warn(`[${traceId}] No predefined challenges found in the 'challenges' collection.`);
      return { success: true, challenges: [] };
    }

    const challenges = challengesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure the document has a 'text' field and it's a string
      if (data && typeof data.text === 'string') {
        return data.text;
      }
      logger.warn(`[${traceId}] Challenge document ${doc.id} is missing 'text' field or it's not a string. Skipping.`);
      return null; // Filter out invalid documents later
    }).filter((challenge): challenge is string => challenge !== null); // Type guard to filter out nulls

    logger.info(`[${traceId}] Successfully fetched ${challenges.length} predefined challenges.`);
    return { success: true, challenges };

  } catch (error) {
    logger.error(`[${traceId}] Error fetching predefined challenges:`, error);
    return { success: false, error: 'Failed to fetch predefined challenges.' };
    // Or throw HttpsError for client-side handling
    // throw new HttpsError('internal', 'Failed to fetch predefined challenges.');
  }
});


/**
 * Populates the 'challenges' collection with a predefined list of challenges.
 * WARNING: This will overwrite existing documents if called multiple times without checks.
 * Consider adding checks or making it admin-only in a real application.
 */
export const populateChallenges = onCall({ timeoutSeconds: 540 }, async (request): Promise<ErrorResponse | { success: true, challengesProcessed: number, songsAdded: number }> => { // Increased timeout further for API calls
    const traceId = `populateChallenges_${Date.now()}`;
    logger.info(`[${traceId}] populateChallenges function triggered.`);
    const musicProvider = getMusicProvider(); // Get the configured music provider

    // Basic Auth - Consider making this more robust (e.g., check for admin custom claim)
    // if (!request.auth) {
    //     logger.error(`[${traceId}] Unauthenticated user attempted to populate challenges.`);
    //     throw new HttpsError('unauthenticated', 'Authentication required to populate challenges.');
    // }
    // logger.info(`[${traceId}] Triggered by authenticated user: ${request.auth.uid}`);


    // Use the imported curated list
    const curatedChallenges: ChallengeWithSongs[] = challengeSongList;

    logger.info(`[${traceId}] Found ${curatedChallenges.length} challenges in the curated list.`);

    try {
        // Batch is not used in the new sequential approach
        const challengesCollection = db.collection('challenges');
        let totalSongsAdded = 0;
        let challengesProcessed = 0;

        logger.info(`[${traceId}] Processing ${curatedChallenges.length} challenges from the curated list...`);

        // Process challenges sequentially to manage API rate limits and Firestore writes
        for (const challenge of curatedChallenges) {
            const challengeText = challenge.text;
            const songsToFind = challenge.songs;
            const challengeDocId = challengeText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); // Generate a consistent ID
            const docRef = challengesCollection.doc(challengeDocId);

            logger.info(`[${traceId}] Processing challenge: "${challengeText}" (ID: ${challengeDocId})`);

            const predefinedSongs: MusicTrack[] = [];
            let songsFoundForThisChallenge = 0;

            for (const songIdentifier of songsToFind) {
                const query = `${songIdentifier.title} ${songIdentifier.artist}`;
                logger.debug(`[${traceId}] Searching for song: "${query}" for challenge "${challengeText}"`);

                // Add delay before each API call
                await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay

                try {
                    const searchResults = await musicProvider.searchTracks(query, traceId, true, 1); // Limit to 1 for best match

                    if (searchResults.length > 0) {
                        const track = searchResults[0];
                        if (track.previewUrl) {
                            // Map to the structure needed for Firestore (subset of MusicTrack)
                            const songData: Partial<MusicTrack> & { title: string, artist: string } = { // Use Partial for flexibility if needed, ensure core fields
                                trackId: track.trackId,
                                title: track.name, // Map name to title
                                artist: track.artistName, // Map artistName to artist
                                previewUrl: track.previewUrl,
                                // Optionally include other fields like albumName, albumImageUrl if desired
                                albumName: track.albumName,
                                albumImageUrl: track.albumImageUrl,
                            };
                            predefinedSongs.push(songData as MusicTrack); // Add the found song
                            songsFoundForThisChallenge++;
                            logger.debug(`[${traceId}] Found song "${track.name}" by ${track.artistName} with preview for challenge "${challengeText}".`);
                        } else {
                            logger.warn(`[${traceId}] Song "${track.name}" by ${track.artistName} found for challenge "${challengeText}", but skipped due to missing previewUrl.`);
                        }
                    } else {
                        logger.warn(`[${traceId}] No song found for query "${query}" for challenge "${challengeText}".`);
                    }
                } catch (searchError) {
                    logger.error(`[${traceId}] Error searching for song "${query}" for challenge "${challengeText}":`, searchError);
                    // Continue to the next song even if one search fails
                }
            }

            try {
                // Use set with merge: true to create or update the document
                await docRef.set({
                    text: challengeText,
                    predefinedSongs: predefinedSongs
                }, { merge: true });

                logger.info(`[${traceId}] Successfully processed challenge "${challengeText}". Added ${songsFoundForThisChallenge} songs.`);
                totalSongsAdded += songsFoundForThisChallenge;
                challengesProcessed++;
            } catch (writeError) {
                 logger.error(`[${traceId}] Error writing challenge "${challengeText}" (ID: ${challengeDocId}) to Firestore:`, writeError);
                 // Continue to the next challenge even if one write fails
            }
        } // End of challenges loop

        logger.info(`[${traceId}] Finished processing all challenges. Processed: ${challengesProcessed}, Total songs added: ${totalSongsAdded}`);

        return { success: true, challengesProcessed: challengesProcessed, songsAdded: totalSongsAdded };

    } catch (error) {
        logger.error(`[${traceId}] Error during challenge population process:`, error);
        return { success: false, error: 'Failed during challenge population process.' };
        // throw new HttpsError('internal', 'Failed during challenge population process.');
    }
});

// Removed PredefinedSong interface if MusicTrack is used everywhere now
// Removed DeezerTrack and DeezerSearchResponse interfaces if searchDeezerTracks is removed