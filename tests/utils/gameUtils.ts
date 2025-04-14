import { expect, type Page, type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * Creates a new game via the UI.
 * Assumes the page is already on the initial onboarding screen.
 * Waits for the onboarding view to disappear and game ID to be displayed before returning.
 * @param page The Playwright Page object.
 * @param name The name for the game creator.
 * @returns An object containing the created game ID.
 */
export async function createGame(page: Page, name: string): Promise<{ gameId: string }> {
  console.log(`Creating game for ${name} via UI...`);
  const nameInput = page.getByLabel(/display name/i); // Updated label text
  // Locate the button within the active tab panel
  const createButton = page.locator('div[role="tabpanel"][data-state="active"]').getByRole('button', { name: /Create Game/i });

  await nameInput.fill(name);
  // Assuming the create button becomes enabled or is always enabled
  await createButton.click();

  // Check if an error message appeared after clicking create
  const errorLocator = page.locator('p:has-text("Game Error:")');
  const isErrorVisible = await errorLocator.isVisible({ timeout: 1000 }); // Short timeout, error should appear quickly if it happens
  if (isErrorVisible) {
    const errorMessage = await errorLocator.textContent();
    throw new Error(`Game creation failed in UI: ${errorMessage}`);
  }

  // Wait for the onboarding form/button to disappear, indicating transition started
  // Wait for the button within the active tab panel to disappear
  await expect(createButton).not.toBeVisible({ timeout: 30000 }); // Increased timeout

  // Wait for the URL to change to the game page format
  // Use a regex that matches '/game/' followed by likely game ID characters (alphanumeric, maybe hyphens)
  await page.waitForURL(/\/game\/[a-zA-Z0-9-]+$/, { timeout: 15000 });

  // Extract the game ID from the URL
  const url = page.url();
  const gameIdMatch = url.match(/\/game\/([a-zA-Z0-9-]+)$/);
  const gameId = gameIdMatch ? gameIdMatch[1] : null;

  if (!gameId) {
    throw new Error('Could not extract game ID from the URL after game creation.');
  }

  // Now wait for a stable element on the GamePage to confirm rendering
  // Target the h3 containing "Game Active:"
  const gameHeaderLocator = page.locator('h3:has-text("Game Active:")');
  await expect(gameHeaderLocator).toBeVisible({ timeout: 10000 }); // Wait for the header now that URL is confirmed

  console.log(`Game created via UI with ID: ${gameId}`);
  // TODO: Potentially extract creator Player ID from UI/state if possible and add here
  return { gameId }; // Return object
}

/**
 * Joins an existing game using a direct API call to the backend function.
 * @param request The Playwright APIRequestContext object.
 * @param gameId The ID of the game to join.
 * @param name The name of the player joining.
 * @returns An object containing the API response and the joined player's ID.
 */
export async function joinGameViaApi(request: APIRequestContext, gameId: string, name: string): Promise<{ response: APIResponse; playerId: string }> {
  console.log(`Joining game ${gameId} as ${name} via API...`);
  // IMPORTANT: Adjust the endpoint URL '/functions/joinGame' based on your actual Cloud Function trigger URL
  // If using emulators, it might be http://localhost:5001/your-project-id/us-central1/joinGame or similar
  // For deployed functions, it will be the HTTPS URL.
  // Consider using environment variables for base URLs.
  const functionUrl = process.env.FIREBASE_FUNCTION_URL_JOIN || 'http://localhost:5001/dance-floor-ranking/us-central1/joinGame'; // Example emulator URL

  const response = await request.post(functionUrl, {
    // Playwright's 'data' is the request body.
    // Firebase 'onCall' expects arguments within an inner 'data' object in that body.
    data: {
      data: {
        gameId: gameId,
        playerName: name
      }
    }
  });

  if (!response.ok()) {
    console.error(`API Error joining game: ${response.status()} ${await response.text()}`);
    throw new Error(`Failed to join game via API: ${response.statusText()}`);
  }

  console.log(`API join game status: ${response.status()}`);
  // Parse the response to get the player ID
  // Assuming the callable function returns { result: { playerId: '...' } }
  let playerId: string;
  try {
    const responseBody = await response.json();
    // Firebase callable functions wrap the return value in a 'result' object
    if (responseBody && responseBody.result && responseBody.result.playerId) {
      playerId = responseBody.result.playerId;
      console.log(`Extracted player ID via API: ${playerId}`);
    } else {
      console.error("Could not find playerId in API response:", responseBody);
      throw new Error('Player ID not found in joinGameViaApi response.');
    }
  } catch (e) {
    console.error("Error parsing joinGameViaApi response:", e);
    throw new Error('Failed to parse player ID from joinGameViaApi response.');
  }

  return { response, playerId }; // Return object
}

/**
 * Starts an existing game using a direct API call to the backend function.
 * @param request The Playwright APIRequestContext object.
 * @param gameId The ID of the game to start.
 */
export async function startGameViaApi(request: APIRequestContext, gameId: string) {
    console.log(`Starting game ${gameId} via API...`);
    // IMPORTANT: Adjust the endpoint URL '/functions/startGame'
    const functionUrl = process.env.FIREBASE_FUNCTION_URL_START || 'http://localhost:5001/dance-floor-ranking/us-central1/startGame'; // Example emulator URL

    const response = await request.post(functionUrl, {
      // Playwright's 'data' is the request body.
      // Firebase 'onCall' expects arguments within an inner 'data' object in that body.
      data: {
        data: {
            gameId: gameId
        }
      }
    });

    if (!response.ok()) {
        console.error(`API Error starting game: ${response.status()} ${await response.text()}`);
        throw new Error(`Failed to start game via API: ${response.statusText()}`);
    }

    console.log(`API start game status: ${response.status()}`);
    return response;
}


/**
 * Nominates a song via the UI during the nomination phase.
 * @param page The Playwright Page object.
 * @param searchTerm The term to search the music provider with.
 * @param expectedSongName The full text of the song expected in the results list.
 */
export async function nominateSong(page: Page, searchTerm: string, expectedSongName: string) {
    console.log(`Nominating song via UI with search term "${searchTerm}"...`);

    // Ensure search input is visible
    const searchInput = page.getByPlaceholder(/Search Music/i); // Updated placeholder text
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill(searchTerm);

    // Click search button
    const searchButton = page.getByRole('button', { name: /Search/i });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();

    // Wait for the specific song result to appear in the list
    // Adjust locator based on how results are rendered (e.g., li, div, data-testid)
    const songResultLocator = page.locator(`li:has-text("${expectedSongName}")`);
    await expect(songResultLocator).toBeVisible({ timeout: 15000 }); // Increased timeout for API call

    // Find and click the nominate button within that specific result
    const nominateButton = songResultLocator.getByRole('button', { name: /Nominate/i });
    await expect(nominateButton).toBeEnabled();
    await nominateButton.click();

    // Verify nomination confirmation message appears
    await expect(page.locator(`text=/You nominated: ${expectedSongName}/i`)).toBeVisible({ timeout: 10000 });
    console.log(`Song "${expectedSongName}" nominated successfully via UI.`);
}

// --- NEW API HELPERS ---

/**
 * Nominates a song using a direct API call, supporting both search results and predefined tracks.
 * @param request The Playwright APIRequestContext object.
 * @param gameId The ID of the game.
 * @param playerId The ID of the player nominating.
 * @param nominationInput An object containing either `searchResult` (with trackId, name, artist, previewUrl) or `predefinedTrackId`.
 */
export async function nominateSongViaApi(request: APIRequestContext, gameId: string, playerId: string, nominationInput: { searchResult: { trackId: string; name: string; artist: string; previewUrl?: string; } } | { predefinedTrackId: string }) {
  const logDetails = 'searchResult' in nominationInput ? nominationInput.searchResult.name : `Predefined ID: ${nominationInput.predefinedTrackId}`;
  console.log(`Nominating song "${logDetails}" for player ${playerId} in game ${gameId} via API...`);
  const functionUrl = process.env.FIREBASE_FUNCTION_URL_NOMINATE || 'http://localhost:5001/dance-floor-ranking/us-central1/submitSongNomination';

  const response = await request.post(functionUrl, {
    data: {
      data: {
        gameId: gameId,
        playerId: playerId,
        nominationPayload: nominationInput // Pass the structured payload
      }
    }
  });

  if (!response.ok()) {
    console.error(`API Error nominating song: ${response.status()} ${await response.text()}`);
    throw new Error(`Failed to nominate song via API: ${response.statusText()}`);
  }

  console.log(`API nominate song status: ${response.status()}`);
  return response;
}

/**
 * Submits player rankings using a direct API call.
 * @param request The Playwright APIRequestContext object.
 * @param gameId The ID of the game.
 * @param playerId The ID of the player submitting rankings.
 * @param rankings An object mapping opponent player IDs to their rank (e.g., { 'opponentPlayerId1': 1, 'opponentPlayerId2': 2 }).
 */
export async function submitRankingViaApi(request: APIRequestContext, gameId: string, playerId: string, rankings: { [songPlayerId: string]: number }) {
  console.log(`Submitting rankings for player ${playerId} in game ${gameId} via API...`, rankings);
  const functionUrl = process.env.FIREBASE_FUNCTION_URL_RANKING || 'http://localhost:5001/dance-floor-ranking/us-central1/submitRanking';

  const response = await request.post(functionUrl, {
    data: {
      data: {
        gameId: gameId,
        playerId: playerId,
        rankings: rankings
      }
    }
  });

  if (!response.ok()) {
    console.error(`API Error submitting rankings: ${response.status()} ${await response.text()}`);
    throw new Error(`Failed to submit rankings via API: ${response.statusText()}`);
  }

  console.log(`API submit ranking status: ${response.status()}`);
  return response;
}

/**
 * Triggers score calculation for a round using a direct API call.
 * @param request The Playwright APIRequestContext object.
 * @param gameId The ID of the game.
 * @param roundNumber The round number to calculate scores for.
 */
export async function calculateScoresViaApi(request: APIRequestContext, gameId: string, roundNumber: number) {
  console.log(`Calculating scores for round ${roundNumber} in game ${gameId} via API...`);
  const functionUrl = process.env.FIREBASE_FUNCTION_URL_CALCULATE || 'http://localhost:5001/dance-floor-ranking/us-central1/calculateScores';

  const response = await request.post(functionUrl, {
    data: {
      data: {
        gameId: gameId,
        roundNumber: roundNumber
      }
    }
  });

  if (!response.ok()) {
    console.error(`API Error calculating scores: ${response.status()} ${await response.text()}`);
    throw new Error(`Failed to calculate scores via API: ${response.statusText()}`);
  }

  console.log(`API calculate scores status: ${response.status()}`);
  return response;
}

/**
 * Starts the next round using a direct API call.
 * Note: Assumes the backend function 'startNextRound' exists and handles the logic.
 * @param request The Playwright APIRequestContext object.
 * @param gameId The ID of the game.
 */
export async function startNextRoundViaApi(request: APIRequestContext, gameId: string) {
  console.log(`Starting next round for game ${gameId} via API...`);
  const functionUrl = process.env.FIREBASE_FUNCTION_URL_NEXT_ROUND || 'http://localhost:5001/dance-floor-ranking/us-central1/startNextRound';

  const response = await request.post(functionUrl, {
    data: {
      data: {
        gameId: gameId
      }
    }
  });

  // Note: The 'startNextRound' function might not be fully implemented yet.
  // Adjust error handling if needed based on actual function behavior.
  if (!response.ok()) {
    console.error(`API Error starting next round: ${response.status()} ${await response.text()}`);
    throw new Error(`Failed to start next round via API: ${response.statusText()}`);
  }

  console.log(`API start next round status: ${response.status()}`);
  return response;
}