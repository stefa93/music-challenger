# Decision Log

This file records architectural and implementation decisions using a list format.

*

## Decision

*   [2025-03-30 23:16:38] - Use GitHub Actions for Continuous Integration/Continuous Deployment (CI/CD).

## Rationale

*   GitHub Actions is tightly integrated with GitHub, where the repository is likely hosted.
*   It provides a robust platform for automating builds, tests (linting, formatting, unit, integration, E2E), and deployments.
*   It aligns with the CI/CD setup mentioned in Phase 1 of the implementation plan.

## Implementation Details

*   Workflow file (`.github/workflows/ci.yml`) created [2025-03-31].

## Decision

*   [2025-03-31 01:27:00] - Use shadcn/ui for UI components.

## Rationale

*   Provides pre-built, customizable UI components based on Radix UI and Tailwind CSS.
*   Offers a consistent design language and improves development speed.

## Implementation Details

*   Installed and configured [2025-03-31]. Components added as needed.

## Decision

*   [2025-03-31 12:59:24] - Define initial Firestore data models for core game entities.

## Rationale

*   A clear data structure is necessary before implementing backend logic (game initialization, round progression, scoring).
*   This structure supports the key features: game state, player management, rounds, song pools, rankings, and scores.
*   Using subcollections allows for logical grouping and potentially more efficient querying.

## Implementation Details

*   **Games Collection:** `/games/{gameId}`
    *   Fields: `status` (lobby, playing, finished), `createdAt`, `currentRound`, `totalRounds`, `roundHostPlayerId`, `challenge`.
*   **Players Subcollection:** `/games/{gameId}/players/{playerId}`
    *   Fields: `name`, `score`, `hasJoined`, `joinedAt`, `jokerAvailable`.
*   **Rounds Subcollection:** `/games/{gameId}/rounds/{roundNumber}`
    *   Fields: `challenge`, `hostPlayerId`, `status` (selecting, discussing, ranking, scoring, finished), `gameSongs` (array), `playerSongs` (map).
*   **Rankings Subcollection:** `/games/{gameId}/rounds/{roundNumber}/rankings/{playerId}`
    *   Fields: `rankings` (map { songId: rank }), `submittedAt`.
*   **Scores Subcollection:** `/games/{gameId}/rounds/{roundNumber}/scores/{playerId}`
    *   Fields: `roundScore`, `bonusPoints`, `jokerUsed`, `totalScoreForRound`.
*   *Note:* This is an initial design and may evolve as features are implemented.

## Decision

*   [2025-04-01 12:20:04] - Migrate End-to-End (E2E) testing framework from Cypress to Playwright.

## Rationale

*   Playwright offers robust features, potentially better handling of asynchronous operations, and aligns with the desire to explore MCP integration (specifically Playwright MCP) in the future.
*   Current Cypress E2E tests are facing challenges (failures noted in `activeContext.md`). Migration provides an opportunity to rebuild the E2E suite with a different approach.

## Implementation Details

*   Migration completed [2025-04-01]. Included dependency changes, script updates, test translation, and stabilization. Playwright MCP evaluation deferred.

## Decision

*   [2025-04-01 14:22:09] - Modify Spotify login status UI in `src/App.tsx` to fix Playwright E2E tests.

## Rationale

*   The Playwright tests (`tests/spotify_auth.spec.ts`) for Spotify callback handling are failing because the UI logic currently requires both a valid `spotifyAccessToken` AND a `gameId` to display the "Logged in to Spotify!" message.
*   When the user is redirected back from Spotify, the `gameId` state is lost, preventing the success message from showing even if the token is obtained correctly.
*   Decoupling the message display from `gameId` will allow the test to pass by showing the login status immediately after a successful callback, regardless of game context restoration. This also improves the user experience by providing immediate feedback.

## Implementation Details

*   UI logic in `src/App.tsx` modified [2025-04-01] to decouple Spotify login status display from `gameId`. Verified with Playwright tests.

## Decision

*   [2025-04-01 15:44:00] - Implement a structured logging strategy using dedicated libraries and Trace IDs.

## Rationale

*   Current logging (using `console.*` in frontend, none in backend) is insufficient for debugging and monitoring.
*   A structured approach improves log analysis, correlation, and troubleshooting, especially in a distributed system (frontend + Cloud Functions).
*   Aligns with best practices for observability.

## Implementation Details

*   Implemented [2025-04-01] using `firebase-functions/logger` (backend) and `loglevel` (frontend) with Trace IDs. Strategy documented in `LOGGING.md`. Frontend log shipping deferred.

## Decision

*   [2025-04-01 20:19:00] - Import `FieldValue` directly from `firebase-admin/firestore` in DAL files.

## Rationale

*   A runtime error (`Cannot read properties of undefined (reading 'serverTimestamp')`) occurred during E2E tests within the `createGameService` transaction.
*   The error happened despite `FieldValue` being correctly imported and re-exported via `firestoreClient.ts` in the TypeScript source.
*   This suggested a module resolution issue in the compiled JavaScript within the Firebase emulator environment.
*   Importing `FieldValue` directly from the source package (`firebase-admin/firestore`) in the files that use it (`gameData.ts`, `playerData.ts`, `roundData.ts`, `gameService.ts`) ensures it is correctly resolved at runtime.

## Implementation Details

*   Direct `FieldValue` imports added to relevant DAL files [2025-04-01]. Recompiled functions and verified fix with E2E tests.

---

## Decision

*   [2025-04-01 22:17:23] - Remove the "Discussion Phase" from the game loop.

## Rationale

*   Simplifies the game flow by moving directly from song nomination/playback to the ranking phase.
*   Addresses the blocking issue for E2E tests related to ranking/scoring, which were waiting for a state transition (`discussing` -> `ranking`) that will no longer exist.
*   Reflects user preference for a more streamlined round progression.

## Implementation Details

*   Refactoring completed [2025-04-01]. Updated backend service (`playerService.ts`), frontend component (`GameView.tsx`), E2E tests (`gameplay_round.spec.ts`), and `productContext.md`.

---

## Decision

*   [2025-04-01 23:15:52] - Define and clarify round scoring logic, duplicate song handling, and bonus point conditions.

## Rationale

*   The previous scoring implementation in `calculateScoresService` was unclear and led to incorrect test expectations.
*   Clarifying the rules is necessary before refactoring the scoring logic and tests.
*   Introduces handling for duplicate song nominations and links bonus points to Joker usage.

## Implementation Details (Scoring Rules)

*   **Base Score Calculation:** A player's base score for the round is determined by the points awarded to the song *they submitted*.
*   **Point Allocation:**
    *   Calculate rank sums for each submitted song (lower sum is better).
    *   Sort songs based on rank sum (ascending).
    *   Award points: N points for 1st place, N-1 for 2nd, ..., 1 for Nth place (where N is the number of unique songs ranked).
*   **Tie Handling:** If songs tie in rank sum, they share the points for the tied ranks (e.g., if two songs tie for 1st in a 4-song round, they each get (4+3)/2 = 3.5 points; the next song gets 2 points). **Decision [2025-04-01 23:18:48]: Fractional points will be rounded down using `Math.floor()`**.
*   **Duplicate Song Penalty:** If `X` players nominate the *exact same song* (requires identifying songs beyond just the name, e.g., using Spotify ID if available), each of those `X` players receives a penalty of `-(X-1)` points for the round. **Decision [2025-04-01 23:22:09]**. Players should still rank all unique songs presented.
*   **Bonus Points:** The previously defined bonus points (e.g., 5 points for submitting the top-ranked song) are awarded *only if* the submitting player also used their Joker token in that round. The bonus value itself is *not* doubled by the Joker.
*   **Joker Token:** If a player uses their Joker, their *total* round score (calculated from base points + any applicable bonus) is doubled. The `jokerUsed` flag needs to be tracked per player per round.

## Next Steps

*   Refactor `functions/src/services/scoringService.ts` (`calculateScoresService`) to implement these rules.
*   Update E2E tests (`tests/gameplay_round.spec.ts`) with correct score expectations based on the new logic.
*   Update `memory-bank/productContext.md` to reflect clarified scoring/bonus/Joker rules.
*   Decide on handling for fractional points from ties and the specific penalty for duplicate songs.

---
*Footnotes:*
*   2025-03-30 22:58:30 - Initial file creation.
*   2025-03-30 23:16:38 - Added decision to use GitHub Actions for CI/CD.
*   [2025-03-31 01:27:00] - Added decision to use shadcn/ui for UI components.
*   [2025-03-31 12:59:24] - Added initial Firestore data model design.
*   [2025-04-01 12:20:04] - Added decision to migrate E2E testing from Cypress to Playwright.

## Decision

*   [2025-04-02 16:39:00] - Refactor test utilities (`src/test-utils.tsx`) and standardize usage in test files (`src/pages/OnboardingPage.test.tsx`).

## Rationale

*   Reduce test setup boilerplate in individual test files.
*   Improve consistency across tests by using a centralized utility.
*   Centralize common mocking and provider wrapping logic.
*   Make tests easier to write and maintain with mock data factories.

## Implementation Details

*   Refactoring implemented [2025-04-02]. Centralized utilities in `src/test-utils.tsx` and updated usage in `src/pages/OnboardingPage.test.tsx`.

---

## Decision

*   [2025-04-02 22:04:30] - Refactor `src/components/Onboarding.tsx` to use shadcn/ui Tabs and react-hook-form.

## Rationale

*   Improves UI clarity by separating "Create Game" and "Join Game" actions into distinct tabs.
*   Enhances form robustness and user experience through client-side validation using `react-hook-form`.
*   Aligns the component with project conventions (shadcn/ui) and SOLID principles (single responsibility for form handling).
*   Addresses prerequisite for backend `joinGame` function update (accepting `gameId`).

## Implementation Details

*   Refactoring implemented [2025-04-02]. Updated `src/services/firebaseApi.ts` (joinGameService payload), `src/components/Onboarding.tsx` (Tabs, react-hook-form), `src/pages/OnboardingPage.tsx` (single onSubmit handler), and `src/components/Onboarding.test.tsx` (updated tests). Added `tabs.tsx` via shadcn CLI.

---

## Decision

*   [2025-04-03 12:31:00] - Implement automatic session restoration on page load/reload.

## Rationale

*   E2E test `TC-SETUP-05` failed because the application did not automatically restore the user's session from `localStorage` after a page reload, leaving the user on the onboarding screen.
*   This contradicts the requirement in `productContext.md` for session restoration.
*   The fix involves ensuring the application state (`gameId`, `playerId`) is initialized from `localStorage` and that the user is automatically navigated to the correct game page if a session exists.

## Implementation Details

*   Added `useEffect` hook to `src/contexts/GameContext.tsx` to read `gameId` and `playerId` from `localStorage` on initial mount and update the context state [2025-04-03].
*   Added `useEffect` hook to `src/App.tsx` to consume `gameId` and `playerId` from `GameContext` and automatically navigate the user from the root path (`/`) to the game page (`/game/:gameId`) if a session exists [2025-04-03].
*   Verified fix with E2E test `TC-SETUP-05`.

---

## Decision

*   [2025-04-03 13:12:49] - Fix session persistence bug by writing game/player IDs to localStorage.

## Rationale

*   E2E test `TC-SETUP-06` initially failed because joining/creating a game via the UI did not persist the `gameId` and `playerId` to `localStorage`.
*   This caused session loss on page refresh, as the restoration logic in `GameContext` (reading from `localStorage` on mount) found no values.
*   The fix ensures that session details are saved immediately after being set in the context, enabling correct restoration.

## Implementation Details

*   Added a `useEffect` hook to `src/contexts/GameContext.tsx` that listens for changes in the `gameId` and `playerId` state variables and writes their current values to `localStorage` [2025-04-03].
*   Restructured E2E test `TC-SETUP-06` to avoid conflicts with session redirection logic.
*   Verified fix with the passing restructured E2E test `TC-SETUP-06` [2025-04-03].

---

## Decision

*   [2025-04-03 14:23:00] - Standardize the game flow by implementing a dedicated "Challenge Announcement" phase (`roundX_announcing` status) as the entry point for *every* round, including Round 1 after the lobby and all subsequent rounds.

## Rationale

*   The existing implementation implicitly bundled the challenge announcement with the start of the song selection phase.
*   An explicit announcement phase aligns better with the intended gameplay loop described in `productContext.md`.
*   Standardizing this phase for all rounds (including the first) creates a more consistent and understandable game state progression.
*   This requires modifying the backend services that start the game (`startGameService`) and advance rounds (`startNextRoundService`) to set the `_announcing` status, and adding a new service/handler (`startSelectionPhaseService`/`startSelectionPhase`) triggered by the frontend to transition *out* of the announcement phase into song selection.

## Implementation Details

*   Detailed plan saved in `docs/challenge-announcement-plan.md`.
*   Requires backend changes (services, handlers, types) and frontend changes (UI rendering for new state, new handler call).

---
*Footnotes:*
*   2025-03-30 22:58:30 - Initial file creation.
*   2025-03-30 23:16:38 - Added decision to use GitHub Actions for CI/CD.
*   [2025-03-31 01:27:00] - Added decision to use shadcn/ui for UI components.
*   [2025-03-31 12:59:24] - Added initial Firestore data model design.
*   [2025-04-01 12:20:04] - Added decision to migrate E2E testing from Cypress to Playwright.
*   [2025-04-03 13:12:49] - Added decision log entry for localStorage persistence fix.

---

## Decision

*   [2025-04-05 13:15:00] - Adopt a consistent "creative" visual style (handwritten font, specific borders/shadows/hovers) across key UI components (`Onboarding`, `GameView`).

## Rationale

*   Enhance user engagement and provide a distinct visual identity for the application.
*   Ensure visual consistency between different parts of the user interface.

## Implementation Details

*   Added "Patrick Hand" Google Font.
*   Created `tailwind.config.ts` defining `font-handwritten` utility and custom shadows.
*   Refactored `Onboarding.tsx` and `GameView.tsx`.
*   Introduced `TextRotate` and `Floating` components for dynamic effects in `Onboarding.tsx`.

---

## Decision

*   [2025-04-05 13:15:00] - Implement custom styling using wrapper components (`CreativeButton`, `CreativeInput`, `CreativeCard`) rather than directly modifying base `shadcn/ui` components.

## Rationale

*   Maintains the integrity of the base `shadcn/ui` components located in `src/components/ui`.
*   Simplifies future updates of base `shadcn/ui` components via the CLI, as custom styles won't be overwritten.
*   Provides flexibility to use either the creative style (via wrappers) or the default style (via base components) if needed elsewhere.

## Implementation Details

*   Created `CreativeButton.tsx`, `CreativeInput.tsx`, `CreativeCard.tsx` in `src/components/`.
*   Updated `Onboarding.tsx` and `GameView.tsx` to import and use these wrapper components.

---

## Decision

*   [2025-05-04 14:16:35] - Initialize and configure Storybook for component development and documentation.

## Rationale

*   Provides an isolated environment for developing, viewing, and testing UI components (`CreativeButton`, `CreativeCard`, etc.).
*   Facilitates adherence to the `docs/design-style-guide.md` by allowing visual inspection of components with the "Creative Handwritten" style.
*   Improves developer workflow and component discoverability.
*   Supports automated visual regression testing and documentation generation (via installed addons).

## Implementation Details

*   Used `npx storybook@latest init` [2025-05-04].
*   Configured global CSS import (`src/index.css`) in `.storybook/preview.ts` [2025-05-04].
*   Created story files (`*.stories.tsx`) for `CreativeButton`, `CreativeCard`, `CreativeInput`, `CreativeTabs` within `src/components/` [2025-05-04].
*   Installed `@storybook/experimental-addon-test` for testing integration.
---

## Decision

*   [2025-05-04 15:30:00] - Refactor `src/components/GameView/GameView.tsx` to use custom hooks for state management and API interactions.

## Rationale

*   The existing `GameView` component violates the Single Responsibility Principle (SRP) by handling too many concerns (state for search, nomination, ranking, round progression; API calls; conditional rendering; effects).
*   Extracting logic into custom hooks (`useSpotifySearch`, `useSongNomination`, `useRanking`, `useRoundManagement`) improves readability, maintainability, and testability.
*   `GameView` becomes a simpler orchestrator, consuming hooks and passing props to phase-specific components.
*   This approach balances separation of concerns with manageable prop drilling and centralized handling of cross-cutting logic (like state resets on round change).

## Implementation Details

*   Create new custom hooks in `src/hooks/` directory.
*   Refactor `GameView.tsx` to consume these hooks and simplify its rendering logic.
*   Ensure phase components (`src/components/game-phases/*`) correctly receive and use props passed down from `GameView`.
*   Implementation to be handled by Code mode.

---

## Decision

*   [2025-04-06 23:18:10] - Use Firestore `challenges` collection for predefined challenges.

## Rationale

*   Allows challenges to be updated dynamically without frontend redeployment.
*   Requested by user during planning.

## Implementation Details

*   Created `/challenges` collection in Firestore (documents contain `text` field).
*   Created `getPredefinedChallenges` backend function (HTTPS Callable) to fetch challenges.
*   Created `getPredefinedChallengesAPI` frontend wrapper.
*   Updated `useRoundManagement` hook to fetch and provide challenges.
*   Created `populateChallenges` utility function to add default challenges.

---

## Decision

*   [2025-04-06 23:18:10] - Implement Music Playback using Spotify Web API `preview_url` and HTML `<audio>` element, not Web Playback SDK or iframe embeds.

## Rationale

*   User requirement for 30-second previews to maintain game speed.
*   User requirement for custom UI controls.
*   Avoids complexity and Premium requirement of Web Playback SDK.
*   Avoids UI limitations of iframe embeds.
*   Simpler authentication (Client Credentials likely sufficient for API calls) compared to SDK's user OAuth.

## Implementation Details

*   Backend `searchSpotifyTracksService` confirmed to return `preview_url`.
*   Frontend `PlayerSongSubmission` type updated to include `preview_url`.
*   Frontend `SelectionPhase` updated to disable selection of tracks without `preview_url` and explain the limitation.
*   Frontend `MusicPlaybackPhase` component created using HTML `<audio>` element and custom controls.

---

## Decision

*   [2025-04-06 23:18:10] - Introduce dedicated `listening` game phase between song selection and ranking.

## Rationale

*   User requirement for a shared listening experience before ranking.
*   Allows host to control synchronized playback for all players.

## Implementation Details

*   Added `listening` to `RoundStatus` and `_listening` to `GameStatus` types (backend & frontend).
*   Modified `submitSongNominationService` to transition to `listening` state upon last submission.
*   Added `currentPlayingTrackIndex` and `isPlaying` fields to `RoundDocument` type for synchronization.
*   Created `controlPlaybackService` and `controlPlayback` handler for host actions (play/pause/next/prev).
*   Created `startRankingPhaseService` and `startRankingPhase` handler for host to transition from `listening` to `ranking`.
*   Created corresponding frontend API wrappers (`controlPlaybackAPI`, `startRankingPhaseAPI`).
*   Updated `MusicPlaybackPhase` component to use synchronized state and host controls.
*   Integrated `MusicPlaybackPhase` into `GameView` rendering logic.

---

## Decision

*   [2025-06-04 23:33:46] - Use both Deezer track (`/track/{id}`) and search (`/search`) endpoints in `scripts/generate-storybook-mocks.ts`.

## Rationale

*   Mirrors the original script's logic which used Spotify's track endpoint for direct lookups and search as a fallback for missing preview URLs.
*   Using the dedicated track endpoint is generally more efficient when the specific track ID is known.
*   The search endpoint provides the necessary fallback mechanism.
*   No authentication is required for these public Deezer endpoints, simplifying the implementation compared to Spotify's Client Credentials flow.

## Implementation Details

*   Modify `getTrackDetailsById` in `scripts/generate-storybook-mocks.ts` to use `https://api.deezer.com/track/{id}`.
*   Modify `searchForTrackWithPreview` in `scripts/generate-storybook-mocks.ts` to use `https://api.deezer.com/search`.
*   Remove Spotify authentication logic.
*   Update track IDs and parsing logic for Deezer's response structure.

---

## Decision

*   [2025-06-04 23:46:31] - Refactor application to replace Spotify integration with Deezer using a generic `MusicProviderService` interface and configurable provider selection. Adopt generic naming conventions (e.g., `trackId`, `Track` type).

## Rationale

*   Decouples the application logic from a specific music provider (Spotify/Deezer).
*   Makes it easier to switch between providers in the future via configuration.
*   Promotes cleaner code through a standardized interface and generic data types.
*   Removes complex Spotify OAuth flow, simplifying frontend authentication context.
*   Addresses user request for Deezer integration and improved flexibility.

## Implementation Details

*   Define generic `Track`, `Artist`, `Album` types in `src/types/music.ts` and `functions/src/types/music.ts`.
*   Define `MusicProviderService` interface in backend (`functions/src/services/`).
*   Implement `DeezerMusicService` based on the interface.
*   (Optional) Implement `SpotifyMusicService` based on the interface, retaining necessary auth.
*   Create a factory/central service (`functions/src/services/musicService.ts`) to return the configured provider instance.
*   Refactor backend handlers (`musicHandlers.ts`), services (`roundService.ts`), and types (`player.ts`, `round.ts`) to use the generic interface, types, and `trackId`. Remove Spotify-specific code (auth, types).
*   Refactor frontend context (`AuthContext.tsx` - remove Spotify auth), hooks (`useMusicSearch.ts`, `useSongNomination.ts`), API calls (`firebaseApi.ts`), components (`GameView.tsx`, `SelectionPhase.tsx`), and types (`round.ts`) to use generic interface, types, and `trackId`. Remove Spotify-specific code.
*   Update tests (unit, E2E) and Storybook mocks/stories.

---

## Decision

*   [2025-07-04 12:40:28] - Implement configurable game settings in the Lobby UI.

## Rationale

*   Allows game creators to customize the game experience (rounds, players, time limits, content).
*   Enhances replayability and caters to different player preferences.
*   Requested by user during UI refinement.

## Implementation Details

*   **UI:** Use `CreativeTabs` in `LobbyPhase.tsx` to separate "Players" and "Settings". Settings controls (`Select`, `Switch`) styled creatively. Settings are editable only by the creator.
*   **Settings Added:** Number of Rounds, Max Players, Allow Explicit Songs, Selection Time Limit, Ranking Time Limit.
*   **Default `allowExplicit`:** Set to `true`.
*   **Time Limits:** Timers will disable inputs upon expiration but will **not** automatically transition the game phase. Phase progression remains manual (host action or all players complete).
*   **Backend:** Requires `settings` field in `games/{gameId}` Firestore document and an `updateGameSettings` Cloud Function for validation and persistence.
*   **Frontend:** Requires passing `initialSettings` and `onSettingsChange` props, context updates, and service calls. Integration with game logic (player joining, round end, timers, explicit filtering) is needed.

---

## Decision

*   [2025-09-04 13:28:24] - Fix infinite loop caused by invalid session data during page load.

## Rationale

*   An infinite loop occurred when a user loaded the app with `gameId`/`playerId` in `localStorage` pointing to a game that no longer exists.
*   The loop happened because:
    1.  `App.tsx` navigated to `/game/:invalid_id` based on `localStorage`.
    2.  `GameContext.tsx` detected the invalid game via its listener and correctly set its internal `gameId` state to `null` (which also cleared `localStorage`).
    3.  However, `App.tsx` lacked logic to navigate the user *away* from the `/game/:invalid_id` route when the context `gameId` became `null`.
    4.  `GamePage.tsx`'s `useEffect` hook might have tried to re-initialize the context `gameId` from the invalid URL parameter, potentially conflicting with the context's invalidation.

## Implementation Details

*   Added a new `useEffect` hook to `src/App.tsx` [2025-09-04]. This hook checks if the user is on a `/game/...` route and if the `gameId` in `GameContext` becomes `null`. If both are true, it navigates the user back to the root path (`/`).
*   Modified the existing `useEffect` hook in `src/pages/GamePage.tsx` [2025-09-04]. This hook now only initializes the `gameId` in `GameContext` from the URL parameter (`paramGameId`) if the context `gameId` is initially `null`. This prevents it from overriding the context's invalidation logic.

---

## Decision

*   [2025-09-04 14:01:00] - Temporarily use `playerId` passed in request data for Cloud Function authorization checks instead of implementing Firebase Authentication (`request.auth.uid`).

## Rationale

*   Addresses immediate `PERMISSION_DENIED` error in `setChallenge` caused by hardcoded `DEBUG_BYPASS_USER` without implementing full Firebase Auth at this stage.
*   Allows development to proceed while deferring security implementation.
*   Requires frontend to pass the current user's `playerId` in relevant function calls.
*   **Security Note:** This is a temporary workaround and does not provide robust security. Proper Firebase Authentication should be implemented later to prevent users from impersonating others.

## Implementation Details

*   Modified backend handlers (`round.handlers.ts`, `game.handlers.ts`) to extract `playerId` from `request.data` [2025-09-04].
*   Modified backend services (`round.service.ts`, `game.service.ts`) to accept `callerPlayerId` and perform authorization checks against `roundHostPlayerId` or `creatorPlayerId` [2025-09-04].
*   Updated frontend API wrappers (`firebaseApi.ts`) to include `playerId` in payloads [2025-09-04].
*   Updated frontend components (`GameView.tsx`, `MusicPlaybackPhase.tsx`, etc.) to pass the current `playerId` when calling API functions [2025-09-04].

---

## Decision

*   [2025-04-14 22:56:58] - Refresh song preview URLs when transitioning from selection to listening phase and calculate playback end time based on URL expiration.

## Rationale

*   Deezer preview URLs expire, causing playback failures if the URL fetched during population is used later.
*   Refreshing URLs ensures the most up-to-date preview is available for the listening phase.
*   Extracting the `exp` timestamp from the URL allows setting a defined end time for the listening phase, preventing playback beyond the URL's validity.

## Implementation Details

*   Modified `submitSongNominationService` (`round.service.ts`) [2025-04-14]:
    *   When all players have submitted, iterate through `playerSongs`.
    *   Call `musicProvider.getTrackDetails()` for each song to get fresh details.
    *   Update `previewUrl` in the `playerSongs` map.
    *   Parse `exp` timestamp from each new `previewUrl` using helper function `parseExpirationFromUrl`.
    *   Calculate the minimum `exp` timestamp (`minExpiration`).
    *   Store `minExpiration` (converted to Firestore Timestamp) as `playbackEndTime` in the round document.
    *   Set `isPlaying: true` in the round document to trigger initial playback.
*   Added `playbackEndTime` and `isPlaying` to `RoundUpdateData` type (`round/types.ts`) [2025-04-14].
*   Added `parseExpirationFromUrl` helper function to `round.service.ts` [2025-04-14].

---

## Decision

*   [2025-04-14 22:56:58] - Enforce non-null `previewUrl` for all songs used in playback/ranking.

## Rationale

*   Songs without previews cannot be played and should not be included in the listening or ranking phases.
*   Ensures data integrity and prevents errors related to missing URLs.

## Implementation Details

*   Updated `PlayerSongSubmission` (`round/types.ts`) and `PredefinedSong` (`challenge/types.ts`) types to require `previewUrl: string` [2025-04-14].
*   Updated `populateChallenges` (`config.handlers.ts`) to only add songs with non-null `previewUrl` [Verified 2025-04-14].
*   Updated `submitSongNominationService` (`round.service.ts`) [2025-04-14]:
    *   Throw error if `searchResult` lacks `previewUrl`.
    *   Throw error if selected `predefinedSong` lacks `previewUrl`.
    *   Exclude songs from `updatedPlayerSongs` if preview refresh fails or returns null URL.

---

## Decision

*   [2025-04-14 23:34:23] - Fix page scrolling for long content by modifying `#root` CSS.

## Rationale

*   Pages like the Admin page were not scrollable because the `#root` element had `height: 100vh` and `overflow: hidden`.
*   This prevented the container from expanding beyond the viewport height and hid any overflow.

## Implementation Details

*   Modified `src/App.css` [2025-04-14]:
    *   Changed `height: 100vh` to `min-height: 100vh`.
    *   Removed `overflow: hidden`.

---

## Decision

*   [2025-04-14 23:40:42] - Correct argument order mismatch in `startRankingPhase` handler call.

## Rationale

*   The `startRankingPhase` handler (`round.handlers.ts`) was passing arguments (`gameId`, `playerId`, `traceId`) to `startRankingPhaseService` in the wrong order.
*   The service expected (`gameId`, `traceId`, `callerPlayerId`).
*   This caused the `traceId` to be used as the `callerPlayerId` in the service's authorization check, leading to incorrect "Permission Denied" errors for the actual host.

## Implementation Details

*   Corrected the argument order in the call within `functions/src/round/round.handlers.ts` [2025-04-14].

---

## Decision

*   [2025-04-14 23:37:56] - Implement frontend timer logic in `MusicPlaybackPhase` based on `playbackEndTime` prop, removing automatic start of ranking phase.

## Rationale

*   The listening phase requires a visual timer based on the calculated `playbackEndTime`.
*   User feedback indicated that the ranking phase should start manually via host action, not automatically when the timer ends.
*   Initial assumption that `PhaseCard` handled timer logic was incorrect; custom implementation needed.

## Implementation Details

*   Added `playbackEndTime` prop to `MusicPlaybackPhaseProps` [2025-04-14].
*   Passed `playbackEndTime` from `GameView` to `MusicPlaybackPhase` [2025-04-14].
*   Implemented `useEffect` hook in `MusicPlaybackPhase` to calculate remaining time, update state (`remainingTime`, `isTimeUp`), and manage `setInterval` [2025-04-14].
*   Timer cleanup handled in effect's return function.
*   Removed automatic call to `handleStartRanking` when timer expires.
*   Passed formatted time string to `PhaseCard`'s `timerDisplay` prop.
*   Disabled host playback controls and enabled "Start Ranking Phase" button based on `isTimeUp` state [2025-04-14].

---
---

## Decision

*   [2025-11-04 17:34:00] - Implement intermediate Firestore game statuses (e.g., `transitioning_to_selecting`) during host-triggered phase transitions.

## Rationale

*   The previous implementation only showed loading indicators (e.g., button spinners) locally on the host's client during the delay between a host action (like "Start Next Round") and the Firestore update reflecting the new phase.
*   This resulted in a disjointed experience where only the host saw an immediate indication of activity, while other players saw nothing until the final phase change propagated.
*   Using intermediate statuses ensures that as soon as a host action is initiated, the backend immediately updates the shared game status to a "transitioning\_" state.
*   The frontend (`GameView.tsx`) is updated to recognize these statuses and display a global loading skeleton for *all* players, providing consistent visual feedback and building shared anticipation.

## Implementation Details

*   Modified backend services (`startGameService`, `startSelectionPhaseService`, `startRankingPhaseService`, `startNextRoundService`) in `functions/src/game/game.service.ts` and `functions/src/round/round.service.ts` to perform a two-step status update: first to `transitioning_...`, then to the final phase status after completing the transition logic [2025-11-04].
*   Updated the main loading condition in `src/components/GameView/GameView.tsx` to check for `gameData.status?.startsWith('transitioning_')` and render the main loading skeleton accordingly [2025-11-04].

*   Modify relevant frontend function calls (e.g., `setChallengeAPI`) to include `playerId` in the payload.
*   Modify corresponding backend handlers (`*.handlers.ts`) to extract `playerId` from `request.data`.
*   Modify corresponding backend services (`*.service.ts`) to accept `playerId` instead of `callerUid` for authorization checks.
*   Audit other function handlers for similar hardcoded UIDs or commented-out auth checks and apply the same pattern.

---

## Decision

*   [2025-10-04 15:03:00] - Apply consistent width constraints to the main game phase container in `GameView.tsx` and create a Storybook decorator for consistency.

## Rationale

*   Addresses user feedback about the game area "jumping" in size between different phases due to varying content height/width.
*   Ensures a stable and predictable layout for the core game interaction area.
*   Provides a better user experience by preventing jarring layout shifts.
*   The Storybook decorator ensures individual phase components can be viewed in isolation with the same width constraints applied, aiding development and visual testing.

## Implementation Details

*   Added `md:min-w-[800px] md:max-w-4xl mx-auto` classes to the main container `div` in `src/components/GameView/GameView.tsx`.
*   Created a global Storybook decorator in `.storybook/preview.ts` using `React.createElement` to wrap stories with a `div` having the same width constraint classes.
*   Created `.storybook/tsconfig.json` extending `tsconfig.app.json` and explicitly including `src/vite-env.d.ts` to resolve type errors related to JSX and CSS imports within the Storybook environment.

---

## Decision

*   [2025-04-13 08:07:32] - Implement predefined songs per challenge to ensure a minimum of 5 songs for ranking, regardless of player count. Allow players to select from this predefined list or search as usual.

## Rationale

*   Addresses the issue where ranking is not possible/meaningful with fewer than 5 players/songs.
*   Provides a fallback/alternative for players who don't want to search.
*   Storing predefined songs in Firestore (`/challenges/{challengeId}/predefinedSongs`) avoids repeated API calls during gameplay.
*   A script (`scripts/populate-challenge-songs.ts`) will be created to help populate these lists initially using the Deezer API.

## Implementation Details

*   **Data Model:** Add `predefinedSongs: Array<{ trackId, title, artist, previewUrl }>` to `/challenges` documents.
*   **Script:** Create `scripts/populate-challenge-songs.ts` (Code Mode) to query Deezer based on challenge text and generate song lists for manual Firestore update.
*   **Backend:** Modify nomination service (`player.service.ts`) to accept `trackId` or search data. Modify round preparation logic (`round.service.ts`) to combine player nominations (including selections from predefined) and add *additional* unique predefined songs only if needed to reach the 5-song minimum.
*   **Frontend:** Modify `SelectionPhase.tsx` (UI/UX Mode) to display the predefined list alongside the search option, allowing players to select or search. Update submission logic.
*   **Memory Bank:** Updated by Architect Mode [2025-04-13 08:07:32].

---

## Decision

*   [2025-04-13 09:56:32] - Implement backend logic for predefined songs feature using Cloud Functions.

## Rationale

*   Integrates song population into the existing `populateChallenges` Cloud Function, avoiding local credential issues.
*   Modifies `submitSongNominationService` to handle nominations from both search and predefined lists.
*   Ensures the final song pool (`songsForRanking`) for listening/ranking phases always contains at least 5 unique songs by supplementing player nominations with predefined songs associated with the current challenge.

## Implementation Details

*   Installed `axios` in `functions` directory [2025-04-13 09:49:39].
*   Modified `functions/src/config/config.handlers.ts` (`populateChallenges` function) to fetch songs from Deezer based on challenge text and update challenge documents with `predefinedSongs` array [2025-04-13 09:50:34].
*   Created `functions/src/challenge/types.ts` defining `ChallengeDocument` and `PredefinedSong` interfaces [2025-04-13 09:52:49].
*   Created `functions/src/challenge/challenge.data.ts` with `getChallengeByText` function [2025-04-13 09:53:04].
*   Updated `functions/src/round/types.ts`: Added `SongNominationInput` type, added `songsForRanking` field to `RoundDocument`, made `PlayerSongSubmission.submittedAt` optional [2025-04-13 09:54:50].
*   Modified `functions/src/round/round.service.ts` (`submitSongNominationService`):
    *   Updated input parameter to `SongNominationInput`.
    *   Added logic to fetch predefined song details if `predefinedTrackId` is provided.
    *   Added logic to assemble `songsForRanking` list (combining player nominations and needed predefined songs) when the last player submits.
    *   Resolved type errors related to `FieldValue.serverTimestamp` vs `FirestoreTimestamp` [2025-04-13 09:55:32].
*   Memory Bank: Updated by Code Mode [2025-04-13 09:56:32].

---

## Decision

*   [2025-04-13 16:41:00] - Create a view-only Admin Dashboard within the existing application.

## Rationale

*   Provides administrators/developers with visibility into ongoing game activity and key performance indicators (KPIs).
*   Requested by the user to monitor active games, players, stats, and challenges.
*   View-only access via a specific link (`/admin`) simplifies initial implementation, deferring complex authentication.
*   Periodic data refresh balances the need for up-to-date information with performance considerations.

## Implementation Details

*   **Location:** New route `/admin` within the existing React application.
*   **Access:** Publicly accessible via the direct link (no login required initially). **Security Note:** This is a temporary measure; proper authentication should be added later.
*   **Data:** Fetched periodically (e.g., every 60s) via new HTTPS Callable Cloud Functions (`getAdminDashboardData`, `getAdminChallengeData`).
*   **Features:** Display KPIs, active games list, player stats, view challenges and associated songs (with 30s previews).
*   **Technology:** Frontend: React, TypeScript, Shadcn UI. Backend: Firebase Cloud Functions, Firestore.
*   **Plan:** See Architect Mode discussion on 2025-04-13.

---

## Decision

*   [2025-04-15 10:43:20] - Refactor scoring logic (`calculateScoresService`) to use `trackId` consistently and base points calculation on the total number of songs ranked (`songsForRanking.length`).

## Rationale

*   The previous scoring logic incorrectly used song names as keys and based point calculation (N points for 1st) on the number of unique *player-submitted* songs, not the total number presented for ranking (which includes added predefined songs).
*   This ensures scores accurately reflect ranking within the full set of songs and aligns with the data format used in ranking submission (which uses `trackId`).
*   Duplicate penalty logic (based on `trackIdOccurrences`) was confirmed to be correct.

## Implementation Details

*   Modified `functions/src/scoring/scoring.service.ts` to:
    *   Identify unique songs and occurrences using `trackId`.
    *   Calculate rank sums using `trackId`.
    *   Calculate points per rank using `songsForRanking.length` as the base `N`.
    *   Assign points to `trackPoints` map using `trackId`.
    *   Calculate player base scores by looking up their submitted `trackId` in `trackPoints`.

---

## Decision

*   [2025-04-15 10:43:20] - Fix `submitSongNominationService` to ensure `songsForRanking` contains only unique tracks and correctly handles Firestore transaction read/write order.

## Rationale

*   The initial assembly of the song pool incorrectly included duplicate tracks if multiple players submitted the same song.
*   A Firestore transaction error occurred because the challenge document (needed for predefined songs) was read *after* the player's submission was written.
*   The fix ensures the final list for playback/ranking contains only unique tracks and respects transaction rules.

## Implementation Details

*   Modified `functions/src/round/round.service.ts` (`submitSongNominationService`) to:
    *   Pre-fetch the `challengeDoc` within the transaction *before* writing the player submission, but only if it's potentially the last submission.
    *   Initialize `finalSongPool` using only unique tracks from `refreshedPlayerSongs` before adding unique predefined songs.

---

## Decision

*   [2025-04-15 10:43:20] - Fix `startNextRoundService` to allow host challenge selection in all rounds.

## Rationale

*   The service previously used placeholder text or random selection for challenges in subsequent rounds, contradicting the requirement for the host to always select the challenge.
*   The fix ensures consistency with the Round 1 flow.

## Implementation Details

*   Modified `functions/src/round/round.service.ts` (`startNextRoundService`) to:
    *   Remove logic that automatically selected a challenge.
    *   Set the `challenge` field to `null` in both the game and the new round document updates.

---

## Decision

*   [2025-04-15 10:43:20] - Refactor `RankingPhase.tsx` to use correct data source (`songsForRanking`), submit correct data format, and fix UI bugs.

## Rationale

*   The component was incorrectly using `playerSongs` instead of `songsForRanking` to display the list.
*   It submitted an array of track IDs instead of the required `{ trackId: rank }` object map.
*   Dragging was incorrectly disabled when the timer expired.
*   The `useRanking` hook was redundant and causing validation errors.

## Implementation Details

*   Removed `useRanking` hook usage from `GameView.tsx`.
*   Added local state management (`isSubmittingRanking`, `hasSubmittedRanking`, `rankingError`) to `GameView.tsx`.
*   Passed `submitRankingAPI` and state down to `RankingPhase.tsx`.
*   Modified `RankingPhase.tsx` to:
    *   Use `roundData.songsForRanking` as the source for the sortable list.
    *   Use `trackId` as the key for sortable items.
    *   Construct the correct `{ trackId: rank }` object map in `handleSubmit`.
    *   Remove the condition disabling drag-and-drop when `isTimeUp`.

---

## Decision

*   [2025-04-15 10:43:20] - Fix frontend error in `RoundFinishedPhase.tsx` related to winner data structure.

## Rationale

*   The component expected `winnerNames` in the `roundWinnerData` prop, but the backend provides `winnerPlayerIds`.
*   This caused a runtime error when trying to access `.length` on the undefined `winnerNames`.

## Implementation Details

*   Updated the `RoundWinnerData` interface in `RoundFinishedPhase.tsx` to expect `winnerPlayerIds`.
*   Modified the `getWinnerNames` helper function to use `winnerPlayerIds` and look up corresponding names in the `roundResults` array.

---

## Decision

*   [2025-04-15 09:13:00] - Implement QR Code joining via dedicated `/join` route with `gameId` query parameter.

## Rationale

*   The existing QR code in the Lobby points to the base URL (`window.location.href`), making it difficult for users to join the specific game, especially if they have an existing session in `localStorage`.
*   Using a dedicated route like `/join?gameId=XYZ` is more explicit than adding a query parameter to the root (`/?joinGameId=XYZ`).
*   This clearly signals the intent to join a specific game and avoids potential conflicts with other root path query parameters.

## Implementation Details

*   **QR Code:** Modify `LobbyPhase.tsx` to generate QR codes pointing to `${window.location.origin}/join?gameId={gameId}`.
*   **Routing:** Add a new route `<Route path="/join" element={<JoinPage />} />` in `App.tsx`.
*   **Join Handler:** Create a new component `src/pages/JoinPage.tsx`. This component will:
    *   Parse `gameId` from the URL query string (`location.search`).
    *   If `gameId` is found: Clear `localStorage` (`gameId`, `playerId`), set `gameId` in `GameContext`, set `playerId` to `null` in `GameContext`, and navigate the user to `/`.
    *   If `gameId` is not found, navigate the user to `/`.
*   **Onboarding:** Modify `OnboardingPage.tsx` to check `GameContext` on load. If `gameId` exists but `playerId` is `null`, pass `initialGameId={gameId}` to the `Onboarding` component. Modify `Onboarding.tsx` to use `initialGameId` to pre-fill the Game ID input in the "Join" tab and potentially set it as the default tab.