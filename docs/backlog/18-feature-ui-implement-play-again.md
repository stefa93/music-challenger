# User Story: Implement "Play Again" Functionality

**ID:** 18
**Type:** Feature (UI)
**Estimate:** 1 SP

**As a** Player,
**I want** the "Play Again" button on the Game Finished screen to successfully initiate a new game session,
**So that** I can easily start another game without leaving the application.

**Acceptance Criteria:**

*   The "Play Again" button in `GameFinishedPhase.tsx` is made functional.
*   Clicking the button triggers the necessary action to start a new game. This could involve:
    *   Navigating the user back to the Lobby/Onboarding screen to create/join a new game.
    *   OR: Calling a backend function (`createNewGameFromExisting`?) that creates a new game instance, potentially reusing players from the finished game, and automatically navigating the user to the new game lobby.
*   The chosen implementation provides a smooth user experience for starting a subsequent game.
*   Relevant tests are added to verify the "Play Again" functionality.

**Notes:**

*   Requires deciding on the desired "Play Again" flow (return to lobby vs. auto-create new game).
*   If auto-creating, backend logic needs to handle game creation and player association.