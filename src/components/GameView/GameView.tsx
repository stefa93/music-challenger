import React, { useEffect, useState } from 'react'; // Added useState

// UI Imports (kept)
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreativeCard } from "@/components/CreativeCard/CreativeCard";
import { CreativeSkeleton } from "@/components/CreativeSkeleton/CreativeSkeleton"; // Import the new skeleton
import logger from '@/lib/logger';
import { submitRankingAPI } from '@/services/firebaseApi'; // Import the API function

// Removed other API imports (now handled by hooks)
// import { searchSpotifyTracksAPI, submitSongNominationAPI, startNextRoundAPI, startSelectionPhaseAPI, TrackDetailsPayload } from '@/services/firebaseApi';
// import { SpotifyTrack } from '@/types/spotify'; // Moved to hooks where needed

// Phase Component Imports (kept)
import { ChallengeAnnouncementPhase } from '@/components/game-phases/ChallengeAnnouncementPhase/ChallengeAnnouncementPhase';
import { SelectionPhase } from '@/components/game-phases/SelectionPhase/SelectionPhase';
import { RankingPhase } from '@/components/game-phases/RankingPhase/RankingPhase';
import { ScoringPhase } from '@/components/game-phases/ScoringPhase/ScoringPhase';
import { RoundFinishedPhase } from '@/components/game-phases/RoundFinishedPhase/RoundFinishedPhase';
import { GameFinishedPhase } from '@/components/game-phases/GameFinishedPhase/GameFinishedPhase';
import { MusicPlaybackPhase } from '@/components/game-phases/MusicPlaybackPhase/MusicPlaybackPhase';
import { LobbyPhase, GameSettings } from '@/components/game-phases/LobbyPhase/LobbyPhase'; // Import LobbyPhase & GameSettings
import { updateGameSettingsService } from '@/services/firebaseApi'; // Import the new service
// Import Custom Hooks
import { useMusicSearch } from '@/hooks/useMusicSearch'; // Renamed hook import
import { useSongNomination } from '@/hooks/useSongNomination';
// import { useRanking } from '@/hooks/useRanking'; // Remove useRanking import
import { useRoundManagement } from '@/hooks/useRoundManagement';

// Prop Types (kept)
interface Player {
  id: string;
  name: string;
  score: number;
}

interface GameData {
  currentRound: number;
  challenge: string | null; // Allow null for initial state
  status: string;
  roundHostPlayerId?: string | null;
  creatorPlayerId?: string | null; // Added creator ID here too
  settings?: GameSettings; // Made settings optional to match global type
}

export interface GameViewProps { // Added export
  gameData: GameData | null;
  playersData: Player[] | null; // Keep playersData prop for GameFinishedPhase
  playerId: string | null;
  gameId: string | null;
  roundData: any | null;
  isLoading: boolean; // Add isLoading prop
  error: string | null; // Add error prop
  // creatorPlayerId prop removed as it's now part of gameData
  onStartGame?: () => void; // Keep this one
  onSettingsChange?: (newSettings: GameSettings) => void; // Add settings change handler prop
}

// Helper function for user-friendly status names
const getDisplayStatus = (status: string | undefined): string => {
  if (!status) return 'Loading...';

  if (status.endsWith('_announcing')) return 'Announcing Challenge';
  if (status.endsWith('_selecting')) return 'Selecting Songs';
  if (status.endsWith('_listening')) return 'Listening Time';
  if (status.endsWith('_ranking')) return 'Ranking Songs';
  if (status.endsWith('_scoring')) return 'Calculating Scores';
  if (status.endsWith('_finished')) return 'Round Finished';
  if (status === 'finished') return 'Game Over!';
  if (status === 'waiting') return 'Waiting in Lobby'; // Should not appear in header, but good fallback

  // Fallback for unknown statuses
  logger.warn(`[getDisplayStatus] Unknown status encountered: ${status}`);
  return status; // Return raw status if no match
};


const GameView: React.FC<GameViewProps> = ({ gameData, playersData, playerId, gameId, roundData, isLoading, error, onStartGame }) => { // Add isLoading, error
  // Log mount/unmount to detect remounts
  useEffect(() => {
    logger.debug(`[GameView MOUNT] gameId: ${gameId}, playerId: ${playerId}`);
    // Return cleanup function to log unmount
    return () => logger.debug(`[GameView UNMOUNT] gameId: ${gameId}, playerId: ${playerId}`);
    // Log only when gameId/playerId changes, effectively mount/unmount per game session
  }, [gameId, playerId]);


  // Instantiate Custom Hooks
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    setIsSearchPopoverOpen,
    handleSearchChange,
    resetSearch,
    setSearchQuery, // Pass to nomination hook
    setSearchResults, // Pass to nomination hook
  } = useMusicSearch({
    gameId,
    playerId,
    allowExplicit: gameData?.settings?.allowExplicit ?? true // Add null check for gameData
  });

  const {
    selectedTrack,
    isSubmittingNomination,
    nominationError,
    handleSelectTrack,
    handleSongSubmit,
    resetNomination,
  } = useSongNomination({
    gameId,
    playerId,
    setSearchQuery, // Connect hooks
    setSearchResults, // Connect hooks
    setIsSearchPopoverOpen, // Connect hooks
  });

  // Remove useRanking hook instantiation
  // const {
  //   isSubmittingRanking,
  //   hasSubmittedRanking,
  //   rankingError,
  //   handleRankingSubmit,
  //   resetRanking,
  // } = useRanking({ gameId, playerId, roundData });

  // Add state for ranking submission directly in GameView
  const [isSubmittingRanking, setIsSubmittingRanking] = useState(false);
  const [hasSubmittedRanking, setHasSubmittedRanking] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  // Convert currentRound number to string for roundId prop
  const currentRoundId = gameData?.currentRound ? String(gameData.currentRound) : null;
  // Determine if the current player is the round host (needed for hooks)
  const isHost = gameData?.roundHostPlayerId === playerId; // Add optional chaining


  const {
    isStartingNextRound,
    startNextRoundError,
    isStartingSelection,
    startSelectionError,
    handleStartNextRound,
    handleStartSelectionPhase,
    // New values from useRoundManagement
    predefinedChallenges,
    isLoadingChallenges,
    loadChallengesError,
    isSettingChallenge,
    setChallengeError,
    handleSetChallenge,
    // Extract new state for predefined songs
    currentChallengeSongs,
    // isLoadingCurrentChallengeSongs, // Not used directly here, maybe SelectionPhase needs it?
    // loadCurrentChallengeSongsError, // Not used directly here, maybe SelectionPhase needs it?
  } = useRoundManagement({ gameId, roundId: currentRoundId, isHost, playerId, currentChallengeText: gameData?.challenge ?? null }); // Provide null fallback

  // Effect to reset state when round changes - Moved to top level
  useEffect(() => {
    // Check if gameData exists before accessing currentRound
    if (gameData?.currentRound) {
      logger.debug(`Round changed to ${gameData.currentRound}. Resetting phase-specific states.`);
      resetSearch();
      resetNomination();
      // resetRanking(); // Remove call to resetRanking from the removed hook
      // Reset local ranking state instead
      setIsSubmittingRanking(false);
      setHasSubmittedRanking(false);
      setRankingError(null);
      // resetRoundManagement(); // Consider if this needs conditional execution based on gameData presence
    }
    // Dependencies remain the same, but the effect now runs unconditionally.
    // The logic inside handles the case where gameData might be null initially.
  }, [gameData?.currentRound, resetSearch, resetNomination]); // Removed resetRanking dependency


  // Handle error state passed from parent
  if (error) {
    // TODO: Improve error display, maybe use an Alert component
    return <p className="p-4 text-destructive">Error loading game: {error}</p>;
  }

  // Handle loading state passed from parent OR missing essential data
  // Keep playersData check here as it's needed for Lobby and GameFinished phases
  if (isLoading || !gameData || !playersData || !playerId || !gameId || gameData.status?.startsWith('transitioning_')) {
    // Render loading skeleton
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen p-4">
        {/* Use CreativeSkeleton for a themed visual */}
        <CreativeSkeleton className="h-20 w-20 rounded-lg mb-6" />
        {/* Add the engaging text */}
        <p className="font-handwritten text-3xl text-zinc-700 dark:text-zinc-300 mb-4 animate-pulse">
          Getting things ready...
        </p>
        {/* Maybe a few smaller skeletons for detail */}
        <div className="flex space-x-2">
          <CreativeSkeleton className="h-4 w-16" />
          <CreativeSkeleton className="h-4 w-24" />
          <CreativeSkeleton className="h-4 w-12" />
        </div>
      </div>
    );
  }

  // Determine if the current player is the round host (kept)
  const creatorPlayerId = gameData.creatorPlayerId; // Get creatorId from gameData

  // Define default settings in case gameData.settings is undefined
  const defaultSettings: GameSettings = {
    rounds: 5,
    maxPlayers: 6,
    allowExplicit: false,
    selectionTimeLimit: 90,
    rankingTimeLimit: 60,
  };

  // Handler for settings changes from LobbyPhase
  const handleSettingsChange = async (newSettings: GameSettings) => {
    const traceId = `settings_change_${Date.now()}`;
    logger.info(`[${traceId}] GameView: handleSettingsChange triggered.`, { gameId, newSettings });

    if (!gameId) {
      logger.error(`[${traceId}] Cannot update settings: gameId is missing.`);
      // Optionally show an error to the user via context or state
      return;
    }

    // Call the API service to update settings in the backend
    try {
      // Include playerId in the payload for the temporary authorization check
      await updateGameSettingsService({ gameId, newSettings, traceId, playerId });
      logger.info(`[${traceId}] Settings update request sent successfully.`);
      // No need to call onSettingsChange prop here, as the update will come
      // through the real-time listener in GameContext.
    } catch (error) {
      logger.error(`[${traceId}] Error calling updateGameSettingsService:`, error);
      // Optionally show an error to the user (e.g., using a toast notification context)
    }
  };

  // --- Removed State Declarations ---

  // --- Removed Handler Functions ---
  // --- Removed Debounce Ref ---

  return (
    // Apply min and max width for medium screens and up, allow full width on small screens
    <div className="w-full md:min-w-[800px] md:max-w-4xl mx-auto py-4 space-y-6 px-4 md:px-0"> {/* Added px for mobile */}
      {/* --- Lobby Phase --- */}
      {gameData.status === 'waiting' && (
        <LobbyPhase
          gameId={gameId}
          playersData={playersData} // Pass playersData here
          playerId={playerId}
          creatorPlayerId={creatorPlayerId} // Pass creatorId from gameData
          initialSettings={gameData.settings ?? defaultSettings} // Pass settings or defaults
          onStartGame={onStartGame}
          onSettingsChange={handleSettingsChange} // Pass the handler
        />
      )}

      {/* --- Game Info Header (Only shown AFTER Lobby) --- */}
      {gameData.status !== 'waiting' && gameData.status !== 'finished' && ( // Hide header on game finished screen
        <CreativeCard>
          <CardHeader>
            <CardTitle className="font-handwritten">Round {gameData.currentRound}: {gameData.challenge || 'Get Ready!'}</CardTitle>
            <CardDescription className="font-handwritten">
              Phase: <span className="font-semibold">{getDisplayStatus(gameData.status)}</span>
              {isHost && <span className="ml-2 font-semibold text-primary">(You are the Round Host)</span>}
            </CardDescription>
          </CardHeader>
        </CreativeCard>
      )}

      {/* --- Player List Removed --- */}


      {/* Phase-Specific UI Sections - Render directly without outer card */}

      {/* --- Challenge Announcement Phase --- */}
      {(gameData.status?.endsWith('_announcing')) && (
        <>
          {/* Display loading/error for predefined challenges */}
          {isLoadingChallenges && <p className="text-center text-muted-foreground">Loading challenges...</p>}
          {loadChallengesError && <p className="text-center text-destructive" role="alert">Error loading challenges: {loadChallengesError}</p>}
          {/* Display error for setting challenge */}
          {setChallengeError && <p className="text-center text-destructive mb-2" role="alert">Error setting challenge: {setChallengeError}</p>}

          <ChallengeAnnouncementPhase
            challenge={gameData.challenge} // Already passed
            roundHostPlayerId={gameData.roundHostPlayerId} // Already passed
            playersData={playersData} // Pass playersData here too, might be needed internally
            isStartingSelection={isStartingSelection} // Already passed
            startSelectionError={startSelectionError} // Already passed
            onStartSelectionPhase={handleStartSelectionPhase} // Already passed
            // --- New Props ---
            isHost={isHost} // Pass calculated host status
            predefinedChallenges={predefinedChallenges} // Pass from hook
            isSettingChallenge={isSettingChallenge} // Pass state from hook
            onSetChallenge={handleSetChallenge} // Pass callback from hook
          />
        </>
      )}

      {/* --- Song Selection Phase --- */}
      {(gameData.status?.endsWith('_selecting')) && (
        <SelectionPhase
          challenge={gameData.challenge}
          searchQuery={searchQuery} // from useMusicSearch
          searchResults={searchResults} // from useMusicSearch
          selectedTrack={selectedTrack} // from useSongNomination
          isSearching={isSearching} // from useMusicSearch
          searchError={searchError} // from useMusicSearch
          isSubmittingNomination={isSubmittingNomination} // from useSongNomination
          nominationError={nominationError} // from useSongNomination
          // isSearchPopoverOpen prop removed from SelectionPhase
          onSearchChange={handleSearchChange} // from useMusicSearch
          onSelectTrack={handleSelectTrack} // from useSongNomination
          onSongSubmit={handleSongSubmit} // from useSongNomination
          // setIsSearchPopoverOpen prop removed from SelectionPhase
          // Pass relevant settings and round data for timer
          timeLimit={gameData.settings?.selectionTimeLimit ?? null}
          startTime={roundData?.selectionStartTime ?? null}
          predefinedSongs={currentChallengeSongs} // Pass the fetched songs
          // --- Add missing props ---
          playerId={playerId}
          playerSongs={roundData?.playerSongs}
        />
      )}

      {/* --- Music Listening Phase --- */}
      {(gameData.status?.endsWith('_listening')) && (
        <MusicPlaybackPhase
          gameId={gameId}
          playerId={playerId}
          isHost={isHost}
          currentRound={gameData.currentRound}
          // Pass the correct songsForRanking list
          songsForRanking={roundData?.songsForRanking || []} // Pass the correct list, default to empty array
          currentPlayingTrackIndex={roundData?.currentPlayingTrackIndex ?? 0}
          isPlaying={roundData?.isPlaying ?? false}
          playbackEndTime={roundData?.playbackEndTime ?? null} // Pass the end time
        />
      )}

      {/* --- Ranking Phase --- */}
      {(gameData.status?.endsWith('_ranking')) && (
        <RankingPhase
          playerId={playerId} // Pass non-null playerId here
          roundData={roundData}
          isSubmittingRanking={isSubmittingRanking}
          hasSubmittedRanking={hasSubmittedRanking}
          rankingError={rankingError}
          // Pass the API call function and state setters/values
          onRankingSubmit={async (rankings) => {
              setRankingError(null);
              setIsSubmittingRanking(true);
              setHasSubmittedRanking(false); // Reset submitted status for new attempt
              const traceId = `submitRanking_${Date.now()}`;
              try {
                  if (!gameId || !playerId) throw new Error("Missing game/player ID");
                  await submitRankingAPI({ gameId, playerId, rankings, traceId });
                  setHasSubmittedRanking(true);
              } catch (error: any) {
                  logger.error(`[${traceId}] Error submitting rankings from GameView:`, error);
                  setRankingError(error.message || "Failed to submit rankings.");
                  setHasSubmittedRanking(false); // Ensure submitted status is false on error
              } finally {
                  setIsSubmittingRanking(false);
              }
          }}
          // Pass relevant settings and round data for timer
          timeLimit={gameData.settings?.rankingTimeLimit ?? null}
        // startTime is now derived internally from roundData in RankingPhase
        />
      )}

      {/* --- Scoring Phase --- */}
      {(gameData.status?.endsWith('_scoring')) && (
        <ScoringPhase currentRound={gameData.currentRound} /> // Prop
      )}

      {/* --- Round Finished Phase --- */}
      {(gameData.status?.endsWith('_finished')) && (
        <RoundFinishedPhase
          currentRound={gameData.currentRound} // Prop
          // Extract results and winner data from roundData
          roundResults={roundData?.results || []} // Pass results, default to empty array
          roundWinnerData={roundData?.winnerData || null} // Pass winner data, default to null
          isStartingNextRound={isStartingNextRound} // from useRoundManagement
          startNextRoundError={startNextRoundError} // from useRoundManagement
          onStartNextRound={handleStartNextRound} // from useRoundManagement
        />
      )}

      {/* --- Game Finished Phase --- */}
      {(gameData.status === 'finished') && (
        <GameFinishedPhase
          playersData={playersData} // Prop - playersData is needed here for final results
          playerId={playerId} // Prop
        />
      )}
    </div>
  );
};

export default GameView;