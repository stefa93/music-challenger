# User Story: Implement Lobby Settings Backend

**ID:** 03
**Type:** Feature (Lobby)
**Estimate:** 1 SP

**As a** Developer,
**I want** to implement the backend Cloud Function (`updateGameSettings`) and Firestore schema changes for configurable lobby settings,
**So that** game creators can customize game parameters like rounds and player limits, and these settings are persisted.

**Acceptance Criteria:**

*   The Firestore schema for `games/{gameId}` documents is updated to include a `settings` field (map) containing `rounds`, `maxPlayers`, `allowExplicit`, `selectionTimeLimit`, `rankingTimeLimit`.
*   Default values are established for the `settings` field when a new game is created.
*   An HTTPS Callable Cloud Function named `updateGameSettings` is created.
*   The `updateGameSettings` function accepts `gameId` and the new `settings` object as input.
*   The function validates the input settings (e.g., ensuring values are within reasonable ranges).
*   The function includes an authorization check to ensure only the game creator (`creatorPlayerId` or similar) can update the settings.
*   The function successfully updates the `settings` field in the corresponding Firestore game document.
*   Unit tests are written for the `updateGameSettings` Cloud Function, covering validation, authorization, and successful updates.

**Notes:**

*   Refers to the backend part of the decision logged in `decisionLog.md` [2025-07-04 12:40:28].
*   Ensure Firestore security rules allow the Cloud Function to write to the `settings` field.