# User Story: Fix Song Submission Error (Done)

**ID:** 20
**Type:** Bug
**Estimate:** 1 SP

**As a** Developer,
**I want** to investigate and fix the `functions/invalid-argument: Valid track details (trackId, name, artist) are required` error occurring during song submission,
**So that** players can successfully submit their chosen songs without encountering errors.

**Acceptance Criteria:**

*   The root cause of the `invalid-argument` error in the `submitSongNomination` Cloud Function (or related services/handlers) is identified.
*   The issue is resolved, ensuring that valid track details (`trackId`, `name`, `artist`) are consistently provided or retrieved when submitting a song nomination (whether from search or predefined list).
*   Players can successfully submit songs via both the search interface and the predefined list selection without encountering this error.
*   Relevant logs are checked or added to confirm the correct track details are being processed by the backend.
*   Tests (unit or E2E) are added or updated to specifically cover the song submission scenarios and prevent regression.

**Notes:**

*   Addresses the specific error reported by the user.
*   May involve checking data flow from frontend selection (`useSongNomination` hook, `firebaseApi.ts`) to backend handler (`round.handlers.ts`) and service (`round.service.ts`).