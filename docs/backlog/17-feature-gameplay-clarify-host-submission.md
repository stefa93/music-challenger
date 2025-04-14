# User Story: Clarify Host Song Submission Rule

**ID:** 17
**Type:** Feature (Gameplay)
**Estimate:** 1 SP

**As a** Developer,
**I want** to clarify, implement, and document a standard rule for whether the Round Host also contributes a song during the selection phase,
**So that** the gameplay is consistent and unambiguous for all players.

**Acceptance Criteria:**

*   A decision is made and documented (e.g., in `decisionLog.md` or `productContext.md`) on whether the Round Host submits a song like other players.
*   The backend logic (`submitSongNominationService`, scoring logic) is updated to consistently handle song submissions based on the decided rule (e.g., expecting N or N-1 submissions where N is player count).
*   The frontend UI (`SelectionPhase.tsx`) correctly reflects the rule (e.g., enabling/disabling submission for the host).
*   Relevant documentation (`projectBrief.md`, game rules if displayed in UI) is updated to clearly state the rule.
*   Tests are updated to reflect the implemented rule.

**Notes:**

*   Addresses ambiguity found when comparing `projectBrief.md` (which implies host might not submit) and current implementation assumptions.
*   Ensures consistent game flow and scoring calculations.