import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import * as gameData from '../src/data/gameData';
import * as playerData from '../src/data/playerData';
import * as roundData from '../src/data/roundData';
import { db } from '../src/data/firestoreClient'; // Needed for transaction mock
import { startNextRoundService, startSelectionPhaseService } from '../src/services/roundService';
import { GameStatus } from '../src/types/game';
import { RoundStatus } from '../src/types/round';

// Mock Firestore dependencies
vi.mock('../src/data/firestoreClient', () => ({
  db: {
    runTransaction: vi.fn(async (updateFunction) => {
      // Simulate transaction execution by calling the update function
      // The mock transaction object can be simple for these tests
      const mockTransaction = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      await updateFunction(mockTransaction);
      // We might need to return values based on what updateFunction does if needed
    }),
  },
}));

vi.mock('../src/data/gameData');
vi.mock('../src/data/playerData');
vi.mock('../src/data/roundData');

// Mock logger to prevent errors during tests
vi.mock('firebase-functions/logger', () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
}));


describe('Round Service Tests', () => {
  const gameId = 'testGame123';
  const traceId = 'testTraceId';
  const player1Id = 'player1';
  const player2Id = 'player2';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset transaction mock specifically if needed
    (db.runTransaction as any).mockImplementation(async (updateFunction: any) => {
        const mockTransaction = { get: vi.fn(), set: vi.fn(), update: vi.fn(), delete: vi.fn() };
        await updateFunction(mockTransaction);
    });
  });

  // --- Tests for startNextRoundService ---
  describe('startNextRoundService', () => {
    it('should transition game and round status to _announcing', async () => {
      const currentRoundNumber = 1;
      const nextRoundNumber = 2;
      const mockGame = {
        id: gameId,
        status: `round${currentRoundNumber}_finished` as GameStatus,
        currentRound: currentRoundNumber,
        totalRounds: 3,
        roundHostPlayerId: player1Id,
        // other necessary fields...
      };
      const mockPlayers = {
        docs: [
          { id: player1Id, data: () => ({ name: 'Player 1' }) },
          { id: player2Id, data: () => ({ name: 'Player 2' }) },
        ],
        size: 2,
      };

      // Mock DAL function return values
      vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
      vi.mocked(playerData.getAllPlayers).mockResolvedValue(mockPlayers as any);

      await startNextRoundService(gameId, traceId);

      // Verify game update includes the announcing status
      expect(gameData.updateGameDetails).toHaveBeenCalledWith(
        gameId,
        expect.objectContaining({
          status: `round${nextRoundNumber}_announcing`,
          currentRound: nextRoundNumber,
          // other fields like host, challenge...
        }),
        expect.anything(), // Transaction object
        traceId
      );

      // Verify new round creation includes the announcing status
      expect(roundData.createRoundDocument).toHaveBeenCalledWith(
        gameId,
        nextRoundNumber,
        expect.objectContaining({
          status: 'announcing',
          // other fields like host, challenge...
        }),
        expect.anything(), // Transaction object
        traceId
      );
    });

    it('should throw error if game is not in a finished round state', async () => {
       const mockGame = { id: gameId, status: 'round1_scoring' as GameStatus, currentRound: 1, totalRounds: 3 };
       vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
       vi.mocked(playerData.getAllPlayers).mockResolvedValue({ docs: [], size: 0 } as any); // Mock players to avoid unrelated errors

       await expect(startNextRoundService(gameId, traceId))
         .rejects.toThrow(new HttpsError("failed-precondition", `Game is not in a finished round state (current: ${mockGame.status}). Cannot start next round.`));
    });

     it('should throw error if game is already on the final round', async () => {
       const mockGame = { id: gameId, status: 'round3_finished' as GameStatus, currentRound: 3, totalRounds: 3 };
       vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
       vi.mocked(playerData.getAllPlayers).mockResolvedValue({ docs: [], size: 0 } as any);

       await expect(startNextRoundService(gameId, traceId))
         .rejects.toThrow(new HttpsError("failed-precondition", `Game has already reached the final round (3/3). Cannot start next round.`));
     });
  });

  // --- Tests for startSelectionPhaseService ---
  describe('startSelectionPhaseService', () => {
    it('should transition game and round status from _announcing to _selecting', async () => {
        const currentRoundNumber = 2;
        const mockGame = {
            id: gameId,
            status: `round${currentRoundNumber}_announcing` as GameStatus,
            currentRound: currentRoundNumber,
            totalRounds: 3,
            roundHostPlayerId: player2Id, // Example host
            // other necessary fields...
        };
        const mockRound = {
            roundNumber: currentRoundNumber,
            status: 'announcing' as RoundStatus,
            // other necessary fields...
        };

        vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
        vi.mocked(roundData.getRoundByNumber).mockResolvedValue(mockRound as any);

        await startSelectionPhaseService(gameId, traceId);

        // Verify game update transitions to selecting status
        expect(gameData.updateGameDetails).toHaveBeenCalledWith(
            gameId,
            { status: `round${currentRoundNumber}_selecting` },
            expect.anything(), // Transaction object
            traceId
        );

        // Verify round update transitions to selecting_songs status
        expect(roundData.updateRoundDetails).toHaveBeenCalledWith(
            gameId,
            currentRoundNumber,
            { status: 'selecting_songs' },
            expect.anything(), // Transaction object
            traceId
        );
    });

    it('should throw error if game is not in an announcing state', async () => {
        const currentRoundNumber = 2;
        const mockGame = { id: gameId, status: 'round2_selecting' as GameStatus, currentRound: currentRoundNumber };
        const mockRound = { roundNumber: currentRoundNumber, status: 'selecting_songs' as RoundStatus };

        vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
        vi.mocked(roundData.getRoundByNumber).mockResolvedValue(mockRound as any);

        await expect(startSelectionPhaseService(gameId, traceId))
            .rejects.toThrow(new HttpsError("failed-precondition", `Game is not in an announcing phase (current: ${mockGame.status}). Cannot start selection.`));
    });

     it('should throw error if round is not in announcing state', async () => {
        const currentRoundNumber = 2;
        const mockGame = { id: gameId, status: 'round2_announcing' as GameStatus, currentRound: currentRoundNumber };
        const mockRound = { roundNumber: currentRoundNumber, status: 'selecting_songs' as RoundStatus }; // Mismatched round status

        vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
        vi.mocked(roundData.getRoundByNumber).mockResolvedValue(mockRound as any);

        await expect(startSelectionPhaseService(gameId, traceId))
            .rejects.toThrow(new HttpsError("failed-precondition", `Round ${currentRoundNumber} is not in the announcing phase (current: ${mockRound.status}).`));
     });

     // TODO: Add test for authorization check if implemented (e.g., only host can trigger)
  });

});