# User Story: Implement Duplicate Song Penalty

**ID:** 16
**Type:** Feature (Scoring)
**Estimate:** 1 SP

**As a** Player,
**I want** the defined penalty for duplicate song nominations to be correctly calculated and applied during the scoring phase,
**So that** nominating the exact same song as another player is appropriately discouraged.

**Acceptance Criteria:**

*   The backend scoring logic (`calculateScoresService` or similar) identifies when multiple players have nominated the *exact same song* within a round (using a reliable identifier like `trackId`).
*   If `X` players nominate the same song, each of those `X` players receives a penalty of `-(X-1)` points, applied to their total score for that round.
*   The penalty is applied correctly alongside base points, bonus points (if Joker used), and Joker doubling.
*   The final scores displayed reflect the application of any duplicate penalties.
*   Unit tests are added or updated for the scoring service to specifically verify the duplicate penalty calculation and application in various scenarios (2 duplicates, 3 duplicates, duplicates with Jokers, etc.).

**Notes:**

*   Implements the penalty rule defined in `decisionLog.md` [2025-04-01 23:22:09].
*   Requires accurate identification of identical songs (using `trackId` from Deezer/music provider is crucial).