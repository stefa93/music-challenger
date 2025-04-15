# User Story: Refactor Populate Challenges Function *(Done)

**ID:** 19
**Type:** Feature (Data)
**Estimate:** 1 SP

**As a** Developer,
**I want** to refactor the `populateChallenges` Cloud Function to use the provided list of challenges/songs, look up details via Deezer API, and store the structured data in Firestore,
**So that** the challenges and their associated predefined songs are accurately populated based on the curated list.

**Acceptance Criteria:**

*   The `populateChallenges` Cloud Function (`functions/src/config/config.handlers.ts`) is modified.
*   The function uses the specific list of challenges and song titles/artists provided by the user as its source data.
*   For each song in the list, the function calls the Deezer API (or the `musicService`) to search for the track and retrieve its `trackId`, `title`, `artist`, and `previewUrl`.
*   Appropriate error handling is implemented for Deezer API calls (e.g., song not found, API errors).
*   The function creates/updates challenge documents in the `/challenges` Firestore collection.
*   Each challenge document includes the challenge text and a `predefinedSongs` array containing the structured data (`trackId`, `title`, `artist`, `previewUrl`) for the successfully looked-up songs associated with that challenge.
*   The function handles potential duplicates or variations in song/artist names during the lookup process gracefully.
*   Logging is added to track the progress and any errors during the population process.

**Notes:**

*   Implements the user request to use the specific curated list of challenges and songs.
*   Replaces the previous logic of fetching songs based *only* on challenge text.
*   The trigger mechanism (Story #12) will use this refactored function.