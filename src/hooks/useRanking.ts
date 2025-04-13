import { useState, useCallback } from 'react';
import { submitRankingAPI } from '@/services/firebaseApi';
import logger from '@/lib/logger';

interface UseRankingProps {
  gameId: string | null;
  playerId: string | null;
  roundData: any | null; // Consider defining a more specific type later
}

export const useRanking = ({ gameId, playerId, roundData }: UseRankingProps) => {
  const [rankings, setRankings] = useState<{ [songPlayerId: string]: number }>({});
  const [isSubmittingRanking, setIsSubmittingRanking] = useState(false);
  const [hasSubmittedRanking, setHasSubmittedRanking] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  const handleRankChange = useCallback((songPlayerId: string, rankStr: string) => {
    const rank = parseInt(rankStr, 10);
    setRankings(prev => ({
      ...prev,
      [songPlayerId]: isNaN(rank) ? 0 : rank, // Store 0 or actual rank, handle NaN
    }));
    setRankingError(null); // Clear error when user makes a change
    setHasSubmittedRanking(false); // Allow resubmission if rank changes
  }, []);

  const handleRankingSubmit = useCallback(async () => {
    setRankingError(null);
    setIsSubmittingRanking(true);

    if (!gameId || !playerId) {
      logger.error("Missing gameId or playerId for ranking submission.");
      setRankingError("Cannot submit rankings: Missing game or player ID.");
      setIsSubmittingRanking(false);
      return;
    }

    // Basic validation: Check if all displayed songs (excluding own) have a rank > 0
    const songsToRankCount = roundData?.playerSongs ? Object.keys(roundData.playerSongs).filter(pId => pId !== playerId).length : 0;
    const rankedSongsCount = Object.keys(rankings).filter(pId => pId !== playerId && rankings[pId] > 0).length;

    if (rankedSongsCount !== songsToRankCount) {
      logger.warn("Validation failed: Not all songs ranked.", { rankedSongsCount, songsToRankCount, rankings });
      setRankingError(`Please rank all ${songsToRankCount} songs.`);
      setIsSubmittingRanking(false);
      return;
    }
    // TODO: Add more robust validation (e.g., consecutive numbers, no duplicates)

    const traceId = `submitRanking_${Date.now()}`;
    logger.debug(`[${traceId}] Submitting rankings:`, { rankings });

    try {
      await submitRankingAPI({ gameId, playerId, rankings, traceId });
      logger.info(`[${traceId}] Rankings submitted successfully!`);
      setHasSubmittedRanking(true);
    } catch (error: any) {
      logger.error(`[${traceId}] Error submitting rankings:`, error);
      setRankingError(error.message || "An unexpected error occurred.");
      setHasSubmittedRanking(false); // Reset submitted status on error
    } finally {
      setIsSubmittingRanking(false);
    }
  }, [gameId, playerId, rankings, roundData]); // Added roundData dependency for validation

  const resetRanking = useCallback(() => {
    setRankings({});
    setIsSubmittingRanking(false);
    setHasSubmittedRanking(false);
    setRankingError(null);
    logger.debug('Ranking state reset.');
  }, []);

  return {
    rankings,
    isSubmittingRanking,
    hasSubmittedRanking,
    rankingError,
    handleRankChange,
    handleRankingSubmit,
    resetRanking, // Expose reset function
  };
};