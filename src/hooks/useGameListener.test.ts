import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { doc, onSnapshot, Unsubscribe, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { useGameListener } from './useGameListener';
import { Game } from '@/types/game'; // Import the type

// --- Mocks ---

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

// Mock the db export from firebase lib
vi.mock('@/lib/firebase', () => ({
  db: {}, // Mock db object
}));

// Mock the logger (already globally mocked, but explicit helps clarity)
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// --- Test Suite ---

describe('useGameListener Hook', () => {
  let mockDocRef: any;
  let mockUnsubscribe: Mock;
  // Variables to hold the latest callbacks passed to onSnapshot
  let lastSuccessCallback: ((snapshot: Partial<DocumentSnapshot>) => void) | null = null;
  let lastErrorCallback: ((error: Error) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDocRef = { id: 'mockDocRefId' }; // Simple mock object
    mockUnsubscribe = vi.fn();

    // Reset callback holders
    lastSuccessCallback = null;
    lastErrorCallback = null;

    // Mock implementation for onSnapshot captures the callbacks
    (onSnapshot as Mock).mockImplementation((ref, successCb, errorCb) => {
      lastSuccessCallback = successCb;
      lastErrorCallback = errorCb;
      return mockUnsubscribe;
    }); // <-- Added closing parenthesis and semicolon

    (doc as Mock).mockReturnValue(mockDocRef);
    // Removed the explicit onSnapshotCallback variable assignment
  });

  it('should return null, not loading, and no error when gameId is null', () => {
    const { result } = renderHook(() => useGameListener(null));
    expect(result.current).toEqual([null, false, null]);
    expect(doc).not.toHaveBeenCalled();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('should return loading state initially when gameId is provided', () => {
    const gameId = 'testGameId';
    const { result } = renderHook(() => useGameListener(gameId));

    expect(result.current).toEqual([null, true, null]);
    expect(doc).toHaveBeenCalledWith(db, 'games', gameId);
    expect(onSnapshot).toHaveBeenCalledWith(mockDocRef, expect.any(Function), expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith(`[useGameListener] Setting up listener for game: ${gameId}`);
  });

  it('should return game data and stop loading on successful snapshot with existing doc', () => {
    const gameId = 'testGameId';
    const mockGameData: Omit<Game, 'id'> = { status: 'waiting', creatorPlayerId: 'p1', currentRound: 0, challenge: '', createdAt: {} as any, totalRounds: 5, roundHostPlayerId: '' };
    const mockSnapshot = {
      exists: () => true,
      data: () => mockGameData,
      id: gameId,
    };

    const { result } = renderHook(() => useGameListener(gameId));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate successful snapshot
    act(() => {
      // Cast to any to bypass strict type check on mock object's 'exists' signature
      if (lastSuccessCallback) lastSuccessCallback(mockSnapshot as any);
    });

    expect(result.current).toEqual([{ id: gameId, ...mockGameData }, false, null]);
    expect(logger.debug).toHaveBeenCalledWith(`[useGameListener Game ${gameId}] Data received:`, { id: gameId, ...mockGameData });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null data, error, and stop loading when document does not exist', () => {
    const gameId = 'nonExistentId';
    const mockSnapshot = {
      exists: () => false,
      id: gameId,
    };

    const { result } = renderHook(() => useGameListener(gameId));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate snapshot where doc doesn't exist
    act(() => {
      // Cast to any to bypass strict type check on mock object's 'exists' signature
      if (lastSuccessCallback) lastSuccessCallback(mockSnapshot as any);
    });

    expect(result.current).toEqual([null, false, `Game ${gameId} not found.`]);
    expect(logger.warn).toHaveBeenCalledWith(`[useGameListener Game ${gameId}] Game document does not exist!`);
  });

  it('should return null data, error, and stop loading on listener error', () => {
    const gameId = 'errorGameId';
    const mockError = new Error('Permission denied');

    const { result } = renderHook(() => useGameListener(gameId));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate listener error
    act(() => {
      if (lastErrorCallback) lastErrorCallback(mockError);
    });

    expect(result.current).toEqual([null, false, 'Error listening to game updates.']);
    expect(logger.error).toHaveBeenCalledWith(`[useGameListener Game ${gameId}] Error listening to game document:`, mockError);
  });

  it('should call unsubscribe on unmount', () => {
    const gameId = 'testGameId';
    const { unmount } = renderHook(() => useGameListener(gameId));

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useGameListener] Cleaning up listener for game: ${gameId}`);
  });

  it('should unsubscribe and resubscribe when gameId changes', () => {
    const initialGameId = 'game1';
    const nextGameId = 'game2';
    const mockUnsubscribe1 = vi.fn();
    const mockUnsubscribe2 = vi.fn();

    // Setup onSnapshot to return different unsub functions based on call count
    (onSnapshot as Mock)
      .mockImplementationOnce((_, successCb, errorCb) => {
         (onSnapshot as any).mockSuccessCallback1 = successCb; // Store callbacks if needed
         (onSnapshot as any).mockErrorCallback1 = errorCb;
         return mockUnsubscribe1;
      })
      .mockImplementationOnce((_, successCb, errorCb) => {
         (onSnapshot as any).mockSuccessCallback2 = successCb;
         (onSnapshot as any).mockErrorCallback2 = errorCb;
         return mockUnsubscribe2;
      });


    const { rerender, unmount } = renderHook(
      ({ gameId }) => useGameListener(gameId),
      { initialProps: { gameId: initialGameId } }
    );

    // Initial setup
    expect(doc).toHaveBeenCalledWith(db, 'games', initialGameId);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe1).not.toHaveBeenCalled();
    expect(mockUnsubscribe2).not.toHaveBeenCalled();

    // Rerender with new gameId
    rerender({ gameId: nextGameId });

    // Check cleanup and new setup
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1); // Old listener cleaned up
    expect(logger.info).toHaveBeenCalledWith(`[useGameListener] Cleaning up listener for game: ${initialGameId}`);
    expect(doc).toHaveBeenCalledWith(db, 'games', nextGameId); // New doc ref
    expect(onSnapshot).toHaveBeenCalledTimes(2); // New listener attached
    expect(logger.info).toHaveBeenCalledWith(`[useGameListener] Setting up listener for game: ${nextGameId}`);
    expect(mockUnsubscribe2).not.toHaveBeenCalled();

    // Unmount final listener
    unmount();
    expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useGameListener] Cleaning up listener for game: ${nextGameId}`);
  });

   it('should handle changing gameId from valid to null', () => {
    const initialGameId = 'game1';
    const mockUnsubscribe1 = vi.fn();

    (onSnapshot as Mock).mockReturnValue(mockUnsubscribe1);

    const { result, rerender } = renderHook<void, { gameId: string | null }>(
      ({ gameId }) => useGameListener(gameId),
      { initialProps: { gameId: initialGameId } }
    );

    // Initial state check (optional)
    expect(result.current).toEqual([null, true, null]);

    // Rerender with null gameId
    rerender({ gameId: null });

    // Check cleanup and final state
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useGameListener] Cleaning up listener for game: ${initialGameId}`);
    expect(result.current).toEqual([null, false, null]); // Should reset state
    expect(onSnapshot).toHaveBeenCalledTimes(1); // No new listener
  });

});