import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { doc, onSnapshot, Unsubscribe, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { useRoundListener } from './useRoundListener';
import { Round } from '@/types/round'; // Import the type

// --- Mocks ---

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// --- Test Suite ---

describe('useRoundListener Hook', () => {
  let mockDocRef: any;
  let mockUnsubscribe: Mock;
  // Variables to hold the latest callbacks passed to onSnapshot
  let lastSuccessCallback: ((snapshot: Partial<DocumentSnapshot>) => void) | null = null;
  let lastErrorCallback: ((error: Error) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocRef = { id: 'mockRoundDocRefId' };
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

    (doc as Mock).mockReturnValue(mockDocRef);
    // Removed explicit onSnapshotCallback variable assignment
    // Removed line: (onSnapshot as Mock).mockImplementation(onSnapshotCallback);
  });

  // Test cases for invalid inputs
  it.each([
    [null, 1],
    ['game1', null],
    ['game1', undefined],
    ['game1', 0],
    ['game1', -1],
  ])('should return null, not loading, no error when gameId is %s or currentRound is %s', (gameId, currentRound) => {
    const { result } = renderHook(() => useRoundListener(gameId, currentRound));
    expect(result.current).toEqual([null, false, null]);
    expect(doc).not.toHaveBeenCalled();
    expect(onSnapshot).not.toHaveBeenCalled();
  });


  it('should return loading state initially when gameId and currentRound are valid', () => {
    const gameId = 'testGameId';
    const currentRound = 1;
    const roundPath = `games/${gameId}/rounds/${currentRound}`;
    const { result } = renderHook(() => useRoundListener(gameId, currentRound));

    expect(result.current).toEqual([null, true, null]); // Should be loading
    expect(doc).toHaveBeenCalledWith(db, roundPath);
    expect(onSnapshot).toHaveBeenCalledWith(mockDocRef, expect.any(Function), expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Setting up listener for round: ${roundPath}`);
  });

  it('should return round data and stop loading on successful snapshot with existing doc', () => {
    const gameId = 'testGameId';
    const currentRound = 1;
    const roundPath = `games/${gameId}/rounds/${currentRound}`;
    const mockRoundData: Round = { challenge: 'Test Challenge', hostPlayerId: 'p1', status: 'selecting', gameSongs: [], playerSongs: {} };
    const mockSnapshot = {
      exists: () => true,
      data: () => mockRoundData,
      id: String(currentRound), // Firestore doc id might be the round number as string
    };

    const { result } = renderHook(() => useRoundListener(gameId, currentRound));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate successful snapshot
    act(() => {
      // Cast to any to bypass strict type check on mock object's 'exists' signature
      if (lastSuccessCallback) lastSuccessCallback(mockSnapshot as any);
    });

    // Note: The hook doesn't add the id to the round data, it returns raw data
    expect(result.current).toEqual([mockRoundData, false, null]);
    expect(logger.debug).toHaveBeenCalledWith(`[useRoundListener ${roundPath}] Data received:`, mockRoundData);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null data, no error, and stop loading when document does not exist', () => {
    const gameId = 'testGameId';
    const currentRound = 2; // A round that might not exist yet
    const roundPath = `games/${gameId}/rounds/${currentRound}`;
    const mockSnapshot = {
      exists: () => false,
      id: String(currentRound),
    };

    const { result } = renderHook(() => useRoundListener(gameId, currentRound));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate snapshot where doc doesn't exist
    act(() => {
      // Cast to any to bypass strict type check on mock object's 'exists' signature
      if (lastSuccessCallback) lastSuccessCallback(mockSnapshot as any);
    });

    expect(result.current).toEqual([null, false, null]); // Expect null data, but no error
    expect(logger.warn).toHaveBeenCalledWith(`[useRoundListener ${roundPath}] Round document does not exist!`);
  });

  it('should return null data, error, and stop loading on listener error', () => {
    const gameId = 'errorGameId';
    const currentRound = 1;
    const roundPath = `games/${gameId}/rounds/${currentRound}`;
    const mockError = new Error('Permission denied on round');

    const { result } = renderHook(() => useRoundListener(gameId, currentRound));

    // Initial state
    expect(result.current).toEqual([null, true, null]);

    // Simulate listener error
    act(() => {
      if (lastErrorCallback) lastErrorCallback(mockError);
    });

    expect(result.current).toEqual([null, false, 'Error listening to round updates.']);
    expect(logger.error).toHaveBeenCalledWith(`[useRoundListener ${roundPath}] Error listening to round document:`, mockError);
  });

  it('should call unsubscribe on unmount', () => {
    const gameId = 'testGameId';
    const currentRound = 1;
    const roundPath = `games/${gameId}/rounds/${currentRound}`;
    const { unmount } = renderHook(() => useRoundListener(gameId, currentRound));

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Cleaning up listener for round: ${roundPath}`);
  });

  it('should unsubscribe and resubscribe when gameId changes', () => {
    const initialGameId = 'game1';
    const nextGameId = 'game2';
    const currentRound = 1;
    const roundPath1 = `games/${initialGameId}/rounds/${currentRound}`;
    const roundPath2 = `games/${nextGameId}/rounds/${currentRound}`;
    const mockUnsubscribe1 = vi.fn();
    const mockUnsubscribe2 = vi.fn();

    (onSnapshot as Mock)
      .mockImplementationOnce(() => mockUnsubscribe1)
      .mockImplementationOnce(() => mockUnsubscribe2);

    const { rerender, unmount } = renderHook<void, { gameId: string | null, currentRound: number | null | undefined }>(
      ({ gameId, currentRound }) => useRoundListener(gameId, currentRound),
      { initialProps: { gameId: initialGameId, currentRound } }
    );

    // Initial setup
    expect(doc).toHaveBeenCalledWith(db, roundPath1);
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    // Rerender with new gameId
    rerender({ gameId: nextGameId, currentRound });

    // Check cleanup and new setup
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Cleaning up listener for round: ${roundPath1}`);
    expect(doc).toHaveBeenCalledWith(db, roundPath2);
    expect(onSnapshot).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Setting up listener for round: ${roundPath2}`);

    // Unmount final listener
    unmount();
    expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Cleaning up listener for round: ${roundPath2}`);
  });

  it('should unsubscribe and resubscribe when currentRound changes', () => {
    const gameId = 'game1';
    const initialRound = 1;
    const nextRound = 2;
    const roundPath1 = `games/${gameId}/rounds/${initialRound}`;
    const roundPath2 = `games/${gameId}/rounds/${nextRound}`;
    const mockUnsubscribe1 = vi.fn();
    const mockUnsubscribe2 = vi.fn();

    (onSnapshot as Mock)
      .mockImplementationOnce(() => mockUnsubscribe1)
      .mockImplementationOnce(() => mockUnsubscribe2);

    const { rerender, unmount } = renderHook<void, { gameId: string | null, currentRound: number | null | undefined }>(
      ({ gameId, currentRound }) => useRoundListener(gameId, currentRound),
      { initialProps: { gameId, currentRound: initialRound } }
    );

    // Initial setup
    expect(doc).toHaveBeenCalledWith(db, roundPath1);
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    // Rerender with new round
    rerender({ gameId, currentRound: nextRound });

    // Check cleanup and new setup
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Cleaning up listener for round: ${roundPath1}`);
    expect(doc).toHaveBeenCalledWith(db, roundPath2);
    expect(onSnapshot).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Setting up listener for round: ${roundPath2}`);

    // Unmount final listener
    unmount();
    expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Cleaning up listener for round: ${roundPath2}`);
  });

   it('should handle changing currentRound from valid to null', () => {
    const gameId = 'game1';
    const initialRound = 1;
    const roundPath1 = `games/${gameId}/rounds/${initialRound}`;
    const mockUnsubscribe1 = vi.fn();

    (onSnapshot as Mock).mockReturnValue(mockUnsubscribe1);

    const { result, rerender } = renderHook<void, { gameId: string | null, currentRound: number | null | undefined }>(
      ({ gameId, currentRound }) => useRoundListener(gameId, currentRound),
      { initialProps: { gameId, currentRound: initialRound } }
    );

    // Rerender with null round
    rerender({ gameId, currentRound: null });

    // Check cleanup and final state
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(`[useRoundListener] Cleaning up listener for round: ${roundPath1}`);
    expect(result.current).toEqual([null, false, null]); // Should reset state
    expect(onSnapshot).toHaveBeenCalledTimes(1); // No new listener
  });

});