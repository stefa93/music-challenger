import admin from 'firebase-admin'; // Use default import for ES Module compatibility
import axios from 'axios'; // Using axios for HTTP requests

// --- Configuration ---
// Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// pointing to your Firebase service account key JSON file.
const DEEZER_API_BASE_URL = 'https://api.deezer.com';
const SONGS_PER_CHALLENGE = 15; // Aim to fetch this many songs per challenge
const MIN_PREVIEW_DURATION = 29; // Deezer previews are usually 30s, allow slight variation

// --- Types ---
interface ChallengeDoc {
  id: string;
  text: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  link: string;
  duration: number;
  preview: string; // URL to the preview MP3
  artist: {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
    tracklist: string;
    type: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
    md5_image: string;
    tracklist: string;
    type: string;
  };
  type: string;
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

interface PredefinedSong {
  trackId: string; // Deezer track ID as string
  title: string;
  artist: string;
  previewUrl: string;
}

interface OutputData {
  [challengeId: string]: PredefinedSong[];
}

// --- Helper Functions ---

/**
 * Fetches tracks from Deezer based on a search query.
 */
async function searchDeezerTracks(query: string, limit: number): Promise<DeezerTrack[]> {
  try {
    const response = await axios.get<DeezerSearchResponse>(`${DEEZER_API_BASE_URL}/search/track`, {
      params: {
        q: query,
        limit: limit * 2, // Fetch more initially to allow filtering
        order: 'RANKING', // Prioritize relevance
      },
    });

    if (response.data && response.data.data) {
      // Filter for tracks that have a valid preview URL and meet minimum duration
      return response.data.data.filter(track =>
        track.preview && track.preview.length > 0 && track.duration >= MIN_PREVIEW_DURATION
      );
    }
    return [];
  } catch (error) {
    console.error(`Error searching Deezer for query "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Fetches all challenge documents from Firestore.
 */
async function getChallenges(db: admin.firestore.Firestore): Promise<ChallengeDoc[]> {
  const challengesSnapshot = await db.collection('challenges').get();
  if (challengesSnapshot.empty) {
    console.log('No challenges found in Firestore.');
    return [];
  }
  return challengesSnapshot.docs.map(doc => ({
    id: doc.id,
    text: doc.data().text as string, // Assuming 'text' field exists
  }));
}

// --- Main Script Logic ---

async function main() {
  try {
    // Initialize Firebase Admin SDK
    // Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment
    admin.initializeApp();
    const db = admin.firestore();

    console.log('Fetching challenges from Firestore...');
    const challenges = await getChallenges(db);

    if (challenges.length === 0) {
      console.log('Exiting: No challenges to process.');
      return;
    }

    console.log(`Found ${challenges.length} challenges. Fetching songs from Deezer...`);

    const output: OutputData = {};

    for (const challenge of challenges) {
      console.log(`\nProcessing challenge: "${challenge.text}" (ID: ${challenge.id})`);

      // Use challenge text as the search query, maybe refine later if needed
      const query = challenge.text;
      const tracks = await searchDeezerTracks(query, SONGS_PER_CHALLENGE);

      if (tracks.length === 0) {
        console.warn(`  -> No suitable tracks found for query "${query}".`);
        output[challenge.id] = [];
        continue;
      }

      // Select the top tracks up to the desired limit
      const selectedTracks = tracks.slice(0, SONGS_PER_CHALLENGE);

      output[challenge.id] = selectedTracks.map(track => ({
        trackId: track.id.toString(),
        title: track.title,
        artist: track.artist.name,
        previewUrl: track.preview,
      }));

      console.log(`  -> Found and processed ${output[challenge.id].length} tracks.`);
    }

    console.log('\n--- Generated Predefined Songs Data ---');
    console.log(JSON.stringify(output, null, 2));
    console.log('\n--- End of Data ---');
    console.log('\nRecommendation: Review the generated data above.');
    console.log('Manually update the corresponding challenge documents in Firestore with the "predefinedSongs" array.');

  } catch (error) {
    console.error('An error occurred during script execution:', error);
    process.exit(1); // Exit with error code
  }
}

main();