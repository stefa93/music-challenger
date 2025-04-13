import { test, expect, type Page } from '@playwright/test';
import { createGame, joinGameViaApi, startGameViaApi, nominateSongViaApi } from './utils/gameUtils'; // Assuming these API helpers exist or are adapted

/**
 * Waits for the game status display to show a specific phase.
 * @param page The Playwright Page object.
 * @param expectedPhase The expected game phase string or regex (e.g., 'round1_selecting', /_ranking/i).
 * @param timeout Max time to wait in milliseconds.
 */
async function waitForRoundPhase(page: Page, expectedPhase: string | RegExp, timeout = 30000) {
    console.log(`Waiting for game phase: ${expectedPhase}`);
    // Use a locator that targets the status paragraph and check its text content
    const statusParagraph = page.locator('p:has-text("Status:")');
    await expect(statusParagraph).toContainText(expectedPhase instanceof RegExp ? expectedPhase : `Status: ${expectedPhase}`, { timeout });
    console.log(`Game phase reached: ${await statusParagraph.textContent()}`);
}

/**
 * Nominates a song using the simple text input UI.
 * Assumes the input and button are visible.
 * @param page The Playwright Page object.
 * @param songTitle The title to enter.
 */
async function nominateSongViaTextInput(page: Page, songTitle: string) {
    console.log(`Nominating song "${songTitle}" via text input UI...`);
    const input = page.locator('#songNomination'); // Use the ID added in GameView
    const button = page.getByRole('button', { name: /Submit Song/i });

    // Wait for input to be visible before interacting
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill(songTitle);
    await expect(button).toBeEnabled(); // Ensure button is enabled after filling input
    await button.click();
    console.log(`Attempted nomination for "${songTitle}" via text input UI.`);
}


// Increase default test timeout for potentially slow backend operations
test.slow();

test.describe('Gameplay Error Handling', () => {

  // Test case TC-ERROR-05 removed as per user request. Needs refinement.


  // TODO: Add TC-ERROR-01 test here (ranking outside ranking phase) following a similar pattern.

});