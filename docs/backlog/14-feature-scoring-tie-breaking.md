# User Story: Implement Scoring Tie-Breaking Logic

**ID:** 14
**Type:** Feature (Scoring)
**Estimate:** 1 SP

**As a** Player,
**I want** clear tie-breaking rules implemented and applied during scoring,
**So that** final rankings are unambiguous even when songs receive the same total points.

**Acceptance Criteria:**

*   A specific tie-breaking rule is chosen and documented (e.g., based on the number of first-place votes as suggested in `projectBrief.md`, or another fair method).
*   The backend scoring logic (`calculateScoresService` or similar) is updated to implement the chosen tie-breaking rule when calculating the final rank order of songs within a round.
*   The round results displayed in the `RoundFinishedPhase` accurately reflect the rankings after tie-breaking rules have been applied.
*   Unit tests are added or updated for the scoring service to specifically verify the tie-breaking logic with relevant test cases.

**Notes:**

*   Addresses the tie-breaker requirement mentioned in `projectBrief.md` (lines 223-226).
*   Ensures fairness and clarity in determining round winners.