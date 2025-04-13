# Implementation Plan: Game Phases UI/UX Enhancements

This document outlines the steps required to fully implement the functionality for the updated game phase components based on recent UI/UX refinements.

---

## Phase: Challenge Announcement (`ChallengeAnnouncementPhase.tsx`)

**Target Component:** `src/components/game-phases/ChallengeAnnouncementPhase/ChallengeAnnouncementPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component)

1.  **Prop Passing:**
    *   Pass the following props to `<ChallengeAnnouncementPhase>`:
        *   `isHost: boolean`: Determine if the current logged-in user's ID matches the `roundHostPlayerId` from the round data.
        *   `predefinedChallenges: string[]`: Provide a list of predefined challenge strings. (See Backend section).
        *   `isSettingChallenge: boolean`: State variable indicating if the challenge setting request is in progress.
        *   `onSetChallenge: (challenge: string) => void`: Callback function to handle the challenge setting logic.
        *   `challenge: string | null`: The current challenge, or null if not set.
        *   `roundHostPlayerId: string | null`
        *   `playersData: PlayerInfo[] | null`
        *   `isStartingSelection: boolean`
        *   `startSelectionError: string | null`
        *   `onStartSelectionPhase: () => void`

2.  **State Management:**
    *   Introduce `isSettingChallenge` state (default: `false`).

3.  **`onSetChallenge` Callback Function:**
    *   Implement this function:
        *   Set `isSettingChallenge` to `true`.
        *   Call backend function `setChallenge` (via `firebaseApi.ts`) with `gameId`, `roundId`, `challenge`.
        *   Handle promise: On success, Firestore listener updates UI. On error, show feedback.
        *   Set `isSettingChallenge` to `false`.

4.  **Fetching Predefined Challenges:**
    *   Determine source (static list or Firestore). Fetch/provide via `predefinedChallenges` prop.

5.  **Conditional Logic for "Start Selection":**
    *   Ensure `onStartSelectionPhase` is only enabled/called after `challenge` is set in Firestore data.

### Backend Implementation (Firebase Functions)

1.  **`setChallenge` Cloud Function:**
    *   Create HTTPS Callable Function `setChallenge`.
    *   Inputs: `gameId: string`, `roundId: string`, `challenge: string`.
    *   Auth: Verify caller is `roundHostPlayerId`.
    *   Validation: Check `challenge` non-empty, length limits, ensure challenge not already set for the round.
    *   Action: Update Firestore round document (`games/{gameId}/rounds/{roundId}`) setting the `challenge` field.
    *   Return: Success/error status.

2.  **Source for Predefined Challenges (if using Firestore):**
    *   Define storage method (Remote Config, dedicated collection `challenges`, etc.).
    *   Set appropriate Firestore read rules if needed.

### Testing Considerations

*   Host view interactions (input, select, random, set button states).
*   Non-host waiting view.
*   UI transition on challenge set.
*   Backend error handling.
*   Authorization checks.

---

## Phase: Song Selection (`SelectionPhase.tsx`)

**Target Component:** `src/components/game-phases/SelectionPhase/SelectionPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component)

1.  **Search Debouncing:**
    *   Implement debounce logic for the Spotify search input.
    *   Use a library like `use-debounce` or a custom hook.
    *   The `onSearchChange` prop in the component handles the raw input change for display.
    *   The parent component uses the debounced value to trigger the actual API search call (e.g., `searchSpotifyTracks` in `firebaseApi.ts`).
    *   Manage `isSearching`, `searchResults`, and `searchError` state in the parent based on the debounced API call lifecycle.
2.  **Prop Passing:**
    *   Pass necessary props: `challenge`, `searchQuery` (raw value), `searchResults`, `selectedTrack`, `isSearching`, `searchError`, `isSubmittingNomination`, `nominationError`, `onSearchChange`, `onSelectTrack`, `onSongSubmit`.
3.  **State Management:**
    *   Manage `selectedTrack` state.
    *   Manage `isSubmittingNomination` state.
    *   Manage `nominationError` state.
4.  **`onSongSubmit` Callback:**
    *   Implement this function:
        *   Set `isSubmittingNomination` to `true`.
        *   Call backend function `submitNomination` (via `firebaseApi.ts`) with `gameId`, `roundId`, `selectedTrack.uri` (or relevant track data).
        *   Handle promise: On success, clear selection/show feedback. On error, set `nominationError`.
        *   Set `isSubmittingNomination` to `false`.

### Backend Implementation (Firebase Functions)

1.  **`searchSpotifyTracks` Cloud Function (Assumed Existing):**
    *   Ensure this function efficiently handles search queries. Consider caching if applicable.
2.  **`submitNomination` Cloud Function:**
    *   Create HTTPS Callable Function `submitNomination`.
    *   Inputs: `gameId: string`, `roundId: string`, `trackUri: string`, (potentially `trackName`, `trackArtist` for convenience).
    *   Auth: Verify caller is a participant in the game.
    *   Validation: Check if the round is in the 'SELECTION' phase, if the player hasn't already submitted for this round.
    *   Action: Update Firestore round document (`games/{gameId}/rounds/{roundId}`), adding the player's submission to a `playerSongs` map (e.g., `playerSongs: { [playerId]: { name: '...', artist: '...', uri: '...' } }`).
    *   Return: Success/error status.

### Testing Considerations

*   Search input debouncing behavior.
*   Results display in grid, including empty/error/loading states.
*   Scrolling of results grid.
*   Track selection and confirmation display.
*   Hiding search elements after selection.
*   Submission button states (disabled, loading).
*   Error message display (search and nomination).

---

## Phase: Ranking (`RankingPhase.tsx`)

**Target Component:** `src/components/game-phases/RankingPhase/RankingPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component)

1.  **Prop Passing:**
    *   Pass props: `playerId`, `roundData` (containing `playerSongs`), `isSubmittingRanking`, `hasSubmittedRanking`, `rankingError`, `onRankingSubmit`.
2.  **State Management:**
    *   Manage `isSubmittingRanking` state.
    *   Manage `hasSubmittedRanking` state (could be derived from Firestore data).
    *   Manage `rankingError` state.
3.  **`onRankingSubmit` Callback:**
    *   Implement this function:
        *   Set `isSubmittingRanking` to `true`.
        *   Call backend function `submitRankings` (via `firebaseApi.ts`) with `gameId`, `roundId`, `rankedPlayerIds` (array of player IDs in ranked order).
        *   Handle promise: On success, update `hasSubmittedRanking`. On error, set `rankingError`.
        *   Set `isSubmittingRanking` to `false`.

### Backend Implementation (Firebase Functions)

1.  **`submitRankings` Cloud Function:**
    *   Create HTTPS Callable Function `submitRankings`.
    *   Inputs: `gameId: string`, `roundId: string`, `rankedPlayerIds: string[]`.
    *   Auth: Verify caller is a participant in the game.
    *   Validation: Check if the round is in the 'RANKING' phase, if the player hasn't already submitted rankings, if the number of IDs matches the number of other players' songs, if IDs are valid participants who submitted.
    *   Action: Store the player's ranking in the Firestore round document (e.g., in a `playerRankings` map: `playerRankings: { [rankingPlayerId]: ['pId1', 'pId2', ...] }`).
    *   Return: Success/error status.
2.  **Scoring Logic (Potentially separate function or triggered):**
    *   Define how points are awarded based on rank (e.g., 1st = N points, 2nd = M points...).
    *   After all players have submitted rankings, trigger score calculation. This could be a separate function or part of `submitRankings` if it detects the last submission.
    *   Calculate points for each submitted song based on all rankings received.
    *   Determine round winner(s).
    *   Update player total scores in the main game document (`games/{gameId}`).
    *   Store detailed round results (points per song, winner) in the round document (`games/{gameId}/rounds/{roundId}`) for display in `RoundFinishedPhase`.
    *   Update game state to transition to `SCORING` or `ROUND_FINISHED`.

### Testing Considerations

*   Drag-and-drop functionality (mouse, keyboard).
*   Correct display of rank numbers.
*   Separate display of the user's own song.
*   Info popover functionality.
*   Submission button states.
*   Error message display.
*   Handling ties in backend scoring logic.

---

## Phase: Scoring (`ScoringPhase.tsx`)

**Target Component:** `src/components/game-phases/ScoringPhase/ScoringPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component)

1.  **Purpose:** This component acts as a brief loading/transition screen while backend scoring calculations complete.
2.  **Prop Passing:** Pass `currentRound`.
3.  **Transition Logic:** The parent component should monitor the game state in Firestore. When the state changes from `SCORING` to `ROUND_FINISHED` (indicating scores are calculated and stored), the parent should switch rendering from `ScoringPhase` to `RoundFinishedPhase`.

### Backend Implementation (Firebase Functions)

1.  **Score Calculation:** As detailed in the `RankingPhase` backend section, logic needs to exist to calculate scores and update the round/game documents.
2.  **State Transition:** Ensure the game state is updated in Firestore (e.g., `gameState: 'ROUND_FINISHED'`) once scoring is complete.

### Testing Considerations

*   Ensure the loading spinner displays correctly.
*   Verify smooth transition to the next phase (`RoundFinishedPhase`) once backend processing is done.

---

## Phase: Round Finished (`RoundFinishedPhase.tsx`)

**Target Component:** `src/components/game-phases/RoundFinishedPhase/RoundFinishedPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component)

1.  **Data Fetching/Preparation:**
    *   Fetch or derive the necessary data from the completed round document in Firestore.
    *   Prepare the `roundResults: SongResult[]` array, including `playerId`, `playerName`, `songName`, `songArtist`, `pointsAwarded`, `isWinner` flag.
    *   Prepare the `roundWinnerData: RoundWinnerData | null` object.
2.  **Prop Passing:**
    *   Pass props: `currentRound`, `roundResults`, `roundWinnerData`, `isStartingNextRound`, `startNextRoundError`, `onStartNextRound`.
3.  **State Management:**
    *   Manage `isStartingNextRound` state.
    *   Manage `startNextRoundError` state.
4.  **`onStartNextRound` Callback:**
    *   Implement this function:
        *   Set `isStartingNextRound` to `true`.
        *   Call backend function `startNextRound` (via `firebaseApi.ts`) with `gameId`.
        *   Handle promise: On error, set `startNextRoundError`. (Success likely triggers Firestore listener for new round data).
        *   Set `isStartingNextRound` to `false`.

### Backend Implementation (Firebase Functions)

1.  **Data Storage:** Ensure the scoring logic stores the detailed `roundResults` and `roundWinnerData` in the round document as described previously.
2.  **`startNextRound` Cloud Function:**
    *   Create HTTPS Callable Function `startNextRound`.
    *   Inputs: `gameId: string`.
    *   Auth: Verify caller is the game host (or handle appropriately if anyone can trigger).
    *   Validation: Check if the game is in the `ROUND_FINISHED` state. Check if it's the *actual* last round based on game settings.
    *   Action:
        *   Increment `currentRound` number in the main game document.
        *   Select the next round host (e.g., rotate through players).
        *   Create a new round document (`games/{gameId}/rounds/{newRoundId}`) with initial state (e.g., `phase: 'CHALLENGE_ANNOUNCEMENT'`, `hostId: ...`).
        *   Update the main game document's `currentRoundId` and `gameState` to `CHALLENGE_ANNOUNCEMENT`.
    *   Return: Success/error status.

### Testing Considerations

*   Correct display of winner announcement (single, tie).
*   Correct display and sorting of song results list.
*   Highlighting of winner(s) in the list.
*   "Start Next Round" button states.
*   Error message display.
*   Handling of "No Results" scenario.

---

## Phase: Game Finished (`GameFinishedPhase.tsx`)

**Target Component:** `src/components/game-phases/GameFinishedPhase/GameFinishedPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component)

1.  **Data Fetching:** Fetch final `playersData` including final scores from the main game document.
2.  **Prop Passing:** Pass `playersData` and current `playerId`. Optionally pass `onPlayAgain` callback.
3.  **`onPlayAgain` Callback (Optional):**
    *   Implement if the "Play Again" button is intended to be functional.
    *   Could navigate user, call a backend function to reset/create a new game, etc.

### Backend Implementation (Firebase Functions)

1.  **Final Score Calculation:** Ensure total scores are correctly updated throughout the game.
2.  **Game State:** Ensure the game state transitions to `GAME_FINISHED` appropriately.
3.  **`playAgain` / `createNewGame` Function (Optional):**
    *   If implementing "Play Again", create a function to handle resetting relevant game data or creating a new game instance.

### Testing Considerations

*   Correct display of final winner announcement (single, tie, user winning).
*   Correct display and sorting of the final score list.
*   Highlighting of winner(s) in the list.
*   Visibility/functionality of the "Play Again" button (if implemented).

---

## Phase: Music Playback (`MusicPlaybackPhase.tsx`)

**Target Component:** `src/components/game-phases/MusicPlaybackPhase/MusicPlaybackPhase.tsx`

### Frontend Implementation (`GameView.tsx` or Parent Component / Spotify Context)

1.  **Spotify SDK Integration (Major Task):**
    *   Implement setup and initialization of the Spotify Web Playback SDK.
    *   Handle Spotify User Authentication (OAuth flow, token management). This likely involves backend support (`getSpotifyToken` function).
    *   Manage SDK state: Player readiness (`isPlayerReady`), device ID, current playback state (`playbackState` object including `isPlaying`, `currentTrackUri`, `progressMs`, `durationMs`, `currentTrackDetails`).
    *   Provide SDK interaction functions (`play`, `pause`, `resume`, `next`, `previous`, `seek`, `playUri`) to be passed as props (`onPlayPause`, `onNextTrack`, etc.).
    *   Handle SDK events (player state changes, errors) and update the local `playbackState`.
    *   Fetch full track details (`SpotifyTrack` object) when playback starts for a URI to display art/name/artist.
2.  **Prop Passing:**
    *   Pass all necessary props to `<MusicPlaybackPhase>`: `currentRound`, `submittedSongs`, `playbackState`, `isPlayerReady`, `error`, `onPlayPause`, `onNextTrack`, `onPrevTrack`, `onPlayUri`.
3.  **Data Fetching:** Fetch `submittedSongs` (including URIs) for the current round.

### Backend Implementation (Firebase Functions)

1.  **Spotify Authentication Support:**
    *   Likely need backend functions to handle the Spotify OAuth callback and securely exchange the authorization code for access/refresh tokens.
    *   Function to refresh tokens when needed.
    *   Store tokens securely (e.g., associated with the user's Firebase Auth account in Firestore, with appropriate security rules).
    *   Function (`getSpotifyToken`?) for the frontend to request a valid access token for SDK initialization.

### Testing Considerations

*   SDK initialization states (connecting, ready, error).
*   Playback controls (play, pause, next, prev).
*   Progress bar display and updates.
*   Currently playing track info display.
*   Clicking songs in the submitted list to play them.
*   Handling Spotify Premium requirement / inactive device errors.

---

## Component: Creative Card (`CreativeCard.tsx`)

**Target Component:** `src/components/CreativeCard/CreativeCard.tsx`

### Implementation Notes

1.  **Info Popover Feature:** The component has been updated with optional `infoPopoverContent` and `infoPopoverTitle` props.
2.  **Usage:** Components like `RankingPhase` and `RoundFinishedPhase` now utilize this feature by passing the relevant help text.
3.  **Styling:** Ensure the popover trigger (Info icon button) and content styles are consistent with the overall theme.

### Testing Considerations

*   Verify the info icon appears only when `infoPopoverContent` is provided.
*   Test clicking the icon opens the popover.
*   Verify title and content display correctly within the popover.
*   Check popover positioning and closing behavior.