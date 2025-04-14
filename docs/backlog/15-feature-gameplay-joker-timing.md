# User Story: Enforce Joker Usage Timing

**ID:** 15
**Type:** Feature (Gameplay)
**Estimate:** 1 SP

**As a** Player,
**I want** the rule stating the Joker token must be used *before* the challenge announcement to be strictly enforced,
**So that** gameplay is fair and consistent according to the defined rules.

**Acceptance Criteria:**

*   The UI provides a clear mechanism for players to indicate their intention to use the Joker *before* the `ChallengeAnnouncementPhase` begins (e.g., a button in the Lobby or between rounds).
*   The backend logic (e.g., a `playJoker` Cloud Function) allows Joker usage only during the appropriate game state (Lobby or between rounds, before challenge announcement).
*   Attempts to use the Joker during or after the challenge announcement are rejected with appropriate feedback to the user.
*   The player's `jokerAvailable` status (or similar tracking mechanism) is correctly updated in Firestore upon successful Joker usage.
*   The scoring logic correctly identifies if a Joker was played for the current round when calculating doubled scores.
*   Relevant unit and E2E tests are added/updated to verify the Joker timing rules and enforcement.

**Notes:**

*   Implements the rule specified in `projectBrief.md` (lines 201-206).
*   Requires careful consideration of UI placement and backend state checks.