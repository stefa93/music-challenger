import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { createGame } from './utils/gameUtils'; // Import the helper

test.describe('Game Joining Scenarios', () => {
  let creatorContext: BrowserContext;
  let creatorPage: Page;
  let gameId: string;
  const creatorName = 'GameCreator';
  const joinerName = 'GameJoiner';

  // Create a game once before running the joining tests
  test.beforeAll(async ({ browser }) => {
    creatorContext = await browser.newContext();
    creatorPage = await creatorContext.newPage();
    await creatorPage.goto('/');
    const gameData = await createGame(creatorPage, creatorName);
    gameId = gameData.gameId;
    // Keep creator page open to maintain the game session
  });

  // Close the creator context after all tests in this describe block are done
  test.afterAll(async () => {
    await creatorContext.close();
  });

  // Navigate the main test page (joiner) to the base URL before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-SETUP-02: User successfully joins an existing game via UI', async ({ page }) => {
    console.log(`Attempting to join game ${gameId} as ${joinerName} via UI...`);

    // Ensure the onboarding screen is visible
    await expect(page.getByRole('heading', { name: /Welcome to Songer!/i })).toBeVisible();

    // Click the "Join Game" tab
    await page.getByRole('tab', { name: /Join Game/i }).click();

    // Get the active tab panel for joining
    const joinTabPanel = page.locator('div[role="tabpanel"][data-state="active"]');
    await expect(joinTabPanel).toBeVisible(); // Ensure the correct panel is active

    // Fill in the joiner's name
    const nameInput = page.getByLabel(/display name/i); // Corrected: Input is outside the tab panel
    await nameInput.fill(joinerName);

    // Fill in the game ID
    const gameIdInput = joinTabPanel.getByLabel(/game id/i);
    await gameIdInput.fill(gameId);

    // Click the "Join Game" button within the active panel
    const joinButton = joinTabPanel.getByRole('button', { name: /Join Game/i });
    await expect(joinButton).toBeEnabled(); // Check if button is enabled before clicking
    await joinButton.click();

    // Wait for navigation to the game lobby URL
    await page.waitForURL(`**/game/${gameId}`, { timeout: 15000 });
    console.log(`Successfully navigated to game lobby: ${page.url()}`);

    // Verify the player list is visible (indicating lobby loaded)
    const playerList = page.locator('[data-testid="player-list"]'); // Use data-testid from GameView.tsx
    await expect(playerList).toBeVisible({ timeout: 10000 }); // Increase timeout slightly for data loading

    // Verify both creator and joiner names are in the player list
    await expect(playerList).toContainText(creatorName); // No extra timeout needed now list is visible
    await expect(playerList).toContainText(joinerName);

    console.log(`Successfully joined game ${gameId} as ${joinerName}. Both players visible in lobby.`);
  });

  // Add other joining-related tests here later if needed
});