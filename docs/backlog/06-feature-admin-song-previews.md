# User Story: Implement Admin Dashboard Song Previews

**ID:** 06
**Type:** Feature (Admin)
**Estimate:** 1 SP

**As a** Developer,
**I want** to implement the song preview playback functionality within the Admin Dashboard's challenge view,
**So that** administrators can listen to the 30-second previews of predefined songs associated with challenges.

**Acceptance Criteria:**

*   The `AdminPage.tsx` component is updated to include a play button or similar UI element next to each predefined song listed in the challenge accordion.
*   Clicking the play button utilizes the `previewUrl` associated with the song (fetched via `getAdminChallengeDataAPI`).
*   An HTML `<audio>` element or a suitable audio playback library is used to play the 30-second preview.
*   Playback controls (e.g., play/pause, potentially a progress indicator) are provided for the active preview.
*   Only one preview plays at a time; starting a new preview stops any currently playing preview.
*   The UI gracefully handles cases where a `previewUrl` might be missing or invalid for a song.

**Notes:**

*   Refines original Story #8 based on code review of `AdminPage.tsx`.
*   Depends on the `getAdminChallengeDataAPI` function returning `previewUrl` for predefined songs.