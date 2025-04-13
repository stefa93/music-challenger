import { useState, useEffect } from 'react';
import { collection, onSnapshot, Unsubscribe, query, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { Player } from '@/types/player'; // Import the Player type

// Hook to listen to the players subcollection for a specific game
export const usePlayersListener = (gameId: string | null): [Player[] | null, boolean, string | null] => {
  const [playersData, setPlayersData] = useState<Player[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading until first data/error
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setPlayersData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    logger.info(`[usePlayersListener] Setting up listener for players in game: ${gameId}`);

    const playersColRef = collection(db, "games", gameId, "players");
    // Optional: Add ordering if needed, e.g., query(playersColRef, orderBy("joinedAt"))
    const q: Query = query(playersColRef);

    const unsubscribe: Unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const players: Player[] = [];
        let hadError = false; // Flag to track if any doc processing failed
        querySnapshot.forEach((doc) => {
          if (doc.exists()) {
            const rawPlayerData = doc.data();
            // Basic validation/type assertion
            players.push({ id: doc.id, ...rawPlayerData } as Player);
          }
          // Removed the 'else' block as querySnapshot.forEach typically only iterates over existing documents.
          // If a document is deleted, it might trigger a new snapshot event where the doc is missing from querySnapshot.docs,
          // but the forEach loop itself shouldn't encounter a doc where doc.exists() is false.
        });

        logger.debug(`[usePlayersListener Game ${gameId}] Players data updated:`, players);
        setPlayersData(players);
        setError(hadError ? "Error processing some player data." : null); // Set error if any doc failed
        setIsLoading(false); // Stop loading after first data/error
      },
      (err) => { // Handle listener errors
        logger.error(`[usePlayersListener Game ${gameId}] Error listening to players collection:`, err);
        setError("Error listening to player updates.");
        setPlayersData(null);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      logger.info(`[usePlayersListener] Cleaning up listener for players in game: ${gameId}`);
      unsubscribe();
    };
  }, [gameId]); // Re-run effect if gameId changes

  return [playersData, isLoading, error];
};