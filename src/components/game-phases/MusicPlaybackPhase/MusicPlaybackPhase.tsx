import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { PhaseCard } from "@/components/PhaseCard/PhaseCard";
import { MusicTrack } from '@/types/music'; // Import the correct frontend type
import { Play, Pause, SkipForward, SkipBack, Music, Loader2, AlertCircle, TimerOff } from 'lucide-react'; // Added TimerOff
import logger from '@/lib/logger';
import { controlPlaybackAPI, startRankingPhaseAPI } from '@/services/firebaseApi';

// Define props
interface MusicPlaybackPhaseProps {
  gameId: string | null;
  playerId: string | null;
  isHost: boolean;
  currentRound: number;
  songsForRanking: MusicTrack[]; // Use the imported MusicTrack type
  currentPlayingTrackIndex?: number | null;
  isPlaying?: boolean | null;
  playbackEndTime?: { seconds: number; nanoseconds: number; } | null; // Firestore Timestamp structure
}

export const MusicPlaybackPhase: React.FC<MusicPlaybackPhaseProps> = ({
  gameId,
  playerId,
  isHost,
  currentRound,
  songsForRanking = [], // Update prop name and default value
  currentPlayingTrackIndex = 0,
  isPlaying: isPlayingSynced = false,
  playbackEndTime,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'play' | 'pause' | 'next' | 'prev' | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);
  const [isStartingRanking, setIsStartingRanking] = useState(false);
  const [startRankingError, setStartRankingError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null); // State for timer
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for interval ID
  const [isTimeUp, setIsTimeUp] = useState(false); // State to track if timer expired

  // Ensure index is valid based on songsForRanking
  const validIndex = Math.max(0, Math.min(currentPlayingTrackIndex ?? 0, songsForRanking.length - 1));
  const currentTrack = songsForRanking.length > 0 ? songsForRanking[validIndex] : null;

  // Effect to synchronize local audio playback with Firestore state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || isTimeUp) { // Don't sync if time is up
      if (localIsPlaying) setLocalIsPlaying(false);
      if (audio && !audio.paused) audio.pause(); // Ensure audio stops if time ran out while effect was running
      return;
    };

    const targetSrc = currentTrack.previewUrl || '';

    if (audio.src !== targetSrc) {
      logger.debug(`Sync: Loading new src: ${targetSrc} for index ${validIndex}`);
      audio.src = targetSrc;
      audio.load();
      setLocalIsPlaying(false);
    }

    if (isPlayingSynced && audio.paused && targetSrc) {
      logger.debug(`Sync: Firestore state is playing, local is paused. Playing index ${validIndex}`);
      audio.play().then(() => setLocalIsPlaying(true)).catch(e => logger.error("Sync: Error playing audio:", e));
    } else if (!isPlayingSynced && !audio.paused) {
      logger.debug(`Sync: Firestore state is paused, local is playing. Pausing index ${validIndex}`);
      audio.pause();
      setLocalIsPlaying(false);
    } else if (isPlayingSynced && !audio.paused && !localIsPlaying) {
      setLocalIsPlaying(true);
    } else if (!isPlayingSynced && audio.paused && localIsPlaying) {
      setLocalIsPlaying(false);
    }

  }, [currentPlayingTrackIndex, isPlayingSynced, currentTrack, localIsPlaying, validIndex, isTimeUp]); // Add isTimeUp dependency

  // Host action handlers
  const handleHostControl = async (action: 'play' | 'pause' | 'next' | 'prev') => {
    if (!gameId || !isHost || loadingAction || isTimeUp) return; // Disable controls if time is up

    setLoadingAction(action);
    setControlError(null);
    const traceId = `controlPlayback_${action}_${Date.now()}`;
    logger.info(`[${traceId}] Host action: ${action}`);

    try {
      await controlPlaybackAPI({ gameId, action, traceId, playerId });
    } catch (error: any) {
      logger.error(`[${traceId}] Error controlling playback:`, error);
      setControlError(error.message || `Failed to ${action} playback.`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartRanking = async () => {
    if (!gameId || !isHost || isStartingRanking) return;

    setIsStartingRanking(true);
    setStartRankingError(null);
    const traceId = `startRanking_${Date.now()}`;
    logger.info(`[${traceId}] Host action: Start Ranking`);

    try {
      await startRankingPhaseAPI({ gameId, traceId, playerId });
    } catch (error: any) {
      logger.error(`[${traceId}] Error starting ranking phase:`, error);
      setStartRankingError(error.message || "Failed to start ranking phase.");
    } finally {
      setIsStartingRanking(false);
    }
  };

  // Handle audio element events
  const handleAudioEnded = useCallback(() => {
    logger.debug('Local audio ended');
    setLocalIsPlaying(false);
  }, []);

  const handleAudioPause = useCallback(() => {
    if (audioRef.current && !audioRef.current.ended) {
      logger.debug('Local audio paused (not ended)');
    }
    setLocalIsPlaying(false);
  }, []);

  const handleAudioPlay = useCallback(() => {
    logger.debug('Local audio playing');
    setLocalIsPlaying(true);
  }, []);

  // Effect to handle playback timer
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRemainingTime(null);
    setIsTimeUp(false); // Reset time up state

    if (playbackEndTime) {
      const endTimeMs = playbackEndTime.seconds * 1000 + playbackEndTime.nanoseconds / 1000000;

      const updateTimer = () => {
        const nowMs = Date.now();
        const currentRemaining = Math.max(0, Math.round((endTimeMs - nowMs) / 1000));
        setRemainingTime(currentRemaining);

        if (currentRemaining <= 0) {
          logger.info("Playback time expired.");
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          audioRef.current?.pause();
          setLocalIsPlaying(false);
          setIsTimeUp(true); // Set time up state
          // Host must manually click button now
        }
      };

      updateTimer(); // Initial update

      if (remainingTime === null || remainingTime > 0) { // Check initial remaining time before setting interval
          timerIntervalRef.current = setInterval(updateTimer, 1000);
      } else {
           logger.warn("Playback end time is already in the past on load.");
           setIsTimeUp(true); // Set time up state immediately
      }

    } else {
       logger.debug("No playbackEndTime provided, timer not started.");
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        logger.debug("Timer interval cleared on cleanup.");
      }
    };
  // Only depend on playbackEndTime, changes to isHost/isStartingRanking shouldn't restart timer
  }, [playbackEndTime]);

  // Helper to format remaining time
  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Prepare timer display node
  const timerNode = remainingTime !== null ? (
     <span className={`font-semibold ${remainingTime <= 10 && !isTimeUp ? 'text-destructive animate-pulse' : ''} ${isTimeUp ? 'text-destructive' : ''}`}>
       {isTimeUp ? <TimerOff className="inline-block h-4 w-4 mr-1" /> : null}
       {formatTime(remainingTime)}
     </span>
   ) : null;


  return (
    <PhaseCard
      title="Listen Together"
      description={
        <>
          The host controls the playback. Listen to the previews for round {currentRound}.
          {isTimeUp && <span className="block text-sm font-semibold text-destructive mt-1">Time's up! Host, please start the ranking phase.</span>}
        </>
      }
      timerDisplay={timerNode} // Pass the formatted timer node here
      footerContent={
        <>
          {isHost && (
            <CreativeButton
              onClick={handleStartRanking}
              className="w-full"
              // Disable button if still starting, or if there are no songs
              disabled={isStartingRanking || songsForRanking.length === 0} // Check songsForRanking length
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
                <p className="text-sm text-muted-foreground truncate max-w-full">{currentTrack.artistName}</p> {/* Use artistName field from MusicTrack */}
                {!currentTrack.previewUrl && (
                  <p className="text-xs text-destructive mt-1">(Preview unavailable)</p>
                )}
                <p className={`text-xs mt-1 font-medium ${isPlayingSynced && !isTimeUp ? "text-green-600" : "text-muted-foreground"}`}>
                  {isTimeUp ? "Time Expired" : (isPlayingSynced ? "Playing..." : "Paused")}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No songs available for playback.</p>
            )}
          </div>
        </div>

        {/* Playback Controls (Host Only) */}
        {isHost && songsForRanking.length > 0 && ( // Check songsForRanking length
          <div className="flex justify-center items-center gap-2 sm:gap-4 mt-4">
            <CreativeButton
              onClick={() => handleHostControl("prev")}
              variant="outline"
              size="icon"
              aria-label="Previous track"
              disabled={!!loadingAction || isTimeUp} // Disable if time is up
            >
              <SkipBack className="h-5 w-5" />
            </CreativeButton>
            <CreativeButton
              onClick={() => handleHostControl(isPlayingSynced ? "pause" : "play")}
              variant="outline"
              size="icon"
              aria-label={isPlayingSynced ? "Pause track" : "Play track"}
              disabled={!currentTrack?.previewUrl || !!loadingAction || isTimeUp} // Disable if time is up
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
              disabled={!!loadingAction || isTimeUp} // Disable if time is up
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