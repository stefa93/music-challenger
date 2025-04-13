import { useState, useCallback, useEffect, useRef } from 'react'; // Added useEffect and useRef
import {
  startNextRoundAPI,
  startSelectionPhaseAPI,
  getPredefinedChallengesAPI, // Added
  setChallengeAPI,
  getChallengeDetailsAPI, // Added API for fetching specific challenge songs
} from '@/services/firebaseApi';
import logger from '@/lib/logger';
import { MusicTrack } from '@/types/music'; // Added MusicTrack type

interface UseRoundManagementProps {
  gameId: string | null;
  roundId: string | null;
  isHost: boolean;
  playerId: string | null;
  currentChallengeText: string | null; // Add current challenge text from gameData
}

export const useRoundManagement = ({ gameId, roundId, isHost, playerId, currentChallengeText }: UseRoundManagementProps) => {
  // State for Starting Next Round
  const [isStartingNextRound, setIsStartingNextRound] = useState(false);
  const [startNextRoundError, setStartNextRoundError] = useState<string | null>(null);

  // State for Starting Selection Phase
  const [isStartingSelection, setIsStartingSelection] = useState(false);
  const [startSelectionError, setStartSelectionError] = useState<string | null>(null);

  // State for Predefined Challenges
  const [predefinedChallenges, setPredefinedChallenges] = useState<string[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  const [loadChallengesError, setLoadChallengesError] = useState<string | null>(null);

  // State for Setting Challenge
  const [isSettingChallenge, setIsSettingChallenge] = useState(false);
  const hasFetchedChallengesRef = useRef(false); // Ref to track fetch status

  const [setChallengeError, setSetChallengeError] = useState<string | null>(null);

  // State for Current Challenge's Predefined Songs
  const [currentChallengeSongs, setCurrentChallengeSongs] = useState<MusicTrack[]>([]);
  const [isLoadingCurrentChallengeSongs, setIsLoadingCurrentChallengeSongs] = useState(false);
  const [loadCurrentChallengeSongsError, setLoadCurrentChallengeSongsError] = useState<string | null>(null);
  const handleStartNextRound = useCallback(async () => {
    setStartNextRoundError(null);
    setIsStartingNextRound(true);
    const traceId = `startNextRound_${Date.now()}`;
    logger.info(`[${traceId}] handleStartNextRound triggered.`);

    if (!gameId || !playerId) { // Add check for playerId
      logger.error(`[${traceId}] Missing gameId or playerId. Cannot start next round.`);
      setStartNextRoundError("Cannot start next round: Missing game or player ID.");
      setIsStartingNextRound(false);
      return;
    }

    logger.debug(`[${traceId}] Calling startNextRound API for game ${gameId}...`);

    try {
      await startNextRoundAPI({ gameId, traceId, playerId }); // Pass playerId
      logger.info(`[${traceId}] Next round started successfully for game ${gameId}.`);
      // Reset local state related to the finished round if necessary (though UI should update via listener)
      setStartNextRoundError(null);
    } catch (error: any) {
      logger.error(`[${traceId}] Error calling startNextRound API:`, error);
      setStartNextRoundError(error.message || "An unexpected error occurred.");
    } finally {
      setIsStartingNextRound(false);
      logger.debug(`[${traceId}] Finished handling start next round.`);
    }
  }, [gameId, playerId]); // Add playerId dependency

  // Fetch Predefined Challenges on mount
  useEffect(() => {
    const fetchChallenges = async () => {
      setIsLoadingChallenges(true);
      setLoadChallengesError(null);
      const traceId = `fetchChallenges_${Date.now()}`;
      logger.info(`[${traceId}] Fetching predefined challenges...`);
      try {
        const challenges = await getPredefinedChallengesAPI({ traceId });
        setPredefinedChallenges(challenges);
        logger.info(`[${traceId}] Successfully fetched ${challenges.length} challenges.`);
      } catch (error: any) {
        logger.error(`[${traceId}] Error fetching predefined challenges:`, error);
        setLoadChallengesError(error.message || "Failed to load challenges.");
      } finally {
        setIsLoadingChallenges(false);
      }
    };

    // Fetch only if host and fetch hasn't been attempted yet
    if (isHost && !hasFetchedChallengesRef.current) {
      hasFetchedChallengesRef.current = true; // Mark as attempted immediately
      fetchChallenges();
    }
    // Effect depends on isHost changing
  }, [isHost]); // Keep dependency only on isHost, as it controls the one-time fetch

  // Fetch predefined songs for the *current* challenge when it changes
  useEffect(() => {
    const fetchCurrentChallengeSongs = async (challengeText: string) => {
      setIsLoadingCurrentChallengeSongs(true);
      setLoadCurrentChallengeSongsError(null);
      const traceId = `fetchCurrentSongs_${Date.now()}`;
      logger.info(`[${traceId}] Fetching predefined songs for challenge: "${challengeText}"...`);
      try {
        const songs = await getChallengeDetailsAPI({ challengeText, traceId });
        setCurrentChallengeSongs(songs);
        logger.info(`[${traceId}] Successfully fetched ${songs.length} predefined songs for "${challengeText}".`);
      } catch (error: any) {
        logger.error(`[${traceId}] Error fetching predefined songs for "${challengeText}":`, error);
        setLoadCurrentChallengeSongsError(error.message || "Failed to load challenge songs.");
        setCurrentChallengeSongs([]); // Clear songs on error
      } finally {
        setIsLoadingCurrentChallengeSongs(false);
      }
    };

    if (currentChallengeText) {
      fetchCurrentChallengeSongs(currentChallengeText);
    } else {
      // Clear songs if challenge becomes null (e.g., between rounds)
      setCurrentChallengeSongs([]);
      setLoadCurrentChallengeSongsError(null);
      setIsLoadingCurrentChallengeSongs(false);
    }
    // This effect depends on the current challenge text changing
  }, [currentChallengeText]);
  const handleStartSelectionPhase = useCallback(async () => {
    setStartSelectionError(null);
    setIsStartingSelection(true);
    const traceId = `startSelectionPhase_${Date.now()}`;
    logger.info(`[${traceId}] handleStartSelectionPhase triggered.`);

    if (!gameId) {
      logger.error(`[${traceId}] Missing gameId. Cannot start selection phase.`);
      setStartSelectionError("Cannot start selection phase: Missing game ID.");
      setIsStartingSelection(false);
      return;
    }
    if (!playerId) { // Add check for playerId
      logger.error(`[${traceId}] Missing playerId. Cannot start selection phase.`);
      setStartSelectionError("Cannot start selection phase: Missing player ID.");
      setIsStartingSelection(false);
      return;
    }

    logger.debug(`[${traceId}] Calling startSelectionPhase API for game ${gameId}...`);

    try {
      await startSelectionPhaseAPI({ gameId, traceId, playerId }); // Pass playerId
      logger.info(`[${traceId}] Selection phase started successfully for game ${gameId}.`);
      // Reset local state related to the announcement phase if necessary
      setStartSelectionError(null);
    } catch (error: any) {
      logger.error(`[${traceId}] Error calling startSelectionPhase API:`, error);
      setStartSelectionError(error.message || "An unexpected error occurred.");
    } finally {
      setIsStartingSelection(false);
      logger.debug(`[${traceId}] Finished handling start selection phase.`);
    }
  }, [gameId, playerId]); // Add playerId dependency

  const handleSetChallenge = useCallback(async (challenge: string) => {
    setSetChallengeError(null); // Use correct setter
    setIsSettingChallenge(true);
    const traceId = `setChallenge_${Date.now()}`;
    logger.info(`[${traceId}] handleSetChallenge triggered.`);

    if (!gameId) {
      logger.error(`[${traceId}] Missing gameId. Cannot set challenge.`);
      setSetChallengeError("Cannot set challenge: Missing game ID."); // Use correct setter
      setIsSettingChallenge(false);
      return;
    }
    if (!roundId) {
      logger.error(`[${traceId}] Missing roundId. Cannot set challenge.`);
      setSetChallengeError("Cannot set challenge: Missing round ID."); // Use correct setter
      setIsSettingChallenge(false);
      return;
    }
    if (!playerId) { // Add check for playerId
      logger.error(`[${traceId}] Missing playerId. Cannot set challenge.`);
      setSetChallengeError("Cannot set challenge: Missing player ID.");
      setIsSettingChallenge(false);
      return;
    }
    if (!challenge || challenge.trim().length === 0) {
      logger.warn(`[${traceId}] Attempted to set an empty challenge.`);
      setSetChallengeError("Challenge cannot be empty."); // Use correct setter
      setIsSettingChallenge(false);
      return;
    }

    logger.debug(`[${traceId}] Calling setChallenge API for game ${gameId}, round ${roundId}...`);

    try {
      await setChallengeAPI({ gameId, roundId, challenge: challenge.trim(), traceId, playerId }); // Pass playerId
      logger.info(`[${traceId}] setChallenge API call successful for game ${gameId}, round ${roundId}.`);
      // UI should update via listener when Firestore data changes
      setSetChallengeError(null); // Use correct setter
    } catch (error: any) {
      logger.error(`[${traceId}] Error calling setChallenge API:`, error);
      setSetChallengeError(error.message || "An unexpected error occurred while setting the challenge."); // Use correct setter
    } finally {
      setIsSettingChallenge(false);
      logger.debug(`[${traceId}] Finished handling set challenge.`);
    }
  }, [gameId, roundId, playerId]); // Add playerId dependency

  // Function to reset all state within this hook (e.g., on component unmount or game change)
  const resetRoundManagement = useCallback(() => {
    setIsStartingNextRound(false);
    setStartNextRoundError(null);
    setIsStartingSelection(false);
    setStartSelectionError(null);
    // Reset new state
    setPredefinedChallenges([]);
    setIsLoadingChallenges(false); // Reset loading state too
    setLoadChallengesError(null);
    setIsSettingChallenge(false);
    setSetChallengeError(null);
    // Reset predefined songs state
    setCurrentChallengeSongs([]);
    setIsLoadingCurrentChallengeSongs(false);
    setLoadCurrentChallengeSongsError(null);
    logger.debug('Round management state reset.');
  }, []);


  return {
    isStartingNextRound,
    startNextRoundError,
    isStartingSelection,
    startSelectionError,
    handleStartNextRound,
    handleStartSelectionPhase,
    resetRoundManagement, // Expose reset function
    // Expose new state and functions
    predefinedChallenges,
    isLoadingChallenges,
    loadChallengesError,
    isSettingChallenge,
    setChallengeError,
    handleSetChallenge,
    // Expose current challenge songs state
    currentChallengeSongs,
    isLoadingCurrentChallengeSongs,
    loadCurrentChallengeSongsError,
  };
};