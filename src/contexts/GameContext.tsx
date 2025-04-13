import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react'; // Added useEffect
import { Game } from '@/types/game';
import { Player } from '@/types/player';
import { Round } from '@/types/round';
// Import listener hooks
import { useGameListener } from '@/hooks/useGameListener';
import { usePlayersListener } from '@/hooks/usePlayersListener';
import { useRoundListener } from '@/hooks/useRoundListener';

// Define the shape of the context data
interface GameContextProps {
  gameId: string | null;
  setGameId: Dispatch<SetStateAction<string | null>>;
  playerId: string | null;
  setPlayerId: Dispatch<SetStateAction<string | null>>;
  gameData: Game | null;
  // Remove setters for data coming from listeners
  // setGameData: Dispatch<SetStateAction<Game | null>>;
  playersData: Player[] | null;
  // setPlayersData: Dispatch<SetStateAction<Player[] | null>>;
  roundData: Round | null;
  // setRoundData: Dispatch<SetStateAction<Round | null>>;
  isLoading: boolean; // Combined loading state
  setIsLoading: Dispatch<SetStateAction<boolean>>; // Expose setter for API calls etc.
  error: string | null; // Combined error state (listeners + API?)
  setError: Dispatch<SetStateAction<string | null>>; // Expose setter for API calls etc.
  // Add other relevant state and functions later (e.g., API call functions)
}

// Create the context with a default value (can be undefined or null, handle appropriately)
const GameContext = createContext<GameContextProps | undefined>(undefined);

// Create the provider component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Local state for IDs set by user actions
  const [gameId, setGameId] = useState<string | null>(null); // Initialize with null
  const [playerId, setPlayerId] = useState<string | null>(null); // Initialize with null

  // Effect to read from localStorage on initial mount
  useEffect(() => {
    const storedGameId = localStorage.getItem('gameId');
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedGameId) {
      setGameId(storedGameId);
    }
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
    // This effect should only run once on mount
  }, []); // Empty dependency array ensures it runs only once

  // Effect to write to localStorage when IDs change
  useEffect(() => {
    if (gameId) {
      localStorage.setItem('gameId', gameId);
    } else {
      localStorage.removeItem('gameId'); // Handle case where gameId becomes null
    }

    if (playerId) {
      localStorage.setItem('playerId', playerId);
    } else {
      localStorage.removeItem('playerId'); // Handle case where playerId becomes null
    }
    // This effect runs whenever gameId or playerId state changes
  }, [gameId, playerId]);

  // Use listener hooks
  const [gameData, isGameLoading, gameError] = useGameListener(gameId);
  const [playersData, arePlayersLoading, playersError] = usePlayersListener(gameId);
  // Pass gameData?.currentRound to useRoundListener
  const [roundData, isRoundLoading, roundError] = useRoundListener(gameId, gameData?.currentRound);

  // Effect to handle game not found errors reported by the listener
  useEffect(() => {
    // Check if there's a gameError AND we still have a gameId set
    if (gameError && gameId) {
      // Basic check for 'not found' in the error message.
      // This might need refinement based on the exact error format from useGameListener.
      const isNotFoundError = gameError.toLowerCase().includes('not found') ||
                              gameError.toLowerCase().includes('does not exist');

      if (isNotFoundError) {
        console.warn(`[GameContext] Stored gameId ${gameId} is invalid (Error: ${gameError}). Clearing session state and localStorage.`);
        // Clear state. The other useEffect will handle localStorage removal.
        setGameId(null);
        setPlayerId(null);
        // We might want to clear the specific gameError here too,
        // but the combined error state logic below will handle it for now.
      }
    }
    // Re-run this effect if the gameError or gameId changes.
  }, [gameError, gameId]); // Added gameId dependency


  // Combine loading states (add more sources later if needed, e.g., API call loading)
  // Removed unused variable: const isLoading = isGameLoading || arePlayersLoading || isRoundLoading;


  // Combine loading states (add more sources later if needed, e.g., API call loading)
  // Removed unused variable: const isLoading = isGameLoading || arePlayersLoading || isRoundLoading;

  // Combine error states (prioritize or concatenate as needed)
  // Keep separate state for API/action errors vs listener errors
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Combine listener errors
  const listenerError = gameError || playersError || roundError;
  // Combine loading states
  const isListenerLoading = isGameLoading || arePlayersLoading || isRoundLoading;

  // Determine overall loading/error state exposed by context
  const combinedIsLoading = isListenerLoading || isActionLoading; // Renamed variable
  const error = actionError || listenerError; // Prioritize action errors? Or show both? For now, prioritize action error.


  // TODO: Add state and setters for API call loading/errors if needed separately
  // Expose setters for action loading/error
  const setIsLoading = setIsActionLoading;
  const setError = setActionError;

  const value = {
    gameId,
    setGameId,
    playerId,
    setPlayerId,
    gameData,
    // gameData comes from hook
    playersData, // comes from hook
    // setPlayersData,
    roundData, // comes from hook
    // setRoundData,
    isLoading: combinedIsLoading, // Use the renamed variable
    setIsLoading, // Expose the action loading setter
    error, // combined error state
    setError, // Expose the action error setter
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};