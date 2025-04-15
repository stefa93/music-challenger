# User Story: Fix Music Playback in Listening Phase

**ID:** 22
**Type:** Bug
**Estimate:** 1 SP

**As a** Player,
**I want** the music previews to play automatically and correctly during the listening phase,
**So that** I can hear all the nominated songs before ranking them.

**Acceptance Criteria:**

*   When the game transitions to the `listening` phase, the `MusicPlaybackPhase` component correctly receives the `songsForRanking` and `playbackEndTime`.
*   The component uses the `previewUrl` from the current song in the `songsForRanking` list for the audio player.
*   The audio player automatically starts playing the first song when the phase begins.
*   Playback controls (if any, like next/prev handled by host) function correctly.
*   Playback stops or is disabled when the `playbackEndTime` is reached.
*   No console errors related to audio playback or state updates occur during the listening phase.

**Notes:**

*   Investigate why playback isn't starting despite backend changes to refresh URLs and set `playbackEndTime`.
*   Check props passed to `MusicPlaybackPhase` from `GameView`.
*   Verify audio element handling (`src`, `.play()` calls) within `MusicPlaybackPhase`.
*   Ensure `playbackEndTime` logic is correctly implemented on the frontend.