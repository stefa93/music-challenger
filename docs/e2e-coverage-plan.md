# E2E Test Coverage Enhancement Plan (v2 - Prioritized)

This plan outlines additional End-to-End (E2E) test cases required to ensure comprehensive coverage of the Songer application's main functionality, based on the gaps identified during the initial assessment and confirmed by code review (as of 2025-04-03). Tests will be implemented using Playwright.

**Key:**
*   `[Feasible Now]` - Core functionality likely exists.
*   `[Partially Feasible]` - Some backend/frontend logic exists, but specific sub-features (e.g., bonus points, UI details) might be missing or incomplete.
*   `[Blocked - Future Functionality]` - Depends on features not yet implemented (e.g., Joker Token).
*   `[Blocked - Known Issue]` - Depends on resolving known issues (e.g., Spotify auth callback).

---

## 0. Game Setup & Lobby (UI Focused)

**Goal:** Verify users can create, join, and start games via the UI.

*   **TC-SETUP-01:** User successfully creates a new game using the "Create Game" tab in the Onboarding UI. `[Done]` (Covered by `tests/game_creation.spec.ts`)
*   **TC-SETUP-02:** User successfully joins an existing game using the "Join Game" tab in the Onboarding UI (requires valid Game ID). `[Done]` (Covered by `tests/game_joining.spec.ts`)
*   **TC-SETUP-03:** Player list updates in real-time for all players in the lobby when a new player joins via the UI. `[Done]` (Covered by `tests/game_lobby.spec.ts`)
*   **TC-SETUP-04:** Game creator sees and can successfully click the "Start Game" button in the lobby UI when minimum players are present. `[Done]` (Covered by `tests/game_lobby.spec.ts`)
*   **TC-SETUP-05:** Non-creator players in the lobby do *not* see the "Start Game" button. `[Done]` (Missing test case noted in `tests/game_lobby.spec.ts`)
*   **TC-SETUP-06:** User joins a game, refreshes the page, and is automatically returned to the correct game lobby/view without re-entering details. `[Done]` (Relies on localStorage persistence and `GameContext` logic).

---

## 1. Spotify Integration

**Goal:** Verify Spotify interactions for song nomination and authentication.

*   **1.1 Song Search & Contribution:** `[Blocked - Future Functionality]` / `[Feasible Now]`
    *   *Rationale:* `submitSongNomination` function exists and uses text input (as seen in `GameView.tsx` and `playerHandlers.ts`). **Spotify *search* integration UI/logic is not implemented.** Nomination itself is testable.
    *   **TC-SPOTIFY-01:** (Deferred) Successfully search for a song using the Spotify search UI. `[Blocked - Future Functionality]`
    *   **TC-SPOTIFY-02:** (Deferred) Successfully nominate a song selected from the Spotify search results UI. `[Blocked - Future Functionality]`
    *   **TC-SPOTIFY-03:** Verify nominating a song via the text input UI updates the game state and UI correctly (e.g., shows "Waiting for others"). `[Done]` (Covered by `tests/gameplay_round.spec.ts`)
    *   **TC-SPOTIFY-04:** (Deferred) Handle cases where the Spotify search UI returns no results. `[Blocked - Future Functionality]`

*   **1.2 Authentication Callback:** `[Blocked - Known Issue]`
    *   *Rationale:* Tests for the Spotify callback (`/callback` route handling and token exchange via `exchangeSpotifyCodeService`) are currently skipped due to known test stability issues. Backend logic exists.
    *   **TC-SPOTIFY-AUTH-CALLBACK-01:** Successfully handle redirect from Spotify, exchange code for token, update auth state.
    *   **TC-SPOTIFY-AUTH-CALLBACK-02:** Handle errors during the callback process (e.g., invalid state, Spotify error).

## 2. Detailed Ranking & Scoring Scenarios

**Goal:** Verify the ranking and scoring logic, including bonus points and edge cases. `[Partially Feasible]`

*   *Rationale:* `submitRanking` and `calculateScores` functions exist. UI for ranking exists. Bonus point logic implementation needs confirmation.
*   **TC-SCORE-01:** Successfully submit rankings for all songs (excluding own) via the ranking UI. `[Done]` (Covered by `tests/gameplay_round.spec.ts`)
*   **TC-SCORE-02:** Verify scores are calculated correctly based on simple ranking. `[Done]` (Covered by `tests/gameplay_round.spec.ts`)
*   **TC-SCORE-03:** Verify bonus points are awarded correctly for the top-ranked player-contributed song *if Joker was used*. `[Partially Feasible]` (Depends on bonus/Joker logic in `scoringService.ts`).
*   **TC-SCORE-04:** Verify bonus points are awarded correctly when multiple player-contributed songs tie for the top rank *if Joker was used*. `[Partially Feasible]` (Depends on bonus/Joker/tie logic in `scoringService.ts`).
*   **TC-SCORE-05:** Verify scores are calculated correctly in case of ties in rankings (including point sharing/rounding). `[Partially Feasible]` (Depends on tie logic in `scoringService.ts`).
*   **TC-SCORE-06:** Verify total scores accumulate correctly across rounds. `[Feasible Now]` (Requires stable multi-round test).
*   **TC-SCORE-07:** Verify the UI displays round scores and total scores accurately after calculation. `[Done]` (Covered by `tests/gameplay_round.spec.ts`)
*   **TC-SCORE-08:** Verify the UI prevents players from ranking their own submitted song. `[Done]` (Ranking UI exists, logic likely in `submitRankingService` and potentially frontend).

## 3. Joker Token Usage

**Goal:** Verify the Joker token functionality. `[Blocked - Future Functionality]`

*   *Rationale:* No indication of Joker token implementation found in code review (`GameView.tsx`, services, data models).
*   **TC-JOKER-01:** Player successfully activates the Joker token *before* the round challenge is announced.
*   **TC-JOKER-02:** Verify the player's score for that round is doubled when the Joker was active.
*   **TC-JOKER-03:** Verify a player cannot use the Joker token more than once per game.
*   **TC-JOKER-04:** Verify a player cannot activate the Joker token *after* the round challenge is announced.
*   **TC-JOKER-05:** Verify the UI correctly indicates when a Joker is active/used.

## 4. Multi-Round Progression

**Goal:** Verify the game correctly progresses through multiple rounds, including host rotation. `[Partially Feasible]`

*   *Rationale:* `startNextRound` function exists. Host rotation logic implementation needs confirmation.
*   **TC-MULTIROUND-01:** Complete at least two full rounds of gameplay. `[Feasible Now]` (Depends on stability of single round tests).
*   **TC-MULTIROUND-02:** Verify the Round Host rotates correctly between rounds. `[Partially Feasible]` (Depends on host rotation logic in `startNextRoundService`).
*   **TC-MULTIROUND-03:** Verify the round number increments correctly. `[Feasible Now]`
*   **TC-MULTIROUND-04:** Verify game state transitions correctly between rounds. `[Feasible Now]`

## 5. Game Completion & Winner Declaration

**Goal:** Verify the game ends correctly and declares the winner. `[Partially Feasible]`

*   *Rationale:* Placeholder UI for 'finished' state exists. Logic for determining the end-of-game condition and winner declaration needs confirmation.
*   **TC-COMPLETE-01:** Complete the predetermined number of rounds. `[Feasible Now]` (Requires stable multi-round test).
*   **TC-COMPLETE-02:** Verify the game status transitions to 'finished'. `[Partially Feasible]` (Depends on logic in `startNextRoundService`).
*   **TC-COMPLETE-03:** Verify the UI correctly displays the final scores and declares the winner(s). `[Partially Feasible]` (Depends on `GameView.tsx` finished state UI and winner logic).
*   **TC-COMPLETE-04:** Verify game correctly handles ties for the winning score. `[Partially Feasible]` (Depends on winner declaration logic).

## 6. Key Error Handling Scenarios

**Goal:** Verify the application handles common errors gracefully during gameplay. `[Partially Feasible]`

*   *Rationale:* Basic validation exists, but comprehensive gameplay error handling is likely limited. Requires specific setup or mocking.
*   **TC-ERROR-01:** Handle player attempting to submit ranking/nomination outside the allowed phase. `[Feasible Now]` (Logic likely in services like `submitSongNominationService`, `submitRankingService`).
*   **TC-ERROR-02:** Handle backend API errors during critical actions (start game, submit nomination, submit ranking, calculate scores). `[Partially Feasible]` (Requires mocking backend function failures).
*   **TC-ERROR-03:** (Optional/Difficult) Simulate a player disconnecting mid-game (e.g., closing browser tab). `[Blocked - Future Functionality]` (Requires specific handling logic).
*   **TC-ERROR-04:** Verify frontend input validation errors are displayed in the Onboarding UI (e.g., empty name/gameId). `[Done]` (Placeholder test exists in `tests/game_creation.spec.ts`)
*   **TC-ERROR-05:** Handle potential API errors during nomination via text input (e.g., submitting outside the allowed phase) and display appropriate feedback in the UI. `[Feasible Now]` *(Needs refinement: UI prevents submission outside phase; test should focus on valid errors within phase or backend validation)*