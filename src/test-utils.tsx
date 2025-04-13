import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { vi, Mock } from 'vitest';
import { Dispatch, SetStateAction } from 'react';
import { Timestamp } from 'firebase/firestore'; // Added for factories

// Import actual providers
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { GameProvider, useGameContext } from '@/contexts/GameContext';

// Import types used in contexts
import { Game } from '@/types/game';
import { Player } from '@/types/player';
import { Round } from '@/types/round';

// --- Mock Modules ---
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
  };
});

vi.mock('@/contexts/GameContext', async () => {
  const actual = await vi.importActual('@/contexts/GameContext');
  return {
    ...actual, // Use actual GameProvider
    useGameContext: vi.fn(), // Mock the hook
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual, // Use actual AuthProvider
    useAuthContext: vi.fn(), // Mock the hook
  };
});

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock only the specific services needed by components being tested
// Add more as needed
vi.mock('@/services/firebaseApi', () => ({
  joinGameService: vi.fn(),
  createGameService: vi.fn(),
  startGameService: vi.fn(),
  // Add other services used by tested components here
}));

// --- Context Types (Mirroring actual context shapes) ---
// Define the shape of the Game context data for mocking
interface MockGameContextType {
  gameId: string | null;
  setGameId: Mock<(value: SetStateAction<string | null>) => void>;
  playerId: string | null;
  setPlayerId: Mock<(value: SetStateAction<string | null>) => void>;
  gameData: Game | null;
  playersData: Player[] | null;
  roundData: Round | null;
  isLoading: boolean;
  setIsLoading: Mock<(value: SetStateAction<boolean>) => void>;
  error: string | null;
  setError: Mock<(value: SetStateAction<string | null>) => void>;
}

// Define the shape of the Auth context data for mocking
// Define the shape of the Auth context data for mocking, matching AuthContextProps
interface MockAuthContextType {
  spotifyAccessToken: string | null;
  isSpotifyLoading: boolean;
  spotifyAuthError: string | null; // Correct name
  initiateSpotifyLogin: Mock<() => Promise<void>>; // Matches actual signature
  handleSpotifyCallback: Mock<(authCode: string, verifier: string) => Promise<void>>; // Added missing function
}

// --- Default Mock Values ---
const defaultMockGameContextValue: MockGameContextType = {
  gameId: null,
  setGameId: vi.fn<(value: SetStateAction<string | null>) => void>(),
  playerId: null,
  setPlayerId: vi.fn<(value: SetStateAction<string | null>) => void>(),
  gameData: null,
  playersData: [],
  roundData: null,
  isLoading: false,
  setIsLoading: vi.fn<(value: SetStateAction<boolean>) => void>(),
  error: null,
  setError: vi.fn<(value: SetStateAction<string | null>) => void>(),
};

const defaultMockAuthContextValue: MockAuthContextType = {
  spotifyAccessToken: null,
  isSpotifyLoading: false,
  spotifyAuthError: null, // Correct name
  // Removed duplicate initiateSpotifyLogin
  initiateSpotifyLogin: vi.fn<() => Promise<void>>().mockResolvedValue(undefined), // Mock async function
  handleSpotifyCallback: vi.fn<(authCode: string, verifier: string) => Promise<void>>().mockResolvedValue(undefined), // Mock async function
};

// --- Mock Data Factories ---
export const createMockGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'mockGameId',
  status: 'waiting',
  creatorPlayerId: 'mockCreatorId',
  currentRound: 0,
  challenge: '',
  createdAt: Timestamp.now(),
  totalRounds: 5,
  roundHostPlayerId: '',
  ...overrides,
});

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'mockPlayerId',
  name: 'Mock Player',
  score: 0,
  hasJoined: true,
  joinedAt: Timestamp.now(),
  jokerAvailable: true,
  ...overrides,
});


// --- Extended Render Options ---
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  initialParams?: Record<string, string>;
  navigateMock?: Mock<(to: any, options?: any) => void>; // Correct Mock type signature
  initialGameContext?: Partial<MockGameContextType>;
  initialAuthContext?: Partial<MockAuthContextType>;
}

// --- Custom Render Function ---
const renderWithProviders = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {},
): RenderResult => {
  const {
    initialEntries = ['/'],
    initialParams = {},
    navigateMock = vi.fn(), // Default to a new mock if not provided
    initialGameContext = {},
    initialAuthContext = {},
    ...renderOptions
  } = options;

  // Combine defaults with provided initial context values
  const gameContextValue: MockGameContextType = {
    ...defaultMockGameContextValue,
    ...initialGameContext,
  };
  const authContextValue: MockAuthContextType = {
    ...defaultMockAuthContextValue,
    ...initialAuthContext,
  };

  // Configure mock return values *before* rendering
  vi.mocked(useNavigate).mockReturnValue(navigateMock); // Use provided or default mock
  vi.mocked(useParams).mockReturnValue(initialParams);
  vi.mocked(useGameContext).mockReturnValue(gameContextValue);
  // Ensure the mocked hook returns the correctly typed value
  vi.mocked(useAuthContext).mockReturnValue(authContextValue); // Type should match now


  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <GameProvider>{children}</GameProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  // Pass the wrapper and other options to RTL's render
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render };

// Optional: Export utility functions like userEvent if desired
export { default as userEvent } from '@testing-library/user-event';