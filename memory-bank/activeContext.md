# Active Context

  This file tracks the project's current status, including recent changes, current goals, and open questions.

*

## Current Focus
*   [2025-04-15 09:13:26] - Implementing improved QR Code joining functionality using a dedicated `/join?gameId=XYZ` route. See plan in `decisionLog.md`.
*   [2025-04-15 07:33:16] - Addressing backlog items #22 (Music Playback) and #23 (Page Scrolling).
*   [2025-04-13 16:46:00] - Implementing Admin Dashboard feature (view-only, `/admin` route, periodic refresh). See plan in Architect Mode discussion and `decisionLog.md`.
*   [2025-07-04 12:40:55] - Planning implementation of configurable Lobby settings (UI complete, backend/integration needed).
## Recent Changes
*   [2025-04-14 23:40:42] - Fixed "Only Round Host can start ranking phase" bug by correcting argument order in `startRankingPhase` handler call to service.
*   [2025-04-14 23:37:56] - Implemented frontend timer logic in `MusicPlaybackPhase` using `playbackEndTime`, removed automatic start of ranking phase, and passed timer display to `PhaseCard`.
*   [2025-04-14 23:34:23] - Fixed page scrolling issue by changing `#root` CSS from `height: 100vh` / `overflow: hidden` to `min-height: 100vh`.
*   [2025-04-14 23:32:38] - Updated `controlPlaybackService` and handler to support 'play'/'pause' actions for updating `isPlaying` state.
*   [2025-04-14 23:32:18] - Updated `submitSongNominationService` to set `isPlaying: true` when transitioning to listening phase.
*   [2025-04-14 23:31:30] - Updated `MusicPlaybackPhaseProps` to include `playbackEndTime`.
*   [2025-04-14 23:31:02] - Fixed argument order mismatch in `setChallenge` handler call.
*   [2025-04-14 22:56:58] - Enforced non-null `previewUrl` requirement in `PlayerSongSubmission` and `PredefinedSong` types and adjusted related service logic (`submitSongNominationService`, `populateChallenges`).
*   [2025-04-14 23:04:14] - Fixed `Timestamp.now()` error by importing `Timestamp` directly from `firebase-admin/firestore` in `round.service.ts`.
*   [2025-04-14 22:56:58] - Implemented preview URL refresh and `playbackEndTime` calculation in `submitSongNominationService`.
*   [2025-04-13 16:08:52] - Attempted deployment of Cloud Functions, failed due to TS errors (unused `HttpsError` in `challenge.handlers.ts`, unused `PredefinedSong` import in `round.service.ts`).
*   [2025-04-13 10:15:28] - Completed frontend logic connection for Predefined Songs: Created `getChallengeDetailsAPI`, updated `useRoundManagement` to fetch songs, updated `GameView` to pass songs, updated `useSongNomination` and `firebaseApi` to handle new submission payload. Updated Memory Bank.
*   [2025-04-13 10:02:27] - Implemented UI structure changes in `SelectionPhase.tsx` for Predefined Songs feature (Tabs, Suggestions list, Search area integration, Change Selection button). Updated Memory Bank.
*   [2025-04-13 09:57:53] - Completed backend implementation for Predefined Songs feature: Modified `populateChallenges` Cloud Function, updated round/challenge types and DAL, modified `submitSongNominationService` to handle new input and assemble final song pool. Updated Memory Bank.
*   [2025-04-13 08:08:42] - Updated Memory Bank (decisionLog, productContext, progress, activeContext) to reflect planning for the Predefined Songs feature.
*   [2025-12-04 10:49:00] - Applied temporary `playerId`-based authorization fix consistently across relevant Cloud Function handlers (`startGame`, `startRankingPhase`, `controlPlayback`) and services. (See decisionLog.md)
*   [2025-11-04 17:35:00] - Implemented consistent loading indicators using intermediate Firestore statuses ('transitioning_...') during phase transitions (backend services & GameView.tsx). (See decisionLog.md)
*   [2025-09-04 13:33:38] - Fixed infinite loop caused by invalid session data (`localStorage` gameId pointing to non-existent game) by adding navigation logic in `App.tsx` and refining state sync in `GamePage.tsx`. (See decisionLog.md)
*   [2025-10-04 15:03:00] - Applied consistent width constraints (`md:min-w-[800px] md:max-w-4xl`) to `GameView.tsx` container and added Storybook decorator for consistent phase component rendering. (See decisionLog.md)
*   [2025-09-04 14:01:00] - Decided to use `playerId` from request data for Cloud Function authorization checks temporarily, deferring Firebase Auth implementation. (See decisionLog.md)
*   [2025-09-04 13:17:00] - Completed refactoring of `functions/src` into a modular architecture, separating concerns by domain (game, player, round, music, scoring, etc.).
*   [2025-04-06 23:18:10] - Implemented Challenge Announcement phase (frontend/backend, Firestore challenges).
*   [2025-04-06 23:18:10] - Implemented dedicated Music Playback phase (backend state transitions, frontend component using HTML audio, host controls, sync logic).
*   [2025-04-06 23:18:10] - Created `populateChallenges` utility function and `generate-mocks` script.
*   [2025-04-06 23:18:10] - Debugged and fixed various backend build errors (unused vars, tsconfig issues, syntax errors).
*   [2025-04-06 23:18:10] - Updated `generate-mocks` script to include API market parameter and web scraping fallback for Spotify previews (encountered `ERR_MODULE_NOT_FOUND`).
*   [2025-07-04 00:10:36] - Refactored application (backend, frontend, tests, mocks) to use generic Music Provider interface (implemented with Deezer), removing Spotify integration and OAuth flow.
*   [2025-07-04 12:40:55] - Completed UI implementation for Lobby settings (Tabs, Controls, Styling, Storybook).
*   [2025-05-04 14:16:24] - Initialized Storybook, configured global styles (`.storybook/preview.ts`), and created stories for `CreativeButton`, `CreativeCard`, `CreativeInput`, `CreativeTabs` in `src/components/`. Addressed minor typos and import issues during story creation.
*   [2025-04-05 13:15:00] - Refactored `Onboarding.tsx` and `GameView.tsx` to use consistent "creative" style (handwritten font, custom borders/shadows, wrapper components). Added dynamic background/text effects to Onboarding. Addressed UI issues (button readability, scrollbars).
*   [2025-04-04 12:57:00] - Completed implementation of "Start Next Round" Functionality (backend service, frontend handler/UI) as per `docs/plan-start-next-round.md`.
*   [2025-04-04 12:48:00] - Completed implementation of Automatic Score Calculation (backend trigger refactored, DAL/service updates) as per `docs/plan-auto-scoring.md`.
*   [2025-04-04 12:31:00] - Completed implementation of Ranking Submission UI Feedback (loading/submitted state) in `GameView.tsx` as per `docs/plan-ranking-feedback.md`.
*   [2025-04-04 11:50:00] - Addressed Song Nomination Flow: Confirmed manual text entry is acceptable for now; backend verified. Spotify integration deferred. (See `docs/plan-song-nomination.md`).
*   [2025-04-04 11:48:00] - Completed implementation of Session Restoration Error Handling (`GameContext.tsx`) as per `docs/plan-session-restoration.md`.
*   [2025-04-04 11:47:00] - Completed interactive playthrough (Round 1) and created implementation plans for identified issues (see `docs/`).
*   [2025-04-03 14:38:00] - Completed implementation of the standardized "Challenge Announcement" phase (`roundX_announcing` status) according to plan. (See decisionLog.md)
*   [2025-04-03 13:13:13] - Fixed session persistence bug (UI join/create not setting localStorage) identified by `TC-SETUP-06`. Verified fix with restructured E2E test. (See decisionLog.md)
*   [2025-04-03 12:31:00] - Implemented automatic session restoration logic (`GameContext` reads localStorage, `App.tsx` navigates on reload). Resolved related E2E test failure (`TC-SETUP-05`). (See decisionLog.md)

*   [2025-04-02 22:05:30] - Completed refactor of Onboarding component using shadcn Tabs and react-hook-form. (See decisionLog.md)
*   [2025-04-02 16:39:00] - Completed refactor of test utilities (`src/test-utils.tsx`) and standardized usage. (See decisionLog.md)
*   [2025-04-01 23:48:00] - Completed refactor to remove Discussion Phase from game loop. Verified via E2E tests.
*   [2025-04-01 23:17:29] - Clarified and documented round scoring logic, duplicate song penalties, and Joker/bonus point interaction. (See decisionLog.md)
*   [2025-04-01 20:18:00] - Stabilized Playwright E2E tests by fixing backend runtime errors and adjusting test logic. 8/10 tests passing.
*   [2025-04-01 15:44:00] - Implemented structured logging strategy (frontend/backend) with Trace IDs. (See LOGGING.md)
*   [2025-04-01 12:20:04] - Migrated E2E testing framework from Cypress to Playwright. (See decisionLog.md)
*   [2025-03-31] - Completed initial setup (Firebase, Vitest, Biome, Shadcn UI, CI workflow) and implemented core game flow logic (create/join/start game, nomination, ranking, basic scoring/round progression functions).
*   [2025-03-30] - Initialized project Memory Bank and reviewed project brief/implementation plan.

## Open Questions/Issues

*   [2025-04-02 00:00:21] - **Investigate:** Persistent Playwright E2E test failures (`tests/gameplay_round.spec.ts`) related to potential timeouts, unreliable input clearing, or scoring status updates require investigation. (Note: Previous Spotify-related test issues are resolved/obsolete due to Deezer refactor).
*   [2025-09-04 14:02:00] - **Security TODO:** Implement proper Firebase Authentication (e.g., Anonymous Auth) to replace the temporary `playerId`-based authorization in Cloud Functions before production deployment.
*   [2025-09-04 13:15:00] - **Documentation Note:** `docs/implementation-plan-game-phases.md` contains outdated information regarding Spotify SDK integration in the Music Playback phase section. The project now uses Deezer via a generic interface and HTML audio.

---
*Footnotes:*
*   2025-03-30 22:58:16 - Initial file creation.
*   2025-03-30 23:03:43 - Updated focus and recent changes after initializing Memory Bank and reading project brief.
*   [2025-04-01 14:14:22] - Updated context reflecting completion of Playwright migration and remaining Spotify E2E test issues.
*   [2025-05-04 14:16:24] - Updated context reflecting Storybook initialization.
*   [2025-04-06 23:18:10] - Updated context reflecting Challenge Announcement and Music Playback implementation, utility script creation, and ongoing script execution issues.
*   [2025-07-04 00:10:36] - Updated context reflecting completion of Spotify-to-Deezer refactor using generic interface.