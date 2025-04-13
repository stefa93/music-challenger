# Implementation Plan: next-phase

This document outlines the steps required to fully implement the functionality for the next phase.

**Target Component:** `src/components/game-phases/ChallengeAnnouncementPhase/ChallengeAnnouncementPhase.tsx`

## Frontend Implementation (`GameView.tsx` or Parent Component)

The component managing the game state and rendering `ChallengeAnnouncementPhase` needs the following updates:

1.  **Prop Passing:**
    *   Pass the following new props to `<ChallengeAnnouncementPhase>`:
        *   `isHost: boolean`: Determine if the current logged-in user's ID matches the `roundHostPlayerId` from the round data.
        *   `predefinedChallenges: string[]`: Provide a list of predefined challenge strings. (See Backend section for source).
        *   `isSettingChallenge: boolean`: A state variable indicating if the challenge setting request is in progress.
        *   `onSetChallenge: (challenge: string) => void`: A callback function to handle the challenge setting logic.

2.  **State Management:**
    *   Introduce a state variable `isSettingChallenge` (default: `false`) to manage the loading state of the "Set Challenge" button.

3.  **`onSetChallenge` Callback Function:**
    *   Implement this function. It should:
        *   Set `isSettingChallenge` to `true`.
        *   Call the corresponding backend function (e.g., `setChallenge`) via `firebaseApi.ts`, passing the `gameId`, `roundId`, and the chosen `challenge` string.
        *   Handle the promise returned by the backend call:
            *   On success: The Firestore listener for the round should automatically update the local `challenge` state, causing the UI to switch to the "Challenge Announced" view.
            *   On error: Log the error, potentially show a toast/message to the user.
        *   Finally, set `isSettingChallenge` back to `false`.

4.  **Fetching Predefined Challenges:**
    *   Determine the source for `predefinedChallenges`. Options:
        *   **Static List:** Define them directly in the frontend code (simple, less flexible).
        *   **Firestore Config/Collection:** Fetch them from Firestore once when the game loads (more flexible).
    *   Pass the fetched or defined list via the `predefinedChallenges` prop.

5.  **Conditional Logic for "Start Selection":**
    *   Ensure the `onStartSelectionPhase` prop/logic is only triggered *after* the `challenge` field in the round data is populated (i.e., the challenge has been successfully set). The existing logic in `ChallengeAnnouncementPhase` already handles showing the button conditionally based on `isHost` and `challengeIsSet`.

## Backend Implementation (Firebase Functions)

1.  **`setChallenge` Cloud Function:**
    *   Create a new HTTPS Callable Function (e.g., `setChallenge`).
    *   **Inputs:** `gameId: string`, `roundId: string`, `challenge: string`.
    *   **Authentication:** Verify the caller (`context.auth.uid`) is the `roundHostPlayerId` for the specified `roundId` within the `gameId`. Reject if not authorized.
    *   **Validation:**
        *   Check if the `challenge` string is non-empty and within reasonable length limits.
        *   Check if the challenge for the current round hasn't already been set.
    *   **Action:** Update the Firestore document for the specified round (`games/{gameId}/rounds/{roundId}`) by setting the `challenge` field to the provided string.
    *   **Return:** Success or error status.

2.  **Source for Predefined Challenges (if using Firestore):**
    *   Decide how to store the list (e.g., in Firebase Remote Config, a dedicated Firestore collection `challenges`, or a field within the main `gameConfig` document).
    *   Ensure appropriate read access rules for clients if fetching directly from Firestore.

## Component (`ChallengeAnnouncementPhase.tsx`) Review

*   The component already handles the UI logic based on the new props (`isHost`, `challenge`, `isSettingChallenge`, etc.).
*   Ensure the `Select` component styling fits the overall theme. Basic `shadcn/ui` styling is used; further creative styling could be applied later if needed (e.g., using `font-handwritten` in `SelectItem` if desired, though system font is generally better for lists).

## Testing Considerations

*   Test the host view: custom input, select dropdown, random button, set button (including loading/disabled states).
*   Test the non-host view: waiting message, challenge announcement display.
*   Test the transition between views when the challenge is set.
*   Test error handling if the backend call fails.
*   Test authorization (only the host can set the challenge).