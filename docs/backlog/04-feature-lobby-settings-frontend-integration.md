# User Story: Integrate Lobby Settings Frontend

**ID:** 04
**Type:** Feature (Lobby)
**Estimate:** 1 SP

**As a** Developer,
**I want** to integrate the frontend Lobby Settings UI with the backend API call (`updateGameSettingsService`) in the parent component/context,
**So that** game creators can view and successfully save their chosen settings.

**Acceptance Criteria:**

*   A frontend service function (`updateGameSettingsService` or similar in `firebaseApi.ts`) is created to call the `updateGameSettings` Cloud Function.
*   The parent component or context managing the `LobbyPhase` component implements the `handleSettingsChange` logic (triggered by the `onSettingsChange` prop from `LobbyPhase`).
*   The `handleSettingsChange` logic calls the `updateGameSettingsService` to persist the changes to the backend.
*   Appropriate loading states and error handling are implemented for the settings update process.
*   The `GameContext` (or equivalent state management) correctly fetches the initial game settings and updates its state when settings change (either via local update or Firestore listener).
*   The `initialSettings` prop passed to `LobbyPhase` reflects the current settings from the context/state.
*   Relevant unit/integration tests (e.g., `GameView.test.tsx`) are updated to mock and verify the `onSettingsChange` callback and related service calls.

**Notes:**

*   Connects the UI implemented in `LobbyPhase.tsx` to the backend function created in Story #3.
*   Refers to the frontend integration part of the decision logged in `decisionLog.md` [2025-07-04 12:40:28].