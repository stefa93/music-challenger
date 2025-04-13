import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
// dotenv is kept in case other env vars are needed later, but Spotify creds are removed
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// --- Configuration ---
const DEEZER_TRACK_API_URL = 'https://api.deezer.com/track'; // Base URL for getting single track
const DEEZER_SEARCH_API_URL = 'https://api.deezer.com/search'; // Base URL for searching tracks
// List of Deezer Track IDs to fetch mock data for
const TRACK_IDS = [
    '3135556', // Example: Daft Punk - Get Lucky
    '98244132', // Example: Lil Kleine - Drank & Drugs
    '2292998895', // Example: Kleine John - Drank in Systeem
    '1141065582', // Example: Future - Drankin N Smokin
    '914866', // Example: The Opposites - Drank Vannacht
];

// Type definition (simplified for script output)
interface MockSongSubmission {
  trackId: string; // Generic track ID
  name: string;
  artistName: string; // Use generic artistName
  preview_url: string | null;
  albumImageUrl?: string; // Smallest image preferred
}

// --- Deezer API Interaction ---
// No authentication needed for public endpoints used

/** Fetches details for a single Deezer track by ID */
async function getTrackDetailsById(trackId: string): Promise<MockSongSubmission | null> {
  console.log(`Fetching details for Deezer ID: ${trackId}`);
  const url = `${DEEZER_TRACK_API_URL}/${trackId}`;
  try {
    // No Authorization header needed for Deezer public API
    const response = await axios.get(url);
    const track = response.data;

    // Check for Deezer API errors in response
    if (!track || track.error) {
        console.error(`Deezer API error for track ${trackId}:`, track?.error || 'Unknown error');
        return null;
    }

    // Use optional chaining and nullish coalescing for safety
    const artistName = track.artist?.name ?? 'Unknown Artist';
    // Prefer small cover, fallback to default cover, then undefined
    const albumImage = track.album?.cover_small ?? track.album?.cover ?? undefined;

    return {
      trackId: track.id.toString(), // Use generic trackId
      name: track.title ?? 'Unknown Title', // Deezer uses 'title'
      artistName: artistName, // Use generic artistName (matches MusicTrack type)
      preview_url: track.preview || null, // Deezer uses 'preview'
      albumImageUrl: albumImage,
    };
  } catch (error: any) {
    // Log Axios error details if available
    console.error(`Failed to fetch details for Deezer track ${trackId}:`, error.response?.data || error.message);
    return null;
  }
}

/** Searches Deezer for a track by name and artist, returning the first match with a preview URL */
async function searchForTrackWithPreview(
    trackName: string,
    artistName: string,
    maxRetries = 5 // Limit the number of search results to check
): Promise<MockSongSubmission | null> {
    console.log(`Searching Deezer for preview for: "${trackName}" by ${artistName} (checking top ${maxRetries} results)`);
    // Basic cleaning for search query
    const cleanTrackName = trackName.replace(/ \(.*\)/, '').trim(); // Remove things like (Remastered)
    const cleanArtistName = artistName.split(',')[0].trim(); // Use primary artist

    // Deezer search query format (adjust if needed based on documentation)
    const searchQuery = `track:"${cleanTrackName}" artist:"${cleanArtistName}"`;
    const searchParams = new URLSearchParams({
        q: searchQuery,
        limit: maxRetries.toString(),
        // No 'type' or 'market' needed for basic Deezer track search? Verify if necessary.
    });
    const searchUrl = `${DEEZER_SEARCH_API_URL}?${searchParams.toString()}`;

    try {
        // No Authorization header needed
        const response = await axios.get(searchUrl);

        // Deezer results are in the 'data' array
        const results = response.data?.data;
        if (!results || results.length === 0) {
            console.log(`  -> No Deezer search results found.`);
            return null;
        }

        // Find the first result with a preview_url that roughly matches the name
        for (const track of results) {
            // Check if preview exists and title roughly matches
            if (track.preview && track.title?.toLowerCase().includes(cleanTrackName.toLowerCase())) {
                console.log(`  -> Found alternative Deezer version with preview: ${track.title} (${track.id})`);
                const foundArtistName = track.artist?.name ?? 'Unknown Artist';
                const foundAlbumImage = track.album?.cover_small ?? track.album?.cover ?? undefined;

                return {
                    trackId: track.id.toString(), // Use generic trackId
                    name: track.title ?? 'Unknown Title',
                    artistName: foundArtistName, // Use generic artistName
                    preview_url: track.preview, // Use the preview URL found
                    albumImageUrl: foundAlbumImage,
                };
            }
        }

        console.log(`  -> No Deezer results with preview found in the top ${maxRetries}.`);
        return null; // No suitable track found

    } catch (error: any) {
        console.error(`Deezer search failed for "${trackName}" by ${artistName}:`, error.response?.data || error.message);
        return null;
    }
}

// --- Main Script Logic ---

async function generateMocks() {
  console.log('Starting Deezer mock data generation...');
  try {
    // No accessToken needed
    const mockData: MockSongSubmission[] = [];

    console.log(`Processing ${TRACK_IDS.length} Deezer track IDs...`);
    for (const trackId of TRACK_IDS) {
      let finalDetails: MockSongSubmission | null = null;
      // Fetch details directly using Deezer track ID
      const initialDetails = await getTrackDetailsById(trackId);

      if (!initialDetails) {
        console.warn(`Skipping Deezer track ID ${trackId} - initial fetch failed.`);
        continue; // Skip to next ID if initial fetch fails
      }

      // Check if the directly fetched track has a preview URL
      if (initialDetails.preview_url) {
        console.log(`  -> Found preview URL for ${initialDetails.name} (${trackId}) directly.`);
        finalDetails = initialDetails;
      } else {
        // If no preview, search Deezer for an alternative version
        console.log(`  -> No preview URL for ${initialDetails.name} (${trackId}). Searching Deezer for alternatives...`);
        // Add a small delay before searching to potentially avoid rate limits (though likely not needed without auth)
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay
        const alternativeDetails = await searchForTrackWithPreview(
          initialDetails.name,
          initialDetails.artistName // Use updated property name
          // No accessToken or market needed here for Deezer search
        );
        if (alternativeDetails) {
          finalDetails = alternativeDetails; // Use the alternative version found via search
        } else {
          // If search also fails to find a preview, use the original details
          console.log(`  -> No alternative with preview found. Using original details for ${initialDetails.name}.`);
          finalDetails = initialDetails;
        }
      }

      // Add the final details (either original or alternative) to our mock data array
      if (finalDetails) {
        mockData.push(finalDetails);
      }
    }

    console.log('\n--- Generated Deezer Mock Data ---');
    console.log('// Copy this array into your Storybook file (e.g., MusicPlaybackPhase.stories.tsx)');
    // Consider renaming the variable in the story file as well
    console.log('const mockMusicSongs: PlayerSongSubmission[] = [ // Use generic name');
    mockData.forEach((song, index) => {
      // Escape potential quotes in names/artists for valid JS string
      const safeName = song.name.replace(/'/g, "\\'");
      const safeArtist = song.artistName.replace(/'/g, "\\'"); // Use artistName
      // Output using trackId
      console.log(`  { trackId: '${song.trackId}', name: '${safeName}', artist: '${safeArtist}', preview_url: ${song.preview_url ? `'${song.preview_url}'` : 'null'}, albumImageUrl: ${song.albumImageUrl ? `'${song.albumImageUrl}'` : 'undefined'} }${index < mockData.length - 1 ? ',' : ''}`);
    });
    console.log('];');
    console.log('--- End Deezer Mock Data ---\n');

  } catch (error) {
    console.error('\nError during Deezer mock data generation:', error);
    process.exit(1); // Exit with error code
  }
}

generateMocks();