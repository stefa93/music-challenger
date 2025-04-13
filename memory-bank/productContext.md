# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.

*

## Project Goal

*   **Primary:** Players aim to select or contribute songs that will be ranked highest by all players based on how well they fit the assigned challenge (e.g., "most danceable song").
*   **Secondary:** Earn bonus points for contributed songs ranking highly, strategically use a Joker token to double points, engage in collaborative discussions.

## Key Features

*   **Players:** 2 to 6 players.
*   **Rounds:** Multiple rounds, each with a unique musical challenge announced by a rotating Round Host.
*   **Song Pool:** Each round features songs nominated by players (one per player, either via Deezer search or by selecting from a challenge-specific predefined list). The final pool for ranking is supplemented with additional unique songs from the predefined list if necessary to ensure a minimum of 5 total songs.
*   **Gameplay Loop:**
    *   Challenge Announcement
    *   Song Selection (Player nominates via search or selects from predefined list)
    *   Music Playback (30-second snippets)
    *   Ranking/Voting (Private, excluding own song)
    *   Scoring (Player score based on points awarded to their submitted song, determined by inverse rank sum of N songs. Ties share points. Bonus points for top song awarded *only* if Joker is used. Duplicate song nominations penalized.)
*   **Joker Token:** Each player gets one Joker per game (must be played before challenge announcement). If used, doubles the player's *total* score for that round (base score + bonus points).
*   **Winning:** Player with the highest total score after the predetermined number of rounds wins.
*   **Session Restoration:** The application should store the current `gameId` and `playerId` (e.g., in `localStorage`) so that if the user refreshes the page or navigates away and returns, they are automatically placed back into their active game session.

## Overall Architecture

*   **Frontend:** React, TypeScript, Vite, shadcn UI components with Tailwind CSS. Hosted on Firebase Hosting.
*   **Backend:** Node.js with Firebase Cloud Functions for business logic (scoring, round progression, etc.).
*   **Database & Real-time:** Firebase Firestore for game state, player data, rounds, songs, scores, leveraging real-time updates.
*   **Authentication:** Currently not implemented (players join via name entry). Firebase Authentication is noted in the brief but marked as deprecated/not used for now.
*   **Music Integration:** Generic Music Provider interface implemented, currently using Deezer API for song searching and metadata retrieval (including preview URLs). Spotify integration removed. [2025-07-04 00:10:22]

---
*Footnotes:*
*   2025-03-30 22:58:00 - Initial file creation.
*   2025-03-30 23:03:15 - Populated goals, features, and architecture from projectBrief.md.
*   2025-04-01 22:18:15 - Removed "Discussion" phase from Gameplay Loop per user decision.
*   2025-04-01 23:16:46 - Clarified scoring logic (score based on submitted song's rank, N-based points, tie handling) and Joker/Bonus interaction. Added duplicate song penalty requirement.
*   [2025-04-03 11:26:00] - Added requirement for session restoration (rejoining game on refresh/return).
*   [2025-04-03 14:38:00] - Implemented standardized "Challenge Announcement" phase (`_announcing` status) as the entry point for all rounds.
*   [2025-07-04 00:10:22] - Refactored music integration to use a generic provider interface, replacing Spotify with Deezer.
*   [2025-04-13 08:07:55] - Updated Song Pool logic to include challenge-specific predefined songs (stored in Firestore) and allow players to select from this list or search. Ensures a minimum of 5 songs for ranking.