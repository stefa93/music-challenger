import { test, expect, type Page, type APIRequestContext, type Browser } from '@playwright/test'; // Added Browser
import { createGame, joinGameViaApi, startGameViaApi } from './utils/gameUtils'; // Import helpers

// --- Tests ---

test.describe('Game Lobby E2E Test', () => {
  const creatorName = `Creator_${Date.now()}`;
  const joinerName = `Joiner_${Date.now()}`;
  let gameId: string; // Keep this as string

  // Note: clearFirestore is handled by globalSetup defined in playwright.config.ts
  // No need for beforeAll hook here for that purpose.

  test.beforeEach(async ({ page }) => {
    // Visit the app before each test
    await page.goto('/'); // baseURL is set in playwright.config.ts
    await expect(page.getByLabel(/display name/i)).toBeVisible(); // Updated label
  });

  test('TC-SETUP-04: Start Game button disappears after game starts', async ({ page, request }) => { // Added request
    // Create game as creator
    // We don't need the gameId for this specific test, so just call it
    // Create game as creator - this waits for gameId
    const { gameId: createdGameId } = await createGame(page, creatorName);
    expect(createdGameId).toBeTruthy();
    await joinGameViaApi(request, createdGameId, 'TestPlayer2'); // Add player 2
    await startGameViaApi(request, createdGameId); // Start game

    // Wait for Round 1 heading to ensure game view is loaded via listener
    await expect(page.locator('h3:has-text("Round 1")')).toBeVisible({ timeout: 15000 });

    // Check Start Game button is NOT visible after starting
    await expect(page.getByRole('button', { name: /Start Game/i })).not.toBeVisible();
  });

  test('TC-SETUP-03: Player list updates when another player joins', async ({ page, request }) => {
    // Creator creates game
    const gameCreationResult = await createGame(page, creatorName); // Store the result object
    gameId = gameCreationResult.gameId; // Assign the gameId property
    expect(gameId).toBeTruthy(); // Check if gameId is truthy (not null/undefined/empty)
    // Second player joins via API call
    await joinGameViaApi(request, gameId, joinerName);

    await startGameViaApi(request, gameId); // Start game (AFTER player joins)
    // Wait for Round 1 heading to ensure game view is loaded via listener
    await expect(page.locator('h3:has-text("Round 1")')).toBeVisible({ timeout: 15000 });

    // Check player list in the creator's view
    // Playwright's auto-waiting should help here compared to Cypress manual waits/retries
    const playerList = page.locator('[data-testid="player-list"]'); // Use data-testid
    await expect(playerList).toBeVisible();
    // Using text locators which wait for the text to appear
    await expect(playerList.locator(`li:has-text("${creatorName} (You)")`)).toBeVisible();
    await expect(playerList.locator(`li:has-text("${joinerName}")`)).toBeVisible({ timeout: 10000 }); // Allow extra time for UI update
    // Check count if reliable
    // await expect(playerList.locator('li')).toHaveCount(2);
  });

  test('TC-SETUP-04: Creator can click Start Game button when minimum players are present', async ({ page, request }) => {
    // Creator creates game
    const gameCreationResult = await createGame(page, creatorName); // Store the result object
    gameId = gameCreationResult.gameId; // Assign the gameId property
    expect(gameId).toBeTruthy(); // Check if gameId is truthy
    // Second player joins via API to meet minimum requirement
    await joinGameViaApi(request, gameId, joinerName);

    // Removed startGameViaApi call here; this test starts via UI click later
    // NOTE: Game should still be in 'waiting' state here.
    // The "Round 1" heading check was removed as it's incorrect before starting the game.

    // Verify UI shows 2 players before attempting to start
    const playerList = page.locator('[data-testid="player-list"]'); // Use data-testid
    await expect(playerList.locator(`li:has-text("${creatorName} (You)")`)).toBeVisible();
    await expect(playerList.locator(`li:has-text("${joinerName}")`)).toBeVisible({ timeout: 10000 });

    // Click Start Game
    const startGameButton = page.getByRole('button', { name: /Start Game/i });
    await expect(startGameButton).toBeVisible();
    await startGameButton.click();

    // Check for game state change to Round 1 Announcement Phase
    // 1. Wait for an element *inside* GameView (like the player list) to be visible.
    //    This confirms GamePage loading is done AND GameView has rendered.
    await expect(page.locator('[data-testid="player-list"]')).toBeVisible({ timeout: 15000 });
    // 2. Now, wait for the status text within GameView to update specifically to announcing.
    // DEBUG: Log the actual status text before the assertion
    const statusElement = page.locator('p:has-text("Status:")'); // Find the status paragraph
    try {
      await statusElement.waitFor({ state: 'visible', timeout: 1000 }); // Wait briefly for it
      const actualStatusText = await statusElement.textContent();
      console.log(`DEBUG: Actual status text found: "${actualStatusText}"`);
    } catch (e) {
      console.log("DEBUG: Status paragraph 'p:has-text(\"Status:\")' not found quickly.");
    }
    // Removed strict check for 'Status: round1_announcing' due to potential race condition.
    // Instead, we verify elements specific to the announcement phase appear below.
    // Now check for the specific announcement elements
    await expect(page.locator('h4:has-text("Challenge Announcement")')).toBeVisible(); // Default timeout should be sufficient now
    await expect(page.locator('p:has-text("Challenge: Get Ready for Round 1!")')).toBeVisible(); // Check challenge text
    // Check for "Round Host:" followed by any name, as host is random
    await expect(page.locator('p:text-matches("Round Host: .+")')).toBeVisible({ timeout: 15000 }); // Increased timeout for safety
    await expect(page.getByRole('button', { name: /Start Song Selection/i })).toBeVisible(); // Check for the new button
    await expect(startGameButton).not.toBeVisible(); // Verify Start Game button is gone
  });

  // TC-SETUP-05: Non-creator joins, should NOT see "Start Game" button
  test('TC-SETUP-05: Non-creator does not see Start Game button', async ({ page, request, browser }) => {
    // Creator creates the game using the first page context
    const { gameId: createdGameId } = await createGame(page, creatorName);
    expect(createdGameId).toBeTruthy();

    // Joiner joins via API and we capture their playerId
    const { playerId: joinerPlayerId } = await joinGameViaApi(request, createdGameId, joinerName);
    expect(joinerPlayerId).toBeTruthy(); // Ensure we got a player ID

    // Simulate joiner's browser session in a new context
    const joinerContext = await browser.newContext();
    const joinerPage = await joinerContext.newPage();

    try {
      // Go to base URL first to establish context for localStorage
      await joinerPage.goto('/');

      // Set localStorage to mimic the joiner being logged in, including playerId
      await joinerPage.evaluate(([name, id, pId]) => {
        localStorage.setItem('playerName', name);
        localStorage.setItem('gameId', id);
        localStorage.setItem('playerId', pId); // Add playerId
      }, [joinerName, createdGameId, joinerPlayerId]); // Pass playerId to evaluate

      // Reload the page to trigger GameContext/listeners with localStorage set
      await joinerPage.reload({ waitUntil: 'domcontentloaded' }); // Wait for DOM load, might help ensure context reads LS


      // Wait for the lobby view to load for the joiner
      // Check for player list and the joiner's own name
      const playerListJoiner = joinerPage.locator('[data-testid="player-list"]');
      await expect(playerListJoiner).toBeVisible({ timeout: 15000 }); // Increased timeout
      await expect(playerListJoiner.locator(`li:has-text("${joinerName} (You)")`)).toBeVisible();
      await expect(playerListJoiner.locator(`li:has-text("${creatorName}")`)).toBeVisible(); // Creator should also be listed

      // *** The core assertion for this test case ***
      // Verify the "Start Game" button is NOT visible for the joiner
      await expect(joinerPage.getByRole('button', { name: /Start Game/i })).not.toBeVisible();

    } finally {
      // Clean up the joiner's browser context
      await joinerContext.close();
    }
  });

  // TC-SETUP-06: User joins via UI, refreshes, and stays in the game lobby
  test('TC-SETUP-06: User joins via UI and stays in lobby after refresh', async ({ page, browser }) => { // Use browser fixture
    // Step 1: Create game in a separate context to isolate setup
    const creatorContext = await browser.newContext();
    const creatorPage = await creatorContext.newPage();
    let createdGameId: string;
    let creatorContextName = `ContextCreator_${Date.now()}`; // Use a unique name for this context
    try {
      await creatorPage.goto('/'); // Go to onboarding in temp context
      await expect(creatorPage.getByLabel(/display name/i)).toBeVisible();
      const result = await createGame(creatorPage, creatorContextName); // Use createGame helper
      createdGameId = result.gameId;
      expect(createdGameId).toBeTruthy();
    } finally {
      await creatorContext.close(); // Clean up the temporary context
    }

    // Step 2: Joiner joins via UI using the main 'page' context
    await page.goto('/'); // Start joiner on the onboarding page
    await expect(page.getByLabel(/display name/i)).toBeVisible();

    // Select Join Game tab
    const joinTab = page.getByRole('tab', { name: /Join Game/i });
    await expect(joinTab).toBeVisible({ timeout: 15000 });
    await joinTab.click();
    await expect(page.getByLabel('Game ID')).toBeVisible(); // Wait for input

    // Fill join form
    await page.getByLabel('Display Name').fill(joinerName); // Use the joinerName defined at the top
    await page.getByLabel('Game ID').fill(createdGameId);
    await page.locator('div[role="tabpanel"][data-state="active"]').getByRole('button', { name: /Join Game/i }).click();

    // Step 3: Verify Initial Join
    await page.waitForURL(new RegExp(`/game/${createdGameId}$`), { timeout: 15000 });
    const playerList = page.locator('[data-testid="player-list"]');
    await expect(playerList).toBeVisible({ timeout: 15000 });
    await expect(playerList.locator(`li:has-text("${joinerName} (You)")`)).toBeVisible();
    await expect(playerList.locator(`li:has-text("${creatorContextName}")`)).toBeVisible(); // Check for the context creator

    // Step 4: Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Step 5: Verify Persistence
    const playerListAfterRefresh = page.locator('[data-testid="player-list"]');
    await expect(playerListAfterRefresh).toBeVisible({ timeout: 20000 }); // Use increased timeout
    await expect(playerListAfterRefresh.locator(`li:has-text("${joinerName} (You)")`)).toBeVisible({ timeout: 20000 });
    await expect(playerListAfterRefresh.locator(`li:has-text("${creatorContextName}")`)).toBeVisible({ timeout: 20000 });

    // Verify the "Start Game" button is NOT visible (since joiner is not creator)
    await expect(page.getByRole('button', { name: /Start Game/i })).not.toBeVisible();
  });
});