# Progress

This file tracks the project's progress using a task list format.
2025-03-30 22:58:23 - Log of updates made.

*

## Completed Tasks

*   [2025-03-31 00:40:07] - Phase 1: Foundational Setup & Core Structure
*   [2025-03-31 16:13:13] - Phase 2: Implemented core game flow logic (create/join/start, nomination, ranking, basic scoring/round progression functions, Spotify code exchange).
*   [2025-03-31 01:57:00] - Integrated shadcn/ui components.
*   [2025-04-01 14:14:49] - Phase 3: Migrated E2E Testing from Cypress to Playwright.
*   [2025-04-01 15:44:00] - Implemented structured logging strategy.
*   [2025-04-01 20:18:00] - Stabilized Playwright E2E tests (8/10 passing).
*   [2025-04-01 23:47:43] - Refactored game loop to remove Discussion Phase.
*   [2025-04-02 16:39:00] - Refactor test utilities (`src/test-utils.tsx`) and standardize usage.
*   [2025-04-02 22:05:00] - Refactor Onboarding component (Tabs, react-hook-form).
*   [2025-04-03 12:31:00] - Implemented E2E test `TC-SETUP-05` (Non-creator sees no start button).
*   [2025-04-03 12:31:00] - Implemented automatic session restoration logic (fix for `TC-SETUP-05` failure).
*   [2025-04-03 13:13:34] - Implemented E2E test `TC-SETUP-06` (User stays in lobby after refresh) and fixed related session persistence bug.
*   [2025-04-03 14:38:00] - Implemented standardized "Challenge Announcement" phase (`roundX_announcing` status) according to `docs/challenge-announcement-plan.md`.
*   [2025-04-04 11:47:00] - Completed interactive playthrough (Round 1) and identified key issues.
*   [2025-04-04 11:57:30] - Implemented Ranking Submission UI Feedback (see `docs/plan-ranking-feedback.md`)
*   [2025-04-04 12:15:58] - Implemented Automatic Score Calculation (see `docs/plan-auto-scoring.md`)
*   [2025-04-04 11:48:00] - Implemented Session Restoration Error Handling (see `docs/plan-session-restoration.md`)
*   [2025-04-04 11:50:00] - Addressed Song Nomination Flow / Spotify Requirement (see `docs/plan-song-nomination.md`)
*   [2025-04-04 12:57:00] - Implemented "Start Next Round" Functionality (see `docs/plan-start-next-round.md`)
*   [2025-04-05 13:15:00] - Refactored `Onboarding.tsx` and `GameView.tsx` to use consistent "creative" style (handwritten font, custom borders/shadows, wrapper components). Added dynamic background/text effects to Onboarding.
*   [2025-05-04 14:16:09] - Initialized Storybook, configured global styles, and created stories for `CreativeButton`, `CreativeCard`, `CreativeInput`, and `CreativeTabs`.
*   [2025-05-04 15:33:30] - Refactored GameView.tsx to use custom hooks (useSpotifySearch, useSongNomination, useRanking, useRoundManagement).
*   [2025-04-06 23:18:10] - Implemented Challenge Announcement phase (frontend/backend, Firestore challenges).
*   [2025-04-06 23:18:10] - Implemented dedicated Music Playback phase (backend state transitions, frontend component using HTML audio, host controls, sync logic).
*   [2025-04-06 23:18:10] - Created `populateChallenges` utility function and `generate-mocks` script (with scraping fallback).
*   [2025-04-06 23:18:10] - Debugged and fixed various backend build errors and script execution issues.
*   [2025-07-04 00:11:13] - Completed application-wide refactor (backend, frontend, tests, mocks) to replace Spotify with Deezer using a generic Music Provider interface.
*   [2025-11-04 17:35:00] - Implemented consistent loading indicators using intermediate Firestore statuses.
*   [2025-04-14 23:40:42] - Fixed "Only Round Host can start ranking phase" bug (incorrect argument order in handler).
*   [2025-04-14 23:37:56] - Implemented playback timer and fixed playback start logic in `MusicPlaybackPhase`. Removed auto-start ranking.
*   [2025-04-14 23:34:23] - Fixed page scrolling issue for long content (`#root` CSS).
*   [2025-04-14 23:04:14] - Fixed `Timestamp.now()` error by importing `Timestamp` directly.
*   [2025-04-14 22:56:58] - Implemented preview URL refresh and playback end time calculation in `submitSongNominationService`.
*   [2025-04-14 22:56:58] - Enforced non-null `previewUrl` requirement in types and logic.
*   [2025-04-15 10:43:56] - Implemented QR Code/Join Link fix (`/join` route, URL param handling, onboarding pre-fill).
*   [2025-04-15 10:43:56] - Fixed backend logic to ensure minimum 5 unique songs for ranking (`songsForRanking`).
*   [2025-04-15 10:43:56] - Fixed backend scoring logic (`calculateScoresService`) to use `trackId` and base points on total ranked songs.
*   [2025-04-15 10:43:56] - Fixed frontend `RankingPhase` to use `songsForRanking`, submit correct data format, and handle UI state/bugs.
*   [2025-04-15 10:43:56] - Fixed frontend `RoundFinishedPhase` error related to winner data structure.
*   [2025-04-15 10:43:56] - Fixed backend `startNextRoundService` to ensure host selects challenge in all rounds.
## Current Tasks

*   [2025-07-04 12:41:05] - Implement Lobby Settings - Backend:
    *   Update Firestore schema (`games/{gameId}`) to include `settings` field with defaults (explicit=true).
    *   Create `updateGameSettings` Cloud Function (validation, auth check, Firestore update).
    *   Add unit tests for the Cloud Function.
*   [2025-07-04 12:41:05] - Implement Lobby Settings - Frontend Integration:
    *   Implement `handleSettingsChange` in `GameView.tsx` to call `updateGameSettingsService`.
    *   Create `updateGameSettingsService` in `firebaseApi.ts`.
    *   Ensure `GameContext` fetches/updates settings.
    *   Update `GameView.test.tsx` to mock/verify `onSettingsChange`.
*   [2025-07-04 12:41:05] - Implement Lobby Settings - Game Logic Integration:
    *   Update player joining logic for `maxPlayers`.
    *   Update game end logic for `rounds`.
    *   Implement timer UI/disabling logic (no auto-transition) in Selection/Ranking phases based on `selectionTimeLimit`/`rankingTimeLimit`.
    *   Implement explicit song filtering based on `allowExplicit`.
    *   Add relevant unit/E2E tests for game logic changes.
*   [2025-04-13 09:57:11] - Implement Predefined Songs Feature - Cloud Function & Backend Logic:
    *   **DONE:** Install `axios` in `functions` directory.
    *   **DONE:** Modify `populateChallenges` Cloud Function (`config.handlers.ts`) to fetch songs from Deezer and update challenge docs with `predefinedSongs`.
    *   **DONE:** Create challenge types (`challenge/types.ts`) and data access (`challenge/challenge.data.ts`).
    *   **DONE:** Update round types (`round/types.ts`) for `SongNominationInput` and `songsForRanking`.
    *   **DONE:** Modify `submitSongNominationService` (`round.service.ts`) to handle new input type and assemble `songsForRanking` list (min 5 songs).
*   [2025-04-13 10:14:50] - Implement Predefined Songs Feature - Frontend:
    *   **DONE (UI/UX):** Modify `SelectionPhase.tsx` UI structure: Added `predefinedSongs` prop, implemented Tabs for "Suggestions" / "Search", added "Change Selection" button. Fixed syntax errors.
    *   **DONE (Code):** Create `getChallengeDetailsHandler` Cloud Function & `getChallengeDetailsAPI` frontend wrapper.
    *   **DONE (Code):** Modify `useRoundManagement` hook to fetch `currentChallengeSongs` based on `gameData.challenge`.
    *   **DONE (Code):** Update `GameView.tsx` to pass `currentChallengeSongs` to `SelectionPhase`.
    *   **DONE (Code):** Update `useSongNomination` hook to handle selection source and construct `SongNominationInputPayload`.
    *   **DONE (Code):** Update `submitSongNominationAPI` to accept `SongNominationInputPayload`.
    *   **TODO:** Test UI flow and accessibility.
*   [2025-04-13 09:57:11] - Implement Predefined Songs Feature - Deployment & Triggering:
    *   Deploy updated Cloud Functions (`firebase deploy --only functions`).
    *   Trigger `populateChallenges` function once.
*   [2025-04-13 09:57:11] - Implement Predefined Songs Feature - Cleanup:
    *   Remove unused script `scripts/populate-challenge-songs.ts`.
    *   Revert temporary changes in `tsconfig.node.json`.
    *   [2025-04-13 16:45:00] - Implement Admin Dashboard - Backend:
        *   Create `functions/src/admin/` directory.
        *   Implement `getAdminDashboardData` Cloud Function (HTTPS Callable).
        *   Implement `getAdminChallengeData` Cloud Function (HTTPS Callable).
        *   Add unit tests for new functions.
    *   [2025-04-13 16:45:00] - Implement Admin Dashboard - Frontend Structure & Routing:
        *   Define `/admin` route.
        *   Create `src/pages/AdminPage.tsx`.
        *   Set up basic layout using Shadcn components.
    *   [2025-04-13 16:45:00] - Implement Admin Dashboard - Frontend Data Fetching & Display:
        *   Implement API calls to backend functions in `firebaseApi.ts`.
        *   Fetch data periodically in `AdminPage.tsx`.
        *   Display KPIs, Active Games, Challenges/Songs using Shadcn components.
        *   Integrate 30s song preview playback.
    *   [2025-04-13 16:45:00] - Implement Admin Dashboard - UI/UX Refinement:
        *   Refine layout and data presentation (UI/UX Mode).
        *   Ensure consistency with `design-style-guide.md`.
## Next Steps

*   Implement Lobby Settings functionality (Backend, Frontend Integration, Game Logic Integration).
*   Perform verification testing for the Deezer refactor and Lobby Settings.
*   Address remaining backlog items (e.g., #22 - Playback synchronization details).
*   Review score calculation logic for edge cases/alternative models (per user request).
*   Investigate Playwright E2E test failures (`tests/gameplay_round.spec.ts`).
*   Implement proper Firebase Authentication (Security TODO).