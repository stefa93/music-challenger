import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db } from '../core/firestoreClient';
import axios from 'axios'; // Added axios import

// --- Deezer Helper ---
const DEEZER_API_BASE_URL = 'https://api.deezer.com';
const SONGS_PER_CHALLENGE = 15; // Aim to fetch this many songs per challenge
const MIN_PREVIEW_DURATION = 29; // Deezer previews are usually 30s

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { name: string };
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

interface PredefinedSong {
  trackId: string;
  title: string;
  artist: string;
  previewUrl: string;
}

async function searchDeezerTracks(query: string, limit: number): Promise<DeezerTrack[]> {
  try {
    const response = await axios.get<DeezerSearchResponse>(`${DEEZER_API_BASE_URL}/search/track`, {
      params: {
        q: query,
        limit: limit * 2, // Fetch more initially to allow filtering
        order: 'RANKING',
      },
      timeout: 5000, // Add a timeout for Deezer requests
    });

    if (response.data && response.data.data) {
      return response.data.data.filter(track =>
        track.preview && track.preview.length > 0 && track.duration >= MIN_PREVIEW_DURATION
      );
    }
    return [];
  } catch (error) {
    logger.error(`Error searching Deezer for query "${query}":`, error instanceof Error ? error.message : error);
    return []; // Return empty array on error to allow processing other challenges
  }
}
// --- End Deezer Helper ---
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
export const populateChallenges = onCall({ timeoutSeconds: 300 }, async (request): Promise<ErrorResponse | { success: true, challengesCreated: number, songsAdded: number }> => { // Increased timeout
    const traceId = `populateChallenges_${Date.now()}`;
    logger.info(`[${traceId}] populateChallenges function triggered.`);

    // Basic Auth - Consider making this more robust (e.g., check for admin custom claim)
    // if (!request.auth) {
    //     logger.error(`[${traceId}] Unauthenticated user attempted to populate challenges.`);
    //     throw new HttpsError('unauthenticated', 'Authentication required to populate challenges.');
    // }
    // logger.info(`[${traceId}] Triggered by authenticated user: ${request.auth.uid}`);


    const challengesList = [
        "Songs with a color in the title",
        "Best song to listen to on a rainy day",
        "Ultimate workout power song",
        "Most relaxing instrumental track",
        "Guilty pleasure pop anthem",
        "Song that makes you want to dance immediately",
        "Best road trip sing-along song",
        "A song featuring an epic guitar solo",
        "Song with a number in the title",
        "Perfect song for cooking dinner",
        "A song that tells a great story",
        "Best song from a movie soundtrack",
        "Song that reminds you of summer",
        "A track with amazing bassline",
        "Song to play air guitar to",
        "Most uplifting and optimistic song",
        "A song in a language you don't speak",
        "Best song to wake up to",
        "A song featuring a saxophone",
        "Track with the weirdest sound effects",
        "Song that feels like a warm hug",
        "Best cover song you've ever heard",
        "A song that mentions a city or place",
        "The ultimate 'power ballad'",
        "Song with a one-word title",
        "A track perfect for stargazing",
        "Song that makes you feel nostalgic",
        "Best song by a one-hit wonder",
        "A song featuring a choir",
        "Track that sounds futuristic",
        "Song that always makes you laugh",
        "Best song to listen to with headphones",
        "A song about animals",
        "The most dramatic song you know",
        "Song with a question in the title",
        "A track that feels like floating",
        "Song that mentions food or drink",
        "Best song from the year you were born",
        "A song featuring whistling",
        "Track that sounds like it's from another planet",
        "Song that makes you feel like a superhero",
        "Best song for a slow dance",
        "A song about rebellion or protest",
        "The quietest, most peaceful song",
        "Song with a person's name in the title",
        "A track that builds up intensity",
        "Song that feels like a secret",
        "Best song to clean your house to",
        "A song featuring hand claps",
        "The most epic song intro ever"
    ];

    if (challengesList.length !== 50) {
        logger.warn(`[${traceId}] Expected 50 challenges, but found ${challengesList.length}. Proceeding anyway.`);
    }

    try {
        const batch = db.batch();
        const challengesCollection = db.collection('challenges');

        logger.info(`[${traceId}] Preparing batch write for ${challengesList.length} challenges...`);

        // Optional: Delete existing challenges first if you want a clean slate
        // const existingDocs = await challengesCollection.limit(500).get(); // Limit deletion batch size
        // existingDocs.forEach(doc => batch.delete(doc.ref));
        // logger.info(`[${traceId}] Added ${existingDocs.size} deletions to batch.`);

        challengesList.forEach((challengeText, index) => {
            // Use auto-generated IDs
            const docRef = challengesCollection.doc();
            batch.set(docRef, { text: challengeText });
        });

        logger.info(`[${traceId}] Committing batch write...`);
        await batch.commit();
        logger.info(`[${traceId}] Successfully created ${challengesList.length} challenge documents.`);

        // --- Phase 2: Fetch challenges and add predefined songs ---
        logger.info(`[${traceId}] Fetching created challenges to add songs...`);
        const challengesSnapshot = await challengesCollection.get();
        let songsAddedCount = 0;
        const updatePromises: Promise<void>[] = [];

        logger.info(`[${traceId}] Processing ${challengesSnapshot.size} challenges for song population...`);

        for (const doc of challengesSnapshot.docs) {
            const challengeText = doc.data().text as string;
            const docRef = doc.ref;

            if (!challengeText) {
                logger.warn(`[${traceId}] Skipping challenge ${doc.id} due to missing text.`);
                continue;
            }

            // Add a small delay to avoid hitting Deezer rate limits too hard
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

            logger.debug(`[${traceId}] Searching Deezer for challenge: "${challengeText}"`);
            const tracks = await searchDeezerTracks(challengeText, SONGS_PER_CHALLENGE);

            if (tracks.length > 0) {
                const predefinedSongs: PredefinedSong[] = tracks
                    .slice(0, SONGS_PER_CHALLENGE) // Limit to desired number
                    .map(track => ({
                        trackId: track.id.toString(),
                        title: track.title,
                        artist: track.artist.name,
                        previewUrl: track.preview,
                    }));

                logger.debug(`[${traceId}] Adding ${predefinedSongs.length} songs to challenge ${doc.id}.`);
                // Use update instead of set to avoid overwriting text if run again
                updatePromises.push(docRef.update({ predefinedSongs }).then(() => {
                    songsAddedCount += predefinedSongs.length;
                }).catch(updateError => {
                    logger.error(`[${traceId}] Error updating challenge ${doc.id} with songs:`, updateError);
                    // Continue processing other challenges even if one fails
                }));
            } else {
                 logger.warn(`[${traceId}] No suitable songs found for challenge ${doc.id} ("${challengeText}").`);
                 // Optionally update with empty array: updatePromises.push(docRef.update({ predefinedSongs: [] }));
            }
        }

        logger.info(`[${traceId}] Waiting for ${updatePromises.length} challenge song updates to complete...`);
        await Promise.all(updatePromises);
        logger.info(`[${traceId}] Finished updating challenges. Total songs added across all challenges: ${songsAddedCount}`);

        return { success: true, challengesCreated: challengesList.length, songsAdded: songsAddedCount };

    } catch (error) {
        logger.error(`[${traceId}] Error during challenge population process:`, error);
        return { success: false, error: 'Failed during challenge population process.' };
        // throw new HttpsError('internal', 'Failed during challenge population process.');
    }
});