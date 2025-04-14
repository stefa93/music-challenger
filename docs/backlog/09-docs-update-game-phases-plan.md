# User Story: Update Game Phases Implementation Plan Doc

**ID:** 09
**Type:** Docs
**Estimate:** 1 SP

**As a** Developer,
**I want** to update the Music Playback section in `docs/implementation-plan-game-phases.md` to remove outdated Spotify SDK details and accurately reflect the current Deezer/HTML audio implementation,
**So that** the documentation is correct and avoids confusion for future development.

**Acceptance Criteria:**

*   The `docs/implementation-plan-game-phases.md` file is reviewed.
*   The section detailing the `MusicPlaybackPhase` implementation (lines 264-295 in the reviewed content) is updated.
*   References to Spotify Web Playback SDK, Spotify User Authentication (OAuth), SDK state management, and SDK interaction functions are removed or replaced.
*   The description accurately reflects the current approach using Deezer API for `previewUrl` and a frontend HTML `<audio>` element for playback.
*   Backend details related to Spotify token handling are removed.

**Notes:**

*   Addresses the documentation note in `activeContext.md` [2025-09-04 13:15:00].
*   Ensures technical documentation aligns with the major Spotify-to-Deezer refactor.