# User Story: Integrate Lobby Settings into Game Logic

**ID:** 05
**Type:** Feature (Lobby)
**Estimate:** 1 SP

**As a** Developer,
**I want** to integrate the configured lobby settings (max players, rounds, timers, explicit filter) into the core game logic,
**So that** the game behaves according to the creator's choices.

**Acceptance Criteria:**

*   Player joining logic (e.g., in `joinGameService`) prevents players from joining if the game is full based on the `settings.maxPlayers` value.
*   Game end logic (e.g., in `startNextRoundService` or score calculation) correctly determines the final round based on `settings.rounds`.
*   Frontend phase components (`SelectionPhase`, `RankingPhase`) display timers based on `settings.selectionTimeLimit` and `settings.rankingTimeLimit`.
*   Timers disable relevant inputs upon expiration but do **not** automatically transition the game phase (as per `decisionLog.md`).
*   Music search/selection logic (backend or frontend) filters out explicit songs if `settings.allowExplicit` is false. (Requires track metadata indicating explicitness).
*   Relevant unit and E2E tests are added or updated to verify the behavior based on different settings configurations.

**Notes:**

*   Implements the actual game behavior changes based on settings persisted in Stories #3 and #4.
*   Refers to the game logic integration part of the decision logged in `decisionLog.md` [2025-07-04 12:40:28].
*   Explicit filtering requires the music provider (Deezer) API to return explicitness information for tracks.