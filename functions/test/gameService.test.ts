import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import * as gameData from '../src/data/gameData';
import * as playerData from '../src/data/playerData';
import * as roundData from '../src/data/roundData';
import { db } from '../src/data/firestoreClient'; // Needed for transaction mock
import { createGameService, startGameService } from '../src/services/gameService';
import { startNextRoundService } from '../src/services/roundService'; // Import from roundService
import { GameStatus, GameSettings } from '../src/types/game';
import { MIN_PLAYERS_TO_START } from '../src/config';

// Mock Firestore dependencies
vi.mock('../src/data/firestoreClient', () => ({
  db: {
    runTransaction: vi.fn(async (updateFunction) => {
      const mockTransaction = { get: vi.fn(), set: vi.fn(), update: vi.fn(), delete: vi.fn() };
      // Simulate transaction execution
      await updateFunction(mockTransaction);
    }),
  },
}));

vi.mock('../src/data/gameData');
vi.mock('../src/data/playerData');
vi.mock('../src/data/roundData');

// Mock logger
vi.mock('firebase-functions/logger', () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
}));

describe('Game Service Tests', () => {
  const gameId = 'testGameStart123';
  const traceId = 'testTraceIdStart';
  const player1Id = 'player1Start';
  const player2Id = 'player2Start';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset transaction mock
    (db.runTransaction as any).mockImplementation(async (updateFunction: any) => {
        const mockTransaction = { get: vi.fn(), set: vi.fn(), update: vi.fn(), delete: vi.fn() };
        await updateFunction(mockTransaction);
    });
  });

  // --- Tests for startGameService ---
  describe('startGameService', () => {
    it('should transition game status to round1_announcing and round status to announcing', async () => {
      const mockGame = {
        id: gameId,
        status: 'waiting' as GameStatus,
        currentRound: 0,
        totalRounds: 3,
        creatorPlayerId: player1Id,
        // other necessary fields...
      };
      const mockPlayers = {
        docs: [
          { id: player1Id, data: () => ({ name: 'Player 1' }) },
          { id: player2Id, data: () => ({ name: 'Player 2' }) },
        ],
        size: 2, // Meets MIN_PLAYERS_TO_START
      };

      // Mock DAL function return values
      vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
      vi.mocked(playerData.getAllPlayers).mockResolvedValue(mockPlayers as any);

      await startGameService(gameId, traceId);

      // Verify game update includes the announcing status for round 1
      expect(gameData.updateGameDetails).toHaveBeenCalledWith(
        gameId,
        expect.objectContaining({
          status: 'round1_announcing', // Check for the correct status
          currentRound: 1,
          // other fields like host, challenge, startedAt...
        }),
        expect.anything(), // Transaction object
        traceId
      );

      // Verify new round 1 creation includes the announcing status
      expect(roundData.createRoundDocument).toHaveBeenCalledWith(
        gameId,
        1, // Round number 1
        expect.objectContaining({
          status: 'announcing', // Check for the correct status
          // other fields like host, challenge...
        }),
        expect.anything(), // Transaction object
        traceId
      );
    });

    it('should throw error if game is not in waiting state', async () => {
       const mockGame = { id: gameId, status: 'round1_announcing' as GameStatus, currentRound: 1 };
       vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
       vi.mocked(playerData.getAllPlayers).mockResolvedValue({ docs: [], size: 0 } as any);

       await expect(startGameService(gameId, traceId))
         .rejects.toThrow(new HttpsError("failed-precondition", `Game ${gameId} is not in the 'waiting' state (current: ${mockGame.status}).`));
    });

    it('should throw error if not enough players have joined', async () => {
       const mockGame = { id: gameId, status: 'waiting' as GameStatus, currentRound: 0 };
       const mockPlayers = { docs: [{ id: player1Id }], size: 1 }; // Only 1 player
       vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
       vi.mocked(playerData.getAllPlayers).mockResolvedValue(mockPlayers as any);

       await expect(startGameService(gameId, traceId))
         .rejects.toThrow(new HttpsError("failed-precondition", `Cannot start game ${gameId}. Need at least ${MIN_PLAYERS_TO_START} players (currently 1).`));
    });

    // TODO: Add test for creator check if implemented
  });

  // --- Tests for createGameService (Optional - Not directly modified but good practice) ---
  // describe('createGameService', () => {
  //   // Add tests for createGameService if needed
  // });

  // --- Tests for startNextRoundService ---
  // Moved inside the main describe block to access shared variables
  describe('startNextRoundService', () => {
    const defaultSettings: GameSettings = { // Define default settings for tests
        rounds: 3, // Example total rounds
        maxPlayers: 6,
        allowExplicit: true,
        selectionTimeLimit: 90,
        rankingTimeLimit: 60,
    };

    it('should start the next round correctly if not the final round', async () => {
        const currentRound = 1;
        const mockGame = {
            id: gameId, // Use gameId from outer scope
            status: `round${currentRound}_finished` as GameStatus,
            currentRound: currentRound,
            totalRounds: defaultSettings.rounds, // Use settings value
            settings: defaultSettings,
            roundHostPlayerId: player1Id, // Use player1Id from outer scope
            // other necessary fields...
        };
        const mockPlayers = {
            docs: [
                { id: player1Id, data: () => ({ name: 'Player 1' }) }, // Use player1Id
                { id: player2Id, data: () => ({ name: 'Player 2' }) }, // Use player2Id
            ],
            size: 2,
        };

        vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
        vi.mocked(playerData.getAllPlayers).mockResolvedValue(mockPlayers as any);

        await startNextRoundService(gameId, traceId); // Use gameId, traceId

        // Verify game update includes the announcing status for the next round
        expect(gameData.updateGameDetails).toHaveBeenCalledWith(
            gameId, // Use gameId
            expect.objectContaining({
                status: `round${currentRound + 1}_announcing`,
                currentRound: currentRound + 1,
                // other fields like host, challenge...
            }),
            traceId, // Use traceId
            expect.anything() // Transaction object
        );

        // Verify new round document creation
        expect(roundData.createRoundDocument).toHaveBeenCalledWith(
            gameId, // Use gameId
            currentRound + 1, // Next round number
            expect.objectContaining({
                status: 'announcing',
                // other fields like host, challenge...
            }),
            expect.anything(), // Transaction object
            traceId // Use traceId
        );
    });

    it('should set game status to finished if the current round is the final round', async () => {
        const currentRound = 3; // This is the final round based on defaultSettings
        const mockGame = {
            id: gameId, // Use gameId
            status: `round${currentRound}_finished` as GameStatus,
            currentRound: currentRound,
            totalRounds: defaultSettings.rounds, // Use settings value
            settings: defaultSettings,
            roundHostPlayerId: player1Id, // Use player1Id
            // other necessary fields...
        };
         const mockPlayers = { docs: [], size: 0 }; // Player data not strictly needed for this check

        vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
        vi.mocked(playerData.getAllPlayers).mockResolvedValue(mockPlayers as any); // Mock to avoid errors

        await startNextRoundService(gameId, traceId); // Use gameId, traceId

        // Verify game update sets status to finished
        expect(gameData.updateGameDetails).toHaveBeenCalledWith(
            gameId, // Use gameId
            expect.objectContaining({
                status: 'finished',
            }),
            traceId, // Use traceId
            expect.anything() // Transaction object
        );

        // Verify new round document was NOT created
        expect(roundData.createRoundDocument).not.toHaveBeenCalled();
    });

     it('should throw error if game status is not *_finished', async () => {
        const mockGame = { id: gameId, status: 'round1_scoring' as GameStatus, currentRound: 1, totalRounds: 3, settings: defaultSettings }; // Use gameId
        vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
        vi.mocked(playerData.getAllPlayers).mockResolvedValue({ docs: [], size: 0 } as any);

        await expect(startNextRoundService(gameId, traceId)) // Use gameId, traceId
          .rejects.toThrow(new HttpsError("failed-precondition", `Game is not in a finished round state (current: ${mockGame.status}). Cannot start next round.`));
     });

     it('should throw error if settings are missing', async () => {
         const mockGame = { id: gameId, status: 'round1_finished' as GameStatus, currentRound: 1, totalRounds: 3, settings: undefined }; // Missing settings, use gameId
         vi.mocked(gameData.getGameById).mockResolvedValue(mockGame as any);
         vi.mocked(playerData.getAllPlayers).mockResolvedValue({ docs: [], size: 0 } as any);

         await expect(startNextRoundService(gameId, traceId)) // Use gameId, traceId
           .rejects.toThrow(new HttpsError("internal", "Game configuration error (missing rounds)."));
      });

  }); // End of startNextRoundService describe block
}); // End of main describe block