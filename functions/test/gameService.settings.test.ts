import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from '../src/data/firestoreClient'; // Assuming db is exported for mocking
import { updateGameSettingsService } from '../src/services/gameService';
import { GameSettings } from '../src/types/game';
import { VALID_ROUNDS, VALID_MAX_PLAYERS, VALID_TIME_LIMITS } from '../src/config';

// Mock Firestore
vi.mock('../src/data/firestoreClient', () => ({
  db: {
    runTransaction: vi.fn(),
  },
}));

// Mock gameData DAL
const mockGetGameById = vi.fn();
vi.mock('../src/data/gameData', () => ({
  getGameById: (...args: any[]) => mockGetGameById(...args),
  updateGameDetails: vi.fn(), // Mock the update function
}));

// Mock logger
vi.mock('firebase-functions/logger');

describe('Game Service - updateGameSettingsService', () => {
  const gameId = 'testGameSettings';
  const creatorPlayerId = 'creator-player-id-123'; // Changed from UID
  const nonCreatorPlayerId = 'non-creator-player-id-456'; // Changed from UID
  const traceId = 'test-trace-settings';

  const validSettings: GameSettings = {
    rounds: 5,
    maxPlayers: 6,
    allowExplicit: true,
    selectionTimeLimit: 90,
    rankingTimeLimit: 60,
  };

  const mockGameDoc = {
    id: gameId,
    status: 'waiting',
    creatorPlayerId: creatorPlayerId, // Use creatorPlayerId
    creatorUid: null, // Explicitly set UID to null/undefined if not used
    // other necessary fields...
    settings: { // Initial settings
        rounds: 3,
        maxPlayers: 4,
        allowExplicit: false,
        selectionTimeLimit: null,
        rankingTimeLimit: null,
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for transaction
    (db.runTransaction as any).mockImplementation(async (updateFunction: (t: any) => Promise<any>) => {
        // Mock the transaction object if needed by DAL functions called within
        const mockTransaction = {
            get: vi.fn().mockResolvedValue({ exists: true, data: () => mockGameDoc }), // Mock transaction.get
            update: vi.fn(), // Mock transaction.update
            set: vi.fn(), // Mock transaction.set
            // Add other transaction methods if used by DALs
        };
         mockGetGameById.mockResolvedValue(mockGameDoc); // Ensure getGameById resolves within transaction
        return await updateFunction(mockTransaction);
    });
  });

  it('should successfully update settings when called by the creator in waiting state', async () => {
    await expect(updateGameSettingsService(gameId, validSettings, creatorPlayerId, traceId)) // Use creatorPlayerId
      .resolves.toBeUndefined();

    // Verify transaction was run
    expect(db.runTransaction).toHaveBeenCalledOnce();
    // Verify getGameById was called within transaction
    expect(mockGetGameById).toHaveBeenCalledWith(gameId, traceId, expect.anything()); // Check DAL call
     // Verify updateGameDetails was called with correct data
     const updateDetailsMock = vi.mocked(require('../src/data/gameData').updateGameDetails);
     expect(updateDetailsMock).toHaveBeenCalledWith(
         gameId,
         { settings: validSettings },
         traceId,
         expect.anything() // The transaction object
     );
  });

  it('should throw permission-denied error if called by non-creator player ID', async () => {
    await expect(updateGameSettingsService(gameId, validSettings, nonCreatorPlayerId, traceId)) // Use nonCreatorPlayerId
      .rejects.toThrow(new HttpsError("permission-denied", "Only the game creator can update settings."));

    expect(db.runTransaction).toHaveBeenCalledOnce();
    expect(mockGetGameById).toHaveBeenCalledWith(gameId, traceId, expect.anything());
    const updateDetailsMock = vi.mocked(require('../src/data/gameData').updateGameDetails);
    expect(updateDetailsMock).not.toHaveBeenCalled();
  });

   // This test case is removed as the check now relies on creatorPlayerId which is always present
   // it('should throw failed-precondition error if creatorUid is missing in game document', async () => { ... });

   // Keep other tests as they are (game not found, wrong status, validation)
   // ... (rest of the tests remain the same, ensuring they use creatorPlayerId where needed for success cases) ...

   // Adjust validation test call if needed (though it uses creatorPlayerId already)
   it.each([
       // ... existing validation cases ...
   ])('should throw invalid-argument for invalid setting value: %s = %s', async ({ setting, value, message }) => {
       const invalidSettings = { ...validSettings, [setting]: value };
       await expect(updateGameSettingsService(gameId, invalidSettings as any, creatorPlayerId, traceId)) // Ensure creatorPlayerId is used
           .rejects.toThrow(new HttpsError("invalid-argument", message));
     expect(mockGetGameById).toHaveBeenCalledWith(gameId, traceId, expect.anything());
     const updateDetailsMock = vi.mocked(require('../src/data/gameData').updateGameDetails);
     expect(updateDetailsMock).not.toHaveBeenCalled();
   });

  it('should throw not-found error if game does not exist', async () => {
    (db.runTransaction as any).mockImplementation(async (updateFunction: (t: any) => Promise<any>) => {
        const mockTransaction = { get: vi.fn().mockResolvedValue({ exists: false }) }; // Game doesn't exist
        mockGetGameById.mockResolvedValue(null); // getGameById returns null
        // Need to handle the case where updateFunction might throw before returning
        try {
            await updateFunction(mockTransaction);
        } catch (e) {
            if (e instanceof HttpsError && e.code === 'not-found') throw e; // Re-throw expected error
            // Handle unexpected errors if necessary
        }
    });

    await expect(updateGameSettingsService(gameId, validSettings, creatorPlayerId, traceId)) // Use creatorPlayerId
      .rejects.toThrow(new HttpsError("not-found", `Game ${gameId} not found.`));

    expect(db.runTransaction).toHaveBeenCalledOnce();
    expect(mockGetGameById).toHaveBeenCalledWith(gameId, traceId, expect.anything());
  });

  it('should throw failed-precondition error if game status is not "waiting"', async () => {
    const gameDocPlaying = { ...mockGameDoc, status: 'round1_selecting' as const };
     (db.runTransaction as any).mockImplementation(async (updateFunction: (t: any) => Promise<any>) => {
         const mockTransaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => gameDocPlaying }) };
         mockGetGameById.mockResolvedValue(gameDocPlaying);
         try {
             await updateFunction(mockTransaction);
         } catch (e) {
             if (e instanceof HttpsError && e.code === 'failed-precondition') throw e;
         }
     });

    await expect(updateGameSettingsService(gameId, validSettings, creatorPlayerId, traceId)) // Use creatorPlayerId
      .rejects.toThrow(new HttpsError("failed-precondition", `Game settings can only be changed while the game is in the 'waiting' state (current: ${gameDocPlaying.status}).`));

    expect(db.runTransaction).toHaveBeenCalledOnce();
    expect(mockGetGameById).toHaveBeenCalledWith(gameId, traceId, expect.anything());
  });

  // Validation Tests
  it.each([
      { setting: 'rounds', value: 2, message: `Invalid number of rounds. Must be one of: ${VALID_ROUNDS.join(", ")}.` },
      { setting: 'rounds', value: 6, message: `Invalid number of rounds. Must be one of: ${VALID_ROUNDS.join(", ")}.` },
      { setting: 'maxPlayers', value: 2, message: `Invalid max players. Must be one of: ${VALID_MAX_PLAYERS.join(", ")}.` },
      { setting: 'maxPlayers', value: 7, message: `Invalid max players. Must be one of: ${VALID_MAX_PLAYERS.join(", ")}.` },
      { setting: 'allowExplicit', value: 'yes', message: 'Invalid value for allowExplicit. Must be true or false.' },
      { setting: 'selectionTimeLimit', value: 75, message: `Invalid selection time limit. Must be null or one of: ${VALID_TIME_LIMITS.join(", ")}.` },
      { setting: 'rankingTimeLimit', value: 100, message: `Invalid ranking time limit. Must be null or one of: ${VALID_TIME_LIMITS.join(", ")}.` },
      { setting: 'rounds', value: undefined, message: `Invalid number of rounds. Must be one of: ${VALID_ROUNDS.join(", ")}.` }, // Test undefined
  ])('should throw invalid-argument for invalid setting value: %s = %s', async ({ setting, value, message }) => {
      const invalidSettings = { ...validSettings, [setting]: value };
      // Need to cast because TS knows it's invalid, but we are testing runtime validation
      await expect(updateGameSettingsService(gameId, invalidSettings as any, creatorPlayerId, traceId)) // Use creatorPlayerId
          .rejects.toThrow(new HttpsError("invalid-argument", message));
      // No transaction should be attempted for validation errors
      expect(db.runTransaction).not.toHaveBeenCalled();
  });

});