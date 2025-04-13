import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { httpsCallable } from '@/lib/firebase'; // Import the function to mock
import logger from '@/lib/logger'; // Import the logger to mock/verify
import {
  joinGameService,
  createGameService,
  startGameService,
  exchangeSpotifyCodeService,
  GameJoinResponse, // Assuming this is exported or defined elsewhere if needed for assertions
  GenericSuccessResponse, // Assuming this is exported or defined elsewhere
  ExchangeCodePayload, // Assuming this is exported or defined elsewhere
} from './firebaseApi'; // Import the functions to test
import { FirebaseHttpsError } from '@/types/common'; // Import the error type

// --- Mocks ---

// Mock the httpsCallable function
vi.mock('@/lib/firebase', () => ({
  functions: {}, // Mock the functions object if needed, otherwise empty
  httpsCallable: vi.fn(),
}));

// Mock the logger (already done globally in test-utils, but explicit mock ensures clarity)
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// --- Test Suite ---

describe('firebaseApi Services', () => {
  let mockCallable: Mock; // To hold the mock function returned by httpsCallable

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup a default mock callable function for httpsCallable to return
    mockCallable = vi.fn();
    (httpsCallable as Mock).mockReturnValue(mockCallable);
  });

  // --- joinGameService ---
  describe('joinGameService', () => {
    const playerName = 'TestPlayer';
    const traceId = 'trace-join-123';
    const successResponse: GameJoinResponse = { success: true, gameId: 'game1', playerId: 'player1' };

    it('should call joinGame callable and return data on success', async () => {
      mockCallable.mockResolvedValue({ data: successResponse });

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game1', traceId })).resolves.toEqual(successResponse);

      expect(httpsCallable).toHaveBeenCalledWith({}, 'joinGame'); // Assuming empty functions object
      // Expect the callable to receive the full payload object
      expect(mockCallable).toHaveBeenCalledWith({
        playerName: 'TestPlayer',
        gameId: 'game1', // Matches the successResponse
        traceId: 'trace-join-123'
      });
      // Update logger expectation to include gameId (even if undefined initially in the log message)
      expect(logger.info).toHaveBeenCalledWith(`[${traceId}] Service: Attempting to join game (game1) as ${playerName}...`);
      expect(logger.debug).toHaveBeenCalledWith(`[${traceId}] Service: joinGame function result data:`, successResponse);
    });

    it('should throw error on backend failure (success: false)', async () => {
      const errorResponse = { success: false, error: 'Game full' };
      mockCallable.mockResolvedValue({ data: errorResponse });

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('Game full');
      // Update logger expectation to include gameId in the error message
      expect(logger.error).toHaveBeenCalledWith(
        `[${traceId}] Service: Error calling joinGame function (gameId: game123):`,
        expect.any(Error) // The service now throws an actual Error object
      );
      // Also check the specific error message logged before throwing
       expect(logger.error).toHaveBeenCalledWith(
         `[${traceId}] Service: joinGame function returned success=false:`,
         { data: errorResponse }
       );
    });

     it('should throw error on backend failure (success: false, no message)', async () => {
      const errorResponse = { success: false };
      mockCallable.mockResolvedValue({ data: errorResponse });

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('Join game function returned success: false');
       // Update logger expectation
       expect(logger.error).toHaveBeenCalledWith(
         `[${traceId}] Service: Error calling joinGame function (gameId: game123):`,
         expect.any(Error)
       );
       expect(logger.error).toHaveBeenCalledWith(
         `[${traceId}] Service: joinGame function returned success=false:`,
         { data: errorResponse }
       );
    });

    it('should throw error on unexpected response structure', async () => {
      const unexpectedResponse = { unexpected: true };
      mockCallable.mockResolvedValue({ data: unexpectedResponse });

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('Join game function returned unexpected data structure.');
    });

    it('should throw formatted error on FirebaseHttpsError', async () => {
      const httpsError: FirebaseHttpsError = { name: 'FirebaseError', code: 'unavailable', message: 'Function down' };
      mockCallable.mockRejectedValue(httpsError);

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('Error (unavailable): Function down');
      // Update logger expectation
      expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling joinGame function (gameId: game123):`, httpsError);
    });

     it('should throw formatted error on FirebaseHttpsError (no code)', async () => {
      const httpsError: FirebaseHttpsError = { name: 'FirebaseError', message: 'Function down' }; // code is optional
      mockCallable.mockRejectedValue(httpsError);

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('Error (unknown): Function down');
      // Update logger expectation
      expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling joinGame function (gameId: game123):`, httpsError);
    });

    it('should re-throw generic Error', async () => {
      const genericError = new Error('Network failed');
      mockCallable.mockRejectedValue(genericError);

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('Network failed');
      // Update logger expectation
      expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling joinGame function (gameId: game123):`, genericError);
    });

    it('should throw generic message for unknown error type', async () => {
      const unknownError = { some: 'object' };
      mockCallable.mockRejectedValue(unknownError);

      // Pass the payload object
      await expect(joinGameService({ playerName, gameId: 'game123', traceId })).rejects.toThrowError('An unknown error occurred during join game.');
      // Update logger expectation
      expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling joinGame function (gameId: game123):`, unknownError);
    });
  });

  // --- createGameService ---
  describe('createGameService', () => {
    const playerName = 'Creator';
    const traceId = 'trace-create-456';
    const successResponse: GameJoinResponse = { success: true, gameId: 'newGame', playerId: 'creatorId' };

    it('should call createGame callable and return data on success', async () => {
        mockCallable.mockResolvedValue({ data: successResponse });

        await expect(createGameService(playerName, traceId)).resolves.toEqual(successResponse);

        expect(httpsCallable).toHaveBeenCalledWith({}, 'createGame');
        expect(mockCallable).toHaveBeenCalledWith({ playerName, traceId });
        expect(logger.info).toHaveBeenCalledWith(`[${traceId}] Service: Attempting to create game as ${playerName}...`);
        expect(logger.debug).toHaveBeenCalledWith(`[${traceId}] Service: createGame function result data:`, successResponse);
    });

    it('should throw error on backend failure (success: false)', async () => {
        const errorResponse = { success: false, error: 'Creation failed' };
        mockCallable.mockResolvedValue({ data: errorResponse });

        await expect(createGameService(playerName, traceId)).rejects.toThrowError('Creation failed');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: createGame function returned success=false:`, { data: errorResponse });
    });

     it('should throw error on backend failure (success: false, no message)', async () => {
        const errorResponse = { success: false };
        mockCallable.mockResolvedValue({ data: errorResponse });

        await expect(createGameService(playerName, traceId)).rejects.toThrowError('Create game function returned success: false');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: createGame function returned success=false:`, { data: errorResponse });
    });


    it('should throw error on unexpected response structure', async () => {
        const unexpectedResponse = { unexpected: true };
        mockCallable.mockResolvedValue({ data: unexpectedResponse });

        await expect(createGameService(playerName, traceId)).rejects.toThrowError('Create game function returned unexpected data structure.');
    });

    it('should throw formatted error on FirebaseHttpsError', async () => {
        const httpsError: FirebaseHttpsError = { name: 'FirebaseError', code: 'internal', message: 'Server error' };
        mockCallable.mockRejectedValue(httpsError);

        await expect(createGameService(playerName, traceId)).rejects.toThrowError('Error (internal): Server error');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling createGame function:`, httpsError);
    });

    it('should re-throw generic Error', async () => {
        const genericError = new Error('Timeout');
        mockCallable.mockRejectedValue(genericError);

        await expect(createGameService(playerName, traceId)).rejects.toThrowError('Timeout');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling createGame function:`, genericError);
    });

     it('should throw generic message for unknown error type', async () => {
      const unknownError = 123; // Test with a non-object error
      mockCallable.mockRejectedValue(unknownError);

      await expect(createGameService(playerName, traceId)).rejects.toThrowError('An unknown error occurred during create game.');
      expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling createGame function:`, unknownError);
    });
  });

  // --- startGameService ---
  describe('startGameService', () => {
    const gameId = 'gameToStart';
    const traceId = 'trace-start-789';
    const successResponse: GenericSuccessResponse = { success: true, message: 'Game started' };

     it('should call startGame callable and return data on success', async () => {
        mockCallable.mockResolvedValue({ data: successResponse });

        await expect(startGameService(gameId, traceId)).resolves.toEqual(successResponse);

        expect(httpsCallable).toHaveBeenCalledWith({}, 'startGame');
        expect(mockCallable).toHaveBeenCalledWith({ gameId, traceId });
        expect(logger.info).toHaveBeenCalledWith(`[${traceId}] Service: Attempting to start game ${gameId}...`);
        expect(logger.debug).toHaveBeenCalledWith(`[${traceId}] Service: startGame function result data:`, successResponse);
    });

    it('should throw error on backend failure (success: false)', async () => {
        const errorResponse = { success: false, error: 'Not enough players' };
        mockCallable.mockResolvedValue({ data: errorResponse });

        await expect(startGameService(gameId, traceId)).rejects.toThrowError('Not enough players');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: startGame function returned success=false:`, { data: errorResponse });
    });

     it('should throw error on backend failure (success: false, no message)', async () => {
        const errorResponse = { success: false };
        mockCallable.mockResolvedValue({ data: errorResponse });

        await expect(startGameService(gameId, traceId)).rejects.toThrowError('Start game function returned success: false');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: startGame function returned success=false:`, { data: errorResponse });
    });

    it('should throw error on unexpected response structure', async () => {
        const unexpectedResponse = { status: 'ok' }; // Different structure
        mockCallable.mockResolvedValue({ data: unexpectedResponse });

        await expect(startGameService(gameId, traceId)).rejects.toThrowError('Start game function returned unexpected data structure.');
    });

    it('should throw formatted error on FirebaseHttpsError', async () => {
        const httpsError: FirebaseHttpsError = { name: 'FirebaseError', code: 'permission-denied', message: 'Unauthorized' };
        mockCallable.mockRejectedValue(httpsError);

        await expect(startGameService(gameId, traceId)).rejects.toThrowError('Error (permission-denied): Unauthorized');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling startGame function:`, httpsError);
    });

    it('should re-throw generic Error', async () => {
        const genericError = new Error('Request failed');
        mockCallable.mockRejectedValue(genericError);

        await expect(startGameService(gameId, traceId)).rejects.toThrowError('Request failed');
        expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling startGame function:`, genericError);
    });

     it('should throw generic message for unknown error type', async () => {
      const unknownError = null;
      mockCallable.mockRejectedValue(unknownError);

      await expect(startGameService(gameId, traceId)).rejects.toThrowError('An unknown error occurred during start game.');
      expect(logger.error).toHaveBeenCalledWith(`[${traceId}] Service: Error calling startGame function:`, unknownError);
    });
  });

  // --- exchangeSpotifyCodeService ---
  describe('exchangeSpotifyCodeService', () => {
    const payload: ExchangeCodePayload = {
        code: 'authCode123',
        codeVerifier: 'verifier456',
        redirectUri: 'http://localhost/callback',
        playerId: 'playerX',
        gameId: 'gameY',
        traceId: 'trace-spotify-abc'
    };
    const successResponse: GenericSuccessResponse = { success: true };

    it('should call exchangeSpotifyCode callable and return data on success', async () => {
        mockCallable.mockResolvedValue({ data: successResponse });

        await expect(exchangeSpotifyCodeService(payload)).resolves.toEqual(successResponse);

        expect(httpsCallable).toHaveBeenCalledWith({}, 'exchangeSpotifyCode');
        expect(mockCallable).toHaveBeenCalledWith(payload);
        expect(logger.info).toHaveBeenCalledWith(`[${payload.traceId}] Service: Attempting to exchange Spotify code...`);
        expect(logger.debug).toHaveBeenCalledWith(`[${payload.traceId}] Service: exchangeSpotifyCode function result data:`, successResponse);
    });

    it('should throw error on backend failure (success: false)', async () => {
        const errorResponse = { success: false, error: 'Invalid code' };
        mockCallable.mockResolvedValue({ data: errorResponse });

        await expect(exchangeSpotifyCodeService(payload)).rejects.toThrowError('Invalid code');
        expect(logger.error).toHaveBeenCalledWith(`[${payload.traceId}] Service: exchangeSpotifyCode function returned success=false:`, { data: errorResponse });
    });

     it('should throw error on backend failure (success: false, no message)', async () => {
        const errorResponse = { success: false };
        mockCallable.mockResolvedValue({ data: errorResponse });

        await expect(exchangeSpotifyCodeService(payload)).rejects.toThrowError('Spotify code exchange function returned success: false');
        expect(logger.error).toHaveBeenCalledWith(`[${payload.traceId}] Service: exchangeSpotifyCode function returned success=false:`, { data: errorResponse });
    });

    it('should throw error on unexpected response structure', async () => {
        const unexpectedResponse = {}; // Empty object
        mockCallable.mockResolvedValue({ data: unexpectedResponse });

        await expect(exchangeSpotifyCodeService(payload)).rejects.toThrowError('Spotify code exchange function returned unexpected data structure.');
    });

    it('should throw formatted error on FirebaseHttpsError', async () => {
        const httpsError: FirebaseHttpsError = { name: 'FirebaseError', code: 'unauthenticated', message: 'Missing token' };
        mockCallable.mockRejectedValue(httpsError);

        await expect(exchangeSpotifyCodeService(payload)).rejects.toThrowError('Error (unauthenticated): Missing token');
        expect(logger.error).toHaveBeenCalledWith(`[${payload.traceId}] Service: Error calling exchangeSpotifyCode function:`, httpsError);
    });

    it('should re-throw generic Error', async () => {
        const genericError = new Error('API limit reached');
        mockCallable.mockRejectedValue(genericError);

        await expect(exchangeSpotifyCodeService(payload)).rejects.toThrowError('API limit reached');
        expect(logger.error).toHaveBeenCalledWith(`[${payload.traceId}] Service: Error calling exchangeSpotifyCode function:`, genericError);
    });

     it('should throw generic message for unknown error type', async () => {
      const unknownError = undefined;
      mockCallable.mockRejectedValue(unknownError);

      await expect(exchangeSpotifyCodeService(payload)).rejects.toThrowError('An unknown error occurred during Spotify code exchange.');
      expect(logger.error).toHaveBeenCalledWith(`[${payload.traceId}] Service: Error calling exchangeSpotifyCode function:`, unknownError);
    });
  });
});