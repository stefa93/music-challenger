# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-03-30 22:58:37 - Log of updates made.

*

## Coding Patterns

*   [2025-03-31 00:50:42] - **Latest Documentation:** Always consult and utilize the latest official documentation for all libraries, frameworks, and tools used in the project.

## Architectural Patterns

*   [2025-07-04 00:11:38] - **Generic Music Provider:** Use a `MusicProviderService` interface and generic types (`MusicTrack`, etc.) to abstract music API interactions (search, details). Implement concrete services (e.g., `DeezerMusicService`) and use a factory (`musicService.ts`) to provide the configured instance. This allows switching providers (Deezer, Spotify) via configuration.
*   [2025-09-04 13:17:00] - **Modular Backend (Firebase Functions):** The `functions/src` directory is organized into distinct modules based on domain concerns (e.g., `game`, `player`, `round`, `music`, `scoring`, `core`, `config`). Each module typically contains dedicated files for data access (`*.data.ts`), service logic (`*.service.ts`), Cloud Function handlers (`*.handlers.ts`), and types (`types.ts`), promoting separation of concerns and maintainability.

## Logging Patterns

*   [2025-04-01 15:44:00] - **Structured Logging:** Use dedicated libraries (`loglevel` frontend, `functions.logger` backend) with appropriate levels (DEBUG, INFO, WARN, ERROR). Backend logs are automatically structured JSON in Cloud Logging.
*   [2025-04-01 15:44:00] - **Trace IDs:** Generate a unique `traceId` on the frontend for operations involving backend calls. Pass this ID in the request payload and include it in all related frontend and backend log messages for correlation.
*   [2025-04-01 15:44:00] - **Contextual Logging:** Include relevant context (e.g., `gameId`, `playerId`, error objects) in log payloads. Avoid logging sensitive data (PII, secrets, tokens).
*   [2025-04-01 15:44:00] - **Centralization:** Backend logs are centralized in Google Cloud Logging. Frontend logs currently go to the browser console (shipping deferred).
*   [2025-04-01 15:44:00] - **Documentation:** Refer to `LOGGING.md` for the detailed strategy.

## Testing Patterns

*   [2025-03-31 00:50:42] - **Test-Driven Development (TDD):** All new features and bug fixes must be developed following the TDD methodology (Red-Green-Refactor). Tests (unit, integration, or E2E as appropriate) must be written *before* the implementation code.
*   [2025-04-01 12:20:59] - **E2E Test State Reset:** Ensure test isolation by resetting relevant state (e.g., Firestore emulator data) before test runs or suites. The specific mechanism will be defined during Playwright implementation (e.g., using `globalSetup` or `beforeAll` hooks).