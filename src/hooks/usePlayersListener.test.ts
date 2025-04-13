import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { collection, onSnapshot, Unsubscribe, query, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { usePlayersListener } from './usePlayersListener';
import { Player } from '@/types/player'; // Import the type

// --- Mocks ---

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn((ref) => ref), // Mock query to just return the ref by default
    onSnapshot: vi.fn(),
  };
});

// Mock the db export from firebase lib
vi.mock('@/lib/firebase', () => ({
  db: {}, // Mock db object
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Helper to create mock Firestore document-like objects for the snapshot
const createMockDoc = (id: string, data: DocumentData): any => ({
  id,
  exists: () => true, // Assume exists for simplicity in mock creation
  data: () => data,
});

// --- Test Suite ---

describe('usePlayersListener Hook', () => {
  let mockCollectionRef: any;
  let mockUnsubscribe: Mock;
  // Variables to hold the latest callbacks passed to onSnapshot
  let lastSuccessCallback: ((snapshot: Partial<QuerySnapshot>) => void) | null = null;
  let lastErrorCallback: ((error: Error) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCollectionRef = { id: 'mockPlayersCollectionRef' };
    mockUnsubscribe = vi.fn();

    // Reset callback holders
    lastSuccessCallback = null;
    lastErrorCallback = null;

    // Mock implementation for onSnapshot captures the callbacks
    (onSnapshot as Mock).mockImplementation((ref, successCb, errorCb) => {
      lastSuccessCallback = successCb;
      lastErrorCallback = errorCb;
      return mockUnsubscribe;
    });

    (collection as Mock).mockReturnValue(mockCollectionRef);
    // Removed explicit onSnapshotCallback variable assignment
  });

  it('should return null, not loading, and no error when gameId is null', () => {
    const { result } = renderHook(() => usePlayersListener(null));
    expect(result.current).toEqual([null, false, null]);
    expect(collection).not.toHaveBeenCalled();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('should return loading state initially when gameId is provided', () => {
    const gameId = 'testGameId';
    const { result } = renderHook(() => usePlayersListener(gameId));

    expect(result.current).toEqual([null, true, null]);
    expect(collection).toHaveBeenCalledWith(db, 'games', gameId, 'players');
    expect(query).toHaveBeenCalledWith(mockCollectionRef); // query is called with the collection ref
    expect(onSnapshot).toHaveBeenCalledWith(mockCollectionRef, expect.any(Function), expect.any(Function)); // onSnapshot uses the result of query (which is mocked to return the ref itself)
    expect(logger.info).toHaveBeenCalledWith(`[usePlayersListener] Setting up listener for players in game: ${gameId}`);
  });

  it('should return players data and stop loading on successful snapshot', () => {
    const gameId = 'testGameId';
    const mockPlayerData1: Omit<Player, 'id'> = { name: 'Player 1', score: 10, hasJoined: true, joinedAt: {} as any, jokerAvailable: true };
    const mockPlayerData2: Omit<Player, 'id'> = { name: 'Player 2', score: 5, hasJoined: true, joinedAt: {} as any, jokerAvailable: false };
    const mockDocs = [
      createMockDoc('p1', mockPlayerData1),
      createMockDoc('p2', mockPlayerData2),
    ];
    const mockSnapshot = {
      forEach: (callback: (doc: any) => void) => mockDocs.forEach(callback),
      // Add other QuerySnapshot properties if needed by the hook (e.g., empty, size)
      empty: false,
      size: mockDocs.length,
    };

    const { result } = renderHook(() => usePlayersListener(gameId));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate successful snapshot
    act(() => {
      // Cast to any to bypass strict type check on mock object
      if (lastSuccessCallback) lastSuccessCallback(mockSnapshot as any);
    });

    const expectedPlayers = [
        { id: 'p1', ...mockPlayerData1 },
        { id: 'p2', ...mockPlayerData2 },
    ];
    expect(result.current).toEqual([expectedPlayers, false, null]);
    expect(logger.debug).toHaveBeenCalledWith(`[usePlayersListener Game ${gameId}] Players data updated:`, expectedPlayers);
    expect(logger.error).not.toHaveBeenCalled();
  });

   it('should return empty array and stop loading on successful snapshot with no players', () => {
    const gameId = 'testGameId';
    const mockDocs: any[] = []; // No documents
    const mockSnapshot = {
      forEach: (callback: (doc: any) => void) => mockDocs.forEach(callback),
      empty: true,
      size: 0,
    };

    const { result } = renderHook(() => usePlayersListener(gameId));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate successful snapshot
    act(() => {
      // Cast to any to bypass strict type check on mock object
      if (lastSuccessCallback) lastSuccessCallback(mockSnapshot as any);
    });

    expect(result.current).toEqual([[], false, null]); // Expect empty array
    expect(logger.debug).toHaveBeenCalledWith(`[usePlayersListener Game ${gameId}] Players data updated:`, []);
  });


  it('should return null data, error, and stop loading on listener error', () => {
    const gameId = 'errorGameId';
    const mockError = new Error('Firestore query failed');

    const { result } = renderHook(() => usePlayersListener(gameId));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate listener error
    act(() => {
      if (lastErrorCallback) lastErrorCallback(mockError);
    });

    expect(result.current).toEqual([null, false, 'Error listening to player updates.']);
    expect(logger.error).toHaveBeenCalledWith(`[usePlayersListener Game ${gameId}] Error listening to players collection:`, mockError);
  });

  it('should call unsubscribe on unmount', () => {
    const gameId = 'testGameId';
    const { unmount } = renderHook(() => usePlayersListener(gameId));

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[usePlayersListener] Cleaning up listener for players in game: ${gameId}`);
  });

  it('should unsubscribe and resubscribe when gameId changes', () => {
    const initialGameId = 'game1';
    const nextGameId = 'game2';
    const mockUnsubscribe1 = vi.fn();
    const mockUnsubscribe2 = vi.fn();

    (onSnapshot as Mock)
      .mockImplementationOnce(() => mockUnsubscribe1)
      .mockImplementationOnce(() => mockUnsubscribe2);

    const { rerender, unmount } = renderHook<void, { gameId: string | null }>(
      ({ gameId }) => usePlayersListener(gameId),
      { initialProps: { gameId: initialGameId } }
    );

    // Initial setup
    expect(collection).toHaveBeenCalledWith(db, 'games', initialGameId, 'players');
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    // Rerender with new gameId
    rerender({ gameId: nextGameId });

    // Check cleanup and new setup
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[usePlayersListener] Cleaning up listener for players in game: ${initialGameId}`);
    expect(collection).toHaveBeenCalledWith(db, 'games', nextGameId, 'players');
    expect(onSnapshot).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith(`[usePlayersListener] Setting up listener for players in game: ${nextGameId}`);

    // Unmount final listener
    unmount();
    expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[usePlayersListener] Cleaning up listener for players in game: ${nextGameId}`);
  });

   it('should handle changing gameId from valid to null', () => {
    const initialGameId = 'game1';
    const mockUnsubscribe1 = vi.fn();

    (onSnapshot as Mock).mockReturnValue(mockUnsubscribe1);

    const { result, rerender } = renderHook<void, { gameId: string | null }>(
      ({ gameId }) => usePlayersListener(gameId),
      { initialProps: { gameId: initialGameId } }
    );

    // Rerender with null gameId
    rerender({ gameId: null });

    // Check cleanup and final state
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[usePlayersListener] Cleaning up listener for players in game: ${initialGameId}`);
    expect(result.current).toEqual([null, false, null]); // Should reset state
    expect(onSnapshot).toHaveBeenCalledTimes(1); // No new listener
  });

});