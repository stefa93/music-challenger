// src/pages/OnboardingPage.test.tsx (Refactored)
import React from 'react';
// Import custom render, screen, act, userEvent from test-utils
import { render, screen, act, userEvent } from '@/test-utils';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import OnboardingPage from './OnboardingPage';
import * as firebaseApi from '@/services/firebaseApi';
import logger from '@/lib/logger';
import MockOnboarding from '@/components/Onboarding/Onboarding'; // Updated import path

// Mock the specific child component used by this page
// Mock the Onboarding component to accept onSubmit and simulate form submission
vi.mock('@/components/Onboarding/Onboarding', () => ({ // Updated mock path
  default: vi.fn(({ onSubmit, isLoading, error }) => (
    <div data-testid="mock-onboarding">
      {/* Simulate the form structure needed to trigger onSubmit */}
      <button
        onClick={() => onSubmit({ action: 'create', displayName: 'Test Player Create', gameId: '' })} // gameId not needed for create
        disabled={isLoading}
      >
        Create Game Button
      </button>
      <button
        onClick={() => onSubmit({ action: 'join', displayName: 'Test Player Join', gameId: 'testGameId' })} // Provide a dummy gameId for join
        disabled={isLoading}
      >
        Join Game Button
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )),
}));

// Note: Mocks for router, contexts, logger, firebaseApi are now handled by test-utils.tsx

describe('OnboardingPage', () => {
  beforeEach(() => {
    // Reset all mocks provided by Vitest and test-utils
    vi.clearAllMocks();
    // Also clear mocks specific to this test file if needed (e.g., component mocks)
    vi.mocked(MockOnboarding).mockClear();
    // Clear specific API mocks if necessary (though clearAllMocks should cover vi.fn())
    vi.mocked(firebaseApi.joinGameService).mockClear();
    vi.mocked(firebaseApi.createGameService).mockClear();
  });

  it('renders the Onboarding component and passes handlers', () => {
    render(<OnboardingPage />); // Use custom render
    const mockOnboardingElement = screen.getByTestId('mock-onboarding');
    expect(mockOnboardingElement).toBeInTheDocument();

    // Check if the handlers are passed as props
    expect(MockOnboarding).toHaveBeenCalled();
    // Check if the onSubmit handler is passed
    expect(MockOnboarding).toHaveBeenCalled();
    const props = vi.mocked(MockOnboarding).mock.calls[0][0];
    expect(props.onSubmit).toBeInstanceOf(Function);
    // Check other props if needed
    expect(props).toHaveProperty('isLoading');
    expect(props).toHaveProperty('error');
  });

  describe('handleJoinGame', () => {
    it('calls joinGameService, updates context on success, and does not navigate', async () => {
      const joinResponse = { gameId: 'game123', playerId: 'playerABC' };
      (firebaseApi.joinGameService as Mock).mockResolvedValue(joinResponse);

      // Define mocks needed for this specific test's assertions
      const mockSetGameId = vi.fn();
      const mockSetPlayerId = vi.fn();
      const mockSetIsLoading = vi.fn();
      const mockSetError = vi.fn();
      const mockNavigate = vi.fn();

      render(<OnboardingPage />, {
        initialGameContext: {
          setGameId: mockSetGameId,
          setPlayerId: mockSetPlayerId,
          setIsLoading: mockSetIsLoading,
          setError: mockSetError,
        },
        navigateMock: mockNavigate, // Pass the navigation mock
      });

      // Simulate clicking the join button in the mocked Onboarding component
      // Use userEvent for better simulation if needed, but screen.getByText works here
      await act(async () => {
         // Simulate clicking the join button in the *new* mocked Onboarding component
         screen.getByText('Join Game Button').click();
      });


      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      // Expect joinGameService to be called with the payload object
      expect(firebaseApi.joinGameService).toHaveBeenCalledWith({
        playerName: 'Test Player Join',
        gameId: 'testGameId', // Matches the dummy gameId in the mock's onClick
        traceId: expect.stringContaining('trace_join_'),
      });
      expect(mockSetGameId).toHaveBeenCalledWith(joinResponse.gameId);
      expect(mockSetPlayerId).toHaveBeenCalledWith(joinResponse.playerId);
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/\[trace_join_\d+\] OnboardingPage: Joining game testGameId as Test Player Join\.\.\./));
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/\[trace_join_\d+\] OnboardingPage: Join successful/), joinResponse);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
      expect(mockSetError).toHaveBeenCalledTimes(1); // Only the initial null call
    });

    it('calls joinGameService, sets error on failure, and does not navigate', async () => {
      const error = new Error('Failed to join');
      (firebaseApi.joinGameService as Mock).mockRejectedValue(error);

      const mockSetGameId = vi.fn();
      const mockSetPlayerId = vi.fn();
      const mockSetIsLoading = vi.fn();
      const mockSetError = vi.fn();
      const mockNavigate = vi.fn();

      render(<OnboardingPage />, {
        initialGameContext: {
          setGameId: mockSetGameId,
          setPlayerId: mockSetPlayerId,
          setIsLoading: mockSetIsLoading,
          setError: mockSetError,
        },
        navigateMock: mockNavigate,
      });

      await act(async () => {
        // Simulate clicking the join button in the *new* mocked Onboarding component
        screen.getByText('Join Game Button').click();
      });

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      // Expect joinGameService to be called with the payload object
      expect(firebaseApi.joinGameService).toHaveBeenCalledWith({
        playerName: 'Test Player Join',
        gameId: 'testGameId',
        traceId: expect.stringContaining('trace_join_'),
      });
      expect(mockSetGameId).not.toHaveBeenCalled();
      expect(mockSetPlayerId).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('OnboardingPage: Error caught during join:'), error);
      expect(mockSetError).toHaveBeenCalledWith('Failed to join');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
      expect(mockSetError).toHaveBeenCalledTimes(2); // null + error message
    });

     it('handles non-Error objects during join failure', async () => {
      const error = 'Something went wrong';
      (firebaseApi.joinGameService as Mock).mockRejectedValue(error);

      const mockSetIsLoading = vi.fn();
      const mockSetError = vi.fn();
      const mockNavigate = vi.fn();

      render(<OnboardingPage />, {
        initialGameContext: {
          setIsLoading: mockSetIsLoading,
          setError: mockSetError,
        },
         navigateMock: mockNavigate,
      });

      await act(async () => {
        // Simulate clicking the join button in the *new* mocked Onboarding component
        screen.getByText('Join Game Button').click();
      });

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      // Expect joinGameService to be called with the payload object
      expect(firebaseApi.joinGameService).toHaveBeenCalledWith({
        playerName: 'Test Player Join',
        gameId: 'testGameId',
        traceId: expect.stringContaining('trace_join_'),
      });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('OnboardingPage: Error caught during join:'), error);
      expect(mockSetError).toHaveBeenNthCalledWith(1, null);
      expect(mockSetError).toHaveBeenNthCalledWith(2,'Failed to join game.'); // Default message
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateGame', () => {
    it('calls createGameService, updates context, and navigates on success', async () => {
      const createResponse = { gameId: 'newGame456', playerId: 'playerXYZ' };
      (firebaseApi.createGameService as Mock).mockResolvedValue(createResponse);

      const mockSetGameId = vi.fn();
      const mockSetPlayerId = vi.fn();
      const mockSetIsLoading = vi.fn();
      const mockSetError = vi.fn();
      const mockNavigate = vi.fn();

      render(<OnboardingPage />, {
        initialGameContext: {
          setGameId: mockSetGameId,
          setPlayerId: mockSetPlayerId,
          setIsLoading: mockSetIsLoading,
          setError: mockSetError,
        },
        navigateMock: mockNavigate,
      });

      await act(async () => {
        // Simulate clicking the create button in the *new* mocked Onboarding component
        screen.getByText('Create Game Button').click();
      });

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      // Expect createGameService to be called with the payload object (playerName, traceId)
      expect(firebaseApi.createGameService).toHaveBeenCalledWith(
         'Test Player Create', // createGameService still takes playerName directly based on firebaseApi.ts
         expect.stringContaining('trace_create_')
      );
      expect(mockSetGameId).toHaveBeenCalledWith(createResponse.gameId);
      expect(mockSetPlayerId).toHaveBeenCalledWith(createResponse.playerId);
      // Logger call remains the same
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/\[trace_create_\d+\] OnboardingPage: Creating game as Test Player Create\.\.\./));
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/\[trace_create_\d+\] OnboardingPage: Create successful/), createResponse);
      expect(logger.debug).toHaveBeenCalledWith(expect.stringMatching(/\[trace_create_\d+\] OnboardingPage: Response from createGameService:/), JSON.stringify(createResponse));
      expect(logger.debug).toHaveBeenCalledWith(expect.stringMatching(/\[trace_create_\d+\] OnboardingPage: Navigating to \/game\/newGame456/));
      expect(mockNavigate).toHaveBeenCalledWith(`/game/${createResponse.gameId}`);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
      expect(mockSetError).toHaveBeenCalledTimes(1); // Only the initial null call
    });

    it('calls createGameService, sets error on failure, and does not navigate', async () => {
      const error = new Error('Failed to create');
      (firebaseApi.createGameService as Mock).mockRejectedValue(error);

      const mockSetGameId = vi.fn();
      const mockSetPlayerId = vi.fn();
      const mockSetIsLoading = vi.fn();
      const mockSetError = vi.fn();
      const mockNavigate = vi.fn();

      render(<OnboardingPage />, {
        initialGameContext: {
          setGameId: mockSetGameId,
          setPlayerId: mockSetPlayerId,
          setIsLoading: mockSetIsLoading,
          setError: mockSetError,
        },
        navigateMock: mockNavigate,
      });

      await act(async () => {
        // Simulate clicking the create button in the *new* mocked Onboarding component
        screen.getByText('Create Game Button').click();
      });

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      // Expect createGameService to be called with the payload object (playerName, traceId)
      expect(firebaseApi.createGameService).toHaveBeenCalledWith(
        'Test Player Create',
        expect.stringContaining('trace_create_')
      );
      expect(mockSetGameId).not.toHaveBeenCalled();
      expect(mockSetPlayerId).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('OnboardingPage: Error caught during create:'), error);
      expect(mockSetError).toHaveBeenCalledWith('Failed to create');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
      expect(mockSetError).toHaveBeenCalledTimes(2); // null + error message
    });

     it('handles non-Error objects during create failure', async () => {
      const error = { message: 'Network issue' }; // Example non-Error object
      (firebaseApi.createGameService as Mock).mockRejectedValue(error);

      const mockSetIsLoading = vi.fn();
      const mockSetError = vi.fn();
      const mockNavigate = vi.fn();

      render(<OnboardingPage />, {
        initialGameContext: {
          setIsLoading: mockSetIsLoading,
          setError: mockSetError,
        },
        navigateMock: mockNavigate,
      });

      await act(async () => {
        // Simulate clicking the create button in the *new* mocked Onboarding component
        screen.getByText('Create Game Button').click();
      });

      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      // Expect createGameService to be called with the payload object (playerName, traceId)
      expect(firebaseApi.createGameService).toHaveBeenCalledWith(
        'Test Player Create',
        expect.stringContaining('trace_create_')
      );
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('OnboardingPage: Error caught during create:'), error);
      expect(mockSetError).toHaveBeenNthCalledWith(1, null);
      expect(mockSetError).toHaveBeenNthCalledWith(2, 'Failed to create game.'); // Default message
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});