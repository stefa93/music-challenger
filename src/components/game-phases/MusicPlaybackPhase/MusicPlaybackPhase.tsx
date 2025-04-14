import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { PhaseCard } from "@/components/PhaseCard/PhaseCard";
import { MusicTrack } from '@/types/music'; // Changed import path and type name
import { Play, Pause, SkipForward, SkipBack, Music, Loader2, AlertCircle } from 'lucide-react';
import logger from '@/lib/logger';
import { controlPlaybackAPI, startRankingPhaseAPI } from '@/services/firebaseApi'; // Import new APIs

// Define props
interface MusicPlaybackPhaseProps {
  gameId: string | null; // Needed for API calls
  playerId: string | null; // Needed to check if host
  isHost: boolean;
  currentRound: number;
  submittedSongs: MusicTrack[]; // Use frontend MusicTrack type
  // Playback state synced from Firestore (via roundData in GameView)
  currentPlayingTrackIndex?: number | null;
  isPlaying?: boolean | null;
}

export const MusicPlaybackPhase: React.FC<MusicPlaybackPhaseProps> = ({
  gameId,
  playerId,
  isHost,
  currentRound,
  submittedSongs = [],
  currentPlayingTrackIndex = 0, // Default to first track index
  isPlaying: isPlayingSynced = false, // Default to not playing
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(false); // Local state to track actual audio element state
  const [loadingAction, setLoadingAction] = useState<'play' | 'pause' | 'next' | 'prev' | null>(null); // Track specific loading action
  const [controlError, setControlError] = useState<string | null>(null);
  const [isStartingRanking, setIsStartingRanking] = useState(false);
  const [startRankingError, setStartRankingError] = useState<string | null>(null);

  // Ensure index is valid
  const validIndex = Math.max(0, Math.min(currentPlayingTrackIndex ?? 0, submittedSongs.length - 1));
  const currentTrack = submittedSongs.length > 0 ? submittedSongs[validIndex] : null;

  // Effect to synchronize local audio playback with Firestore state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      // If no track or audio element, ensure local state is paused
      if (localIsPlaying) setLocalIsPlaying(false);
      return;
    };

    const targetSrc = currentTrack.previewUrl || ''; // Use previewUrl from MusicTrack

    // Load new track if src is different or if index changed
    if (audio.src !== targetSrc) {
      logger.debug(`Sync: Loading new src: ${targetSrc} for index ${validIndex}`);
      audio.src = targetSrc;
      audio.load();
      // Reset local playing state when track changes, rely on isPlayingSynced to start
      setLocalIsPlaying(false);
    }

    // Sync play/pause state
    if (isPlayingSynced && audio.paused && targetSrc) {
      logger.debug(`Sync: Firestore state is playing, local is paused. Playing index ${validIndex}`);
      audio.play().then(() => setLocalIsPlaying(true)).catch(e => logger.error("Sync: Error playing audio:", e));
    } else if (!isPlayingSynced && !audio.paused) {
      logger.debug(`Sync: Firestore state is paused, local is playing. Pausing index ${validIndex}`);
      audio.pause();
      setLocalIsPlaying(false);
    } else if (isPlayingSynced && !audio.paused && !localIsPlaying) {
      // Handles case where audio started playing due to sync but local state wasn't updated yet
      setLocalIsPlaying(true);
    } else if (!isPlayingSynced && audio.paused && localIsPlaying) {
      // Handles case where audio paused due to sync but local state wasn't updated yet
      setLocalIsPlaying(false);
    }

  }, [currentPlayingTrackIndex, isPlayingSynced, currentTrack, localIsPlaying, validIndex]); // Add localIsPlaying and validIndex

  // Host action handlers
  const handleHostControl = async (action: 'play' | 'pause' | 'next' | 'prev') => { // Removed seekToIndex for simplicity now
    if (!gameId || !isHost || loadingAction) return; // Check specific loading action

    setLoadingAction(action); // Set specific loading action
    setControlError(null);
    const traceId = `controlPlayback_${action}_${Date.now()}`;
    logger.info(`[${traceId}] Host action: ${action}`);

    try {
      await controlPlaybackAPI({ gameId, action, traceId, playerId }); // Add playerId here
      // State update happens via Firestore listener
    } catch (error: any) {
      logger.error(`[${traceId}] Error controlling playback:`, error);
      setControlError(error.message || `Failed to ${action} playback.`);
    } finally {
      setLoadingAction(null); // Clear loading action
      // Removed setIsControllingPlayback(false);
    }
  };

  const handleStartRanking = async () => {
    if (!gameId || !isHost || isStartingRanking) return;

    setIsStartingRanking(true);
    setStartRankingError(null);
    const traceId = `startRanking_${Date.now()}`;
    logger.info(`[${traceId}] Host action: Start Ranking`);

    try {
      await startRankingPhaseAPI({ gameId, traceId, playerId }); // Add playerId
      // State update happens via Firestore listener
    } catch (error: any) {
      logger.error(`[${traceId}] Error starting ranking phase:`, error);
      setStartRankingError(error.message || "Failed to start ranking phase.");
    } finally {
      setIsStartingRanking(false);
    }
  };

  // Handle audio element events to update local state
  const handleAudioEnded = useCallback(() => {
    logger.debug('Local audio ended');
    setLocalIsPlaying(false);
    // Host might automatically trigger 'next' or 'pause' via backend here if desired
    // if (isHost) { handleHostControl('next'); } // Example: auto-play next
  }, []);

  const handleAudioPause = useCallback(() => {
    // Update local state if paused externally or ended
    if (audioRef.current && !audioRef.current.ended) {
      logger.debug('Local audio paused (not ended)');
    }
    setLocalIsPlaying(false);
  }, []);

  const handleAudioPlay = useCallback(() => {
    logger.debug('Local audio playing');
    setLocalIsPlaying(true);
  }, []);


  return (
    <PhaseCard
      title="Listen Together"
      description={
        <>
          The host controls the playback. Listen to the 30s previews for round {currentRound}.
        </>
      }
      footerContent={
        <>
          {isHost && (
            <CreativeButton
              onClick={handleStartRanking}
              className="w-full"
              disabled={isStartingRanking || submittedSongs.length === 0}
            >
              {isStartingRanking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Start Ranking Phase"
              )}
            </CreativeButton>
          )}
          {startRankingError && (
            <p className="text-sm text-destructive text-center flex items-center justify-center gap-1 mt-2" role="alert">
              <AlertCircle className="h-4 w-4" /> {startRankingError}
            </p>
          )}
        </>
      }
    >
      <div className="space-y-4 pt-4">
        {/* Hidden Audio Player */}
        <audio ref={audioRef} onEnded={handleAudioEnded} onPause={handleAudioPause} onPlay={handleAudioPlay} />

        {/* Currently Playing Info */}
        <div className="p-4 border rounded-md min-h-[100px] flex flex-col sm:flex-row justify-center items-center text-center sm:text-left gap-4 bg-muted/30">
          {/* Album Art */}
          {currentTrack ? (
            currentTrack.albumImageUrl ? (
              <img
                src={currentTrack.albumImageUrl}
                alt={`Album art for ${currentTrack.name}`}
                className="h-16 w-16 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-md bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
                <Music size={24} />
              </div>
            )
          ) : (
            <div className="h-16 w-16 rounded-md bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
              <Music size={24} />
            </div>
          )}
          {/* Track Info */}
          <div className="flex-grow overflow-hidden">
            {currentTrack ? (
              <>
                <p className="text-lg font-semibold font-handwritten truncate max-w-full">{currentTrack.name}</p>
                <p className="text-sm text-muted-foreground truncate max-w-full">{currentTrack.artistName}</p>
                {!currentTrack.previewUrl && (
                  <p className="text-xs text-destructive mt-1">(Preview unavailable)</p>
                )}
                <p className={`text-xs mt-1 font-medium ${isPlayingSynced ? "text-green-600" : "text-muted-foreground"}`}>
                  {isPlayingSynced ? "Playing..." : "Paused"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No songs submitted yet.</p>
            )}
          </div>
        </div>

        {/* Playback Controls (Host Only) */}
        {isHost && submittedSongs.length > 0 && (
          <div className="flex justify-center items-center gap-2 sm:gap-4 mt-4">
            <CreativeButton
              onClick={() => handleHostControl("prev")}
              variant="outline"
              size="icon"
              aria-label="Previous track"
              disabled={!!loadingAction}
            >
              <SkipBack className="h-5 w-5" />
            </CreativeButton>
            <CreativeButton
              onClick={() => handleHostControl(isPlayingSynced ? "pause" : "play")}
              variant="outline"
              size="icon"
              aria-label={isPlayingSynced ? "Pause track" : "Play track"}
              disabled={!currentTrack?.previewUrl || !!loadingAction}
            >
              {(loadingAction === "play" || loadingAction === "pause") ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isPlayingSynced ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </CreativeButton>
            <CreativeButton
              onClick={() => handleHostControl("next")}
              variant="outline"
              size="icon"
              aria-label="Next track"
              disabled={!!loadingAction}
            >
              <SkipForward className="h-5 w-5" />
            </CreativeButton>
          </div>
        )}
        {controlError && (
          <p className="text-sm text-destructive text-center flex items-center justify-center gap-1" role="alert">
            <AlertCircle className="h-4 w-4" /> {controlError}
          </p>
        )}
        {!isHost && (
          <p className="text-sm text-muted-foreground text-center">Waiting for the host to control playback...</p>
        )}
      </div>
    </PhaseCard>
  );
};