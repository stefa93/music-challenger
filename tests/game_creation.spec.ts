import { test, expect, type Page } from '@playwright/test';
import { createGame, joinGameViaApi, startGameViaApi } from './utils/gameUtils'; // Import helpers

// --- Tests ---

test.describe('Game Creation E2E Test', () => {
  const creatorName = `Creator_${Date.now()}`;

  // Note: clearFirestore is handled by globalSetup defined in playwright.config.ts

  test.beforeEach(async ({ page }) => {
    // Visit the app before each test
    await page.goto('/'); // baseURL is set in playwright.config.ts
    await expect(page.getByLabel(/display name/i)).toBeVisible(); // Updated label
  });

  test('TC-SETUP-01: User successfully creates a new game', async ({ page, request }) => { // Added request
    // Fill in name and click create
    // Use the imported helper function
    // Use the imported helper function - this waits for the game view to load and gameId to be present
    const { gameId } = await createGame(page, creatorName);
    expect(gameId).toBeTruthy(); // Verify gameId was extracted (or at least attempted)
    await joinGameViaApi(request, gameId, 'TestPlayer2'); // Add a second player
    await startGameViaApi(request, gameId); // Start the game
    // Explicitly wait for the Round 1 heading to appear, indicating listener update
    await expect(page.locator('h3:has-text("Round 1")')).toBeVisible({ timeout: 15000 });

    // Verify the creator's name is shown in the player list
    const playerList = page.locator('[data-testid="player-list"]'); // Use data-testid
    await expect(playerList).toBeVisible();
    await expect(playerList.locator(`li:has-text("${creatorName} (You)")`)).toBeVisible();

    // Verify the "Start Game" button is NO LONGER visible after starting
    // Note: The game status is now active (e.g., round1_selecting)
    await expect(page.getByRole('button', { name: /Start Game/i })).not.toBeVisible();

    // Verify the "Join Game" form is no longer visible (or is hidden/disabled)
    await expect(page.getByLabel(/display name/i)).not.toBeVisible(); // Updated label
    await expect(page.getByRole('button', { name: /Create Game/i })).not.toBeVisible();
  });

  test('TC-ERROR-04: Verify frontend input validation errors (placeholder)', async ({ page }) => {
    // Placeholder: Add test logic if name validation is implemented on create
    // Example:
    // await page.getByLabel(/display name/i).fill('A'); // Too short? // Updated label
    // await page.getByRole('button', { name: /Create Game/i }).click();
    // await expect(page.locator('text=/Name must be at least/i')).toBeVisible(); // Check for error message
    console.log('Placeholder: Test for name validation on creation');
  });

});