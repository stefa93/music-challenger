import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameContext } from '@/contexts/GameContext';
import { useAuthContext } from '@/contexts/AuthContext';
import GameView from '@/components/GameView/GameView'; // Updated import path
import { Button } from "@/components/ui/button";
import logger from '@/lib/logger';
import { startGameService } from '@/services/firebaseApi';

const GamePage: React.FC = () => {
  const { gameIdParam: paramGameId } = useParams<{ gameIdParam: string }>(); // Get gameIdParam from URL param
  const navigate = useNavigate();
  const {
    gameId, setGameId,
    playerId, // setPlayerId removed as it's not currently used here
    gameData,
    playersData,
    roundData,
    isLoading, setIsLoading,
    error, setError
  } = useGameContext();
  // Removed Spotify-related values from useAuthContext as they are no longer provided
  const { /* spotifyAccessToken, initiateSpotifyLogin, isSpotifyLoading: isAuthLoading */ } = useAuthContext();

  // Effect to initialize gameId in context from URL param on mount if context is null
  useEffect(() => {
    // If we have a gameId from the URL AND the context gameId is currently null,
    // set the context gameId. This prevents overriding a later nullification by the context itself.
    if (paramGameId && gameId === null) {
      logger.info(`[GamePage] Initializing gameId from URL param: ${paramGameId}`);
      setGameId(paramGameId);
      // TODO: Potentially clear other game state or fetch player ID if joining existing game
    }
    // This effect should primarily react to the URL parameter changing,
    // or run once on mount if gameId starts as null.
    // Removing gameId from dependencies prevents re-running when context invalidates the gameId.
  }, [paramGameId, setGameId]); // Removed gameId and navigate

  // The redirection logic previously here is now handled globally in App.tsx

  // Function to handle starting the game (now local to this page)
  const handleStartGame = async () => {
    const traceId = `trace_start_${Date.now()}`;
    if (!gameId) {
      logger.error(`[${traceId}] GamePage: Cannot start game: No game ID in context.`);
      setError("Cannot start game: No game ID."); // Use context error setter
      return;
    }
    logger.info(`[${traceId}] GamePage: Attempting to start game ${gameId}...`);
    setIsLoading(true); // Use context loading setter
    setError(null);
    try {
      await startGameService(gameId, traceId);
      logger.info(`[${traceId}] GamePage: Game ${gameId} started successfully.`);
      // Game state update will be handled by the Firestore listener via context
    } catch (err) {
      logger.error(`[${traceId}] GamePage: Error starting game`, err);
      setError(err instanceof Error ? err.message : 'Failed to start game.');
    } finally {
      setIsLoading(false);
    }
  };


  // Render loading state
  // Show loading if context reports loading OR if IDs haven't synced yet
  // Loading and error states will be handled within GameView

  // Main game view rendering
  return (
      <GameView
        gameData={gameData}
        playersData={playersData}
        playerId={playerId}
        gameId={gameId}
        roundData={roundData}
        isLoading={isLoading} // Pass loading state
        error={error} // Pass error state
        // creatorPlayerId is now part of gameData passed above
        onStartGame={handleStartGame} // Pass start game handler
        // onSettingsChange will need to be implemented and passed down if GamePage handles it
      />
  );
};

export default GamePage;