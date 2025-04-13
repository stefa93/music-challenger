# Dance Floor Ranking - Implementation Plan (Revised)

This plan outlines the development phases for the "Dance Floor Ranking" game, incorporating continuous testing and using Biome for linting/formatting.

**Core Principles:**

*   **Continuous Testing:** Testing (unit, integration, E2E) and Quality Assurance (QA) are integral parts of each development phase, not a separate final step.
*   **Tooling:** Biome will be used for code linting and formatting. Vitest for unit/integration tests, Cypress for E2E tests.

**Phases:**

1.  **Phase 1: Foundational Setup & Core Structure:**
    *   Finalize requirements based on `projectBrief.md`.
    *   Set up Firebase project (Firestore, Hosting, Functions).
    *   Configure development tools: **Biome** (linting/formatting), Vitest (unit/integration testing), Cypress (E2E testing).
    *   Initialize Git repository and establish branching strategy (e.g., Gitflow).
    *   Set up CI/CD pipeline (e.g., GitHub Actions) for automated linting, formatting, testing, and deployment.
    *   Register and configure Spotify Developer account/API credentials.
    *   **Testing:** Set up initial test configurations and write basic tests for project setup validation. Ensure Biome checks and tests run in CI.

2.  **Phase 2: Core Feature Development (Onboarding & Game Setup):**
    *   Develop frontend user flows: Player name entry, create/join game sessions.
    *   Implement backend logic (Cloud Functions) for game initialization and player management.
    *   Design and implement Firestore data models (Players, Games, Rounds, Songs, Scores).
    *   Integrate basic real-time data synchronization using Firestore listeners.
    *   Implement Spotify OAuth flow (if required).
    *   **Testing:** Write unit and integration tests (Vitest) for all new frontend/backend components and functions. Develop initial E2E tests (Cypress) for the onboarding flow. Ensure CI pipeline runs tests successfully. Perform QA checks on onboarding.

3.  **Phase 3: Gameplay Mechanics Implementation:**
    *   Implement frontend components for: Challenge display, song selection (game-provided & player-contributed via Spotify search), voting/ranking interface, scoreboard.
    *   Develop backend logic for: Round progression, challenge management, song submission/validation (using Spotify API), Joker usage, scoring calculation (including bonuses), tie-breakers.
    *   Integrate Spotify API for fetching song details and potentially playback snippets (using Web Playback SDK).
    *   **Completed [2025-04-04]:** Implemented UI feedback (loading/submitted states, error display) for the ranking submission process.
    *   Ensure real-time updates for all gameplay events.
    *   **Testing:** Expand unit and integration tests to cover all gameplay logic. Develop comprehensive E2E tests simulating full game rounds. Perform QA checks on gameplay flow and rules implementation. Ensure tests pass in CI.

4.  **Phase 4: UI/UX Refinement & Responsiveness:**
    *   Refine the user interface using shadcn components and Tailwind CSS.
    *   Ensure the application is fully responsive across devices.
    *   Improve user experience (navigation, feedback, accessibility).
    *   Incorporate any early user feedback.
    *   **Testing:** Perform extensive responsive design testing across browsers/devices. Conduct accessibility testing (WCAG). Update E2E tests to reflect UI changes. Perform thorough QA on the overall user experience. Ensure tests pass in CI.

5.  **Phase 5: Deployment, Monitoring, and Iteration:**
    *   Deploy frontend (Firebase Hosting) and backend (Cloud Functions) to production after ensuring all tests pass and QA is complete.
    *   Set up monitoring tools (Firebase Analytics, Google Cloud Monitoring, Sentry/Error Tracking).
    *   Conduct post-deployment smoke testing.
    *   Establish a feedback loop for collecting user input.
    *   Plan for iterative improvements based on monitoring data and user feedback.
    *   **Testing:** Ensure final test suites pass in the CI/CD pipeline before deployment. Monitor production environment for errors and performance issues. Use feedback and monitoring to guide further testing and development cycles.

**Core Game State Flow:**

```mermaid
stateDiagram-v2
    [*] --> ChallengeAnnouncement
    ChallengeAnnouncement --> SongSelection
    SongSelection --> MusicPlayback
    MusicPlayback --> VotingAndRanking
    VotingAndRanking --> Scoring
    Scoring --> ProceedNextRoundOrEndGame
    ProceedNextRoundOrEndGame --> [*] : Proceed to Next Round or End Game