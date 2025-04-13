import { useState, useEffect } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { Game } from '@/types/game'; // Import the Game type

// Hook to listen to a specific game document
export const useGameListener = (gameId: string | null): [Game | null, boolean, string | null] => {
  const [gameData, setGameData] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until first data arrives or error
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setGameData(null);
      setIsLoading(false); // Not loading if no gameId
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    logger.info(`[useGameListener] Setting up listener for game: ${gameId}`);

    const gameDocRef = doc(db, "games", gameId);
    const unsubscribe: Unsubscribe = onSnapshot(gameDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawData = docSnap.data();
          // Basic validation/type assertion
          const newData = { id: docSnap.id, ...rawData } as Game;
          logger.debug(`[useGameListener Game ${gameId}] Data received:`, newData);
          setGameData(newData);
          setError(null); // Clear error on successful data fetch
        } else {
          logger.warn(`[useGameListener Game ${gameId}] Game document does not exist!`);
          setGameData(null);
          setError(`Game ${gameId} not found.`); // Set error if document doesn't exist
        }
        setIsLoading(false); // Stop loading after first data/error
      },
      (err) => { // Handle listener errors
        logger.error(`[useGameListener Game ${gameId}] Error listening to game document:`, err);
        setError("Error listening to game updates.");
        setGameData(null);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      logger.info(`[useGameListener] Cleaning up listener for game: ${gameId}`);
      unsubscribe();
    };
  }, [gameId]); // Re-run effect if gameId changes

  return [gameData, isLoading, error];
};