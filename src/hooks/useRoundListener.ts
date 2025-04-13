import { useState, useEffect } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logger from '@/lib/logger';
import { Round } from '@/types/round'; // Import the Round type

// Hook to listen to the current round document for a specific game
export const useRoundListener = (gameId: string | null, currentRound: number | null | undefined): [Round | null, boolean, string | null] => {
  const [roundData, setRoundData] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Only loading when actively fetching a specific round
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if we have a valid gameId and a positive currentRound number
    if (!gameId || !currentRound || currentRound <= 0) {
      setRoundData(null); // Clear data if no valid round
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    const roundPath = `games/${gameId}/rounds/${currentRound}`;
    logger.info(`[useRoundListener] Setting up listener for round: ${roundPath}`);

    const roundDocRef = doc(db, roundPath);
    const unsubscribe: Unsubscribe = onSnapshot(roundDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawData = docSnap.data();
          // Basic validation/type assertion
          const newData = rawData as Round; // Assume data matches Round type
          logger.debug(`[useRoundListener ${roundPath}] Data received:`, newData);
          setRoundData(newData);
          setError(null);
        } else {
          // This might happen briefly during round transitions
          logger.warn(`[useRoundListener ${roundPath}] Round document does not exist!`);
          setRoundData(null);
          // Don't necessarily set an error here, could be normal transition state
        }
        setIsLoading(false);
      },
      (err) => { // Handle listener errors
        logger.error(`[useRoundListener ${roundPath}] Error listening to round document:`, err);
        setError("Error listening to round updates.");
        setRoundData(null);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      logger.info(`[useRoundListener] Cleaning up listener for round: ${roundPath}`);
      unsubscribe();
    };
    // Re-run effect if gameId or currentRound changes
  }, [gameId, currentRound]);

  return [roundData, isLoading, error];
};