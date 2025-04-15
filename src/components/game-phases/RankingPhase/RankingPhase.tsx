import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2, AlertCircle, Timer } from 'lucide-react'; // Added Timer icon

import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { PhaseCard } from "@/components/PhaseCard/PhaseCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for prop type
// Define types matching backend structure
// (Ideally import from a shared types file)
interface PlayerSongSubmission {
  trackId: string;
  name: string;
  artist: string;
  previewUrl: string; // May not be needed here, but part of the type
  albumImageUrl?: string;
  submittedAt?: Timestamp; // Optional on backend type
}

// Keep SongData for simplicity within the component if needed, or use PlayerSongSubmission directly
interface SongData extends Omit<PlayerSongSubmission, 'trackId' | 'previewUrl' | 'submittedAt'> {
  // Inherits name, artist, albumImageUrl
}

// Type for items in the sortable list
// Type for items in the sortable list
interface SortableSongItem {
  id: string; // Use trackId for sorting uniqueness
  data: PlayerSongSubmission; // Use the full submission data
}

interface RankingPhaseProps {
  playerId: string; // Current user's player ID
  roundData: {
    playerSongs?: { [playerId: string]: PlayerSongSubmission }; // Use full type
    songsForRanking?: PlayerSongSubmission[]; // Add the correct data source
    rankingStartTime?: Timestamp | null; // Timestamp when ranking phase began
  } | null;
  isSubmittingRanking: boolean;
  hasSubmittedRanking: boolean;
  rankingError: string | null;
  onRankingSubmit: (rankings: { [trackId: string]: number }) => void; // Submit rankings object
  // Timer props
  timeLimit: number | null; // Time limit in seconds, or null for none
  // startTime prop is derived from roundData.rankingStartTime
}

// Sortable Item Component
function SortableItem({ item, rank }: { item: SortableSongItem, rank: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined, // Bring dragged item to front
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between gap-3 p-3 border rounded-md bg-background",
        isDragging ? "shadow-lg" : ""
      )}
    >
      {/* Rank Number */}
      <span className="font-handwritten text-xl font-bold w-6 text-center text-muted-foreground">{rank}</span>
      {/* Song Details */}
      <div className="flex-1 overflow-hidden">
        <p className="font-medium truncate">{item.data.name}</p>
        <p className="text-sm text-muted-foreground truncate">{item.data.artist}</p>
      </div>
      {/* Drag Handle */}
      <Button
        variant="ghost"
        size="icon"
        className="cursor-grab touch-none h-8 w-8 text-muted-foreground hover:text-foreground"
        {...listeners}
        {...attributes}
        aria-label={`Drag to reorder ${item.data.name}`}
      >
        <GripVertical className="h-5 w-5" />
      </Button>
    </li>
  );
}


export const RankingPhase: React.FC<RankingPhaseProps> = ({
  playerId,
  roundData,
  isSubmittingRanking,
  hasSubmittedRanking,
  rankingError,
  onRankingSubmit,
  timeLimit, // Destructure timer prop
}) => {
  // Get the full list intended for ranking
  const songsForRankingList = roundData?.songsForRanking || [];
  // Find the current player's submission details from playerSongs map
  const ownSubmission = roundData?.playerSongs?.[playerId];

  const [rankedSongs, setRankedSongs] = useState<SortableSongItem[]>([]);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const startTime = roundData?.rankingStartTime ?? null; // Get start time from roundData

  // Initialize rankedSongs state based on songsForRanking, excluding own song
  useEffect(() => {
    const ownTrackId = ownSubmission?.trackId;
    const songsToRank = songsForRankingList
      .filter(song => song.trackId !== ownTrackId) // Exclude own song using trackId
      .map(songData => ({ id: songData.trackId, data: songData })); // Use trackId as sortable ID

    setRankedSongs(songsToRank);
    // Dependencies: the list of songs and the player's own submission details
  }, [songsForRankingList, ownSubmission]);

  // Timer logic
  useEffect(() => {
    if (!timeLimit || !startTime) {
      setRemainingTime(null); // No timer needed
      setIsTimeUp(false);
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const startMillis = startTime.toMillis();
      const elapsedSeconds = Math.floor((now - startMillis) / 1000);
      const currentRemaining = timeLimit - elapsedSeconds;

      if (currentRemaining <= 0) {
        setRemainingTime(0);
        setIsTimeUp(true);
        clearInterval(intervalId);
      } else {
        setRemainingTime(currentRemaining);
        setIsTimeUp(false);
      }
    }, 1000); // Update every second

     // Initial calculation
     const nowInitial = Date.now();
     const startMillisInitial = startTime.toMillis();
     const elapsedSecondsInitial = Math.floor((nowInitial - startMillisInitial) / 1000);
     const currentRemainingInitial = timeLimit - elapsedSecondsInitial;
     if (currentRemainingInitial <= 0) {
         setRemainingTime(0);
         setIsTimeUp(true);
         clearInterval(intervalId); // Clear immediately if already time up
     } else {
         setRemainingTime(currentRemainingInitial);
         setIsTimeUp(false);
     }

    // Cleanup interval on component unmount or when props change
    return () => clearInterval(intervalId);
  }, [timeLimit, startTime]);

  // Memoize formatted time string
  const formattedTime = useMemo(() => {
    if (remainingTime === null) return null;
    if (isTimeUp) return "Time's Up!";
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [remainingTime, isTimeUp]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRankedSongs((items) => {
        // Find indices based on trackId (which is item.id now)
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSubmit = () => {
    // Prevent submission if time is up, already submitted, or currently submitting
    if (isTimeUp || hasSubmittedRanking || isSubmittingRanking) {
        return;
    }
    // Create the rankings object { trackId: rank } expected by the backend
    const rankings: { [trackId: string]: number } = {};
    rankedSongs.forEach((item, index) => {
      // Rank is 1-based
      rankings[item.id] = index + 1;
    });
    onRankingSubmit(rankings);
  };

  const numSongsToRank = rankedSongs.length;

  const infoContent = (
    <>
      <p>Use the drag handle icon (⠿) to drag and drop the songs into your preferred order. #1 is the best match for the challenge.</p>
      <p className="mt-2">Your own submission is shown below and cannot be ranked.</p>
    </>
  );

  return (
    <PhaseCard
      title="Rank the Songs"
      description="Drag the songs to rank them based on the challenge. #1 is best!"
      infoPopoverContent={infoContent}
      infoPopoverTitle="How to Rank"
      timerDisplay={
        formattedTime && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold font-handwritten border-2 border-foreground shadow-sm ${
              isTimeUp
                ? "text-destructive border-destructive animate-pulse"
                : "text-primary border-primary"
            }`}
            data-testid="ranking-timer"
          >
            <Timer className="h-4 w-4" />
            {formattedTime}
          </div>
        )
      }
      footerContent={
        numSongsToRank > 0 && (
          <div className="flex flex-col items-start gap-2 w-full">
            <CreativeButton
              onClick={handleSubmit}
              className="w-full h-12"
              disabled={isSubmittingRanking || hasSubmittedRanking}
            >
              {isSubmittingRanking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : hasSubmittedRanking ? (
                "Waiting for others..."
              ) : (
                "Submit Rankings"
              )}
            </CreativeButton>
            {rankingError && (
              <p
                data-testid="ranking-error"
                className="text-sm text-destructive flex items-center gap-1 w-full justify-center"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" /> {rankingError}
              </p>
            )}
          </div>
        )
      }
    >
      <div className="pt-4 space-y-4">
        {numSongsToRank > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd} // Allow dragging even if time is up
          >
            <SortableContext
              items={rankedSongs.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {rankedSongs.map((item, index) => (
                  <SortableItem key={item.id} item={item} rank={index + 1} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-muted-foreground text-center font-handwritten">
            {/* Use songsForRankingList length to check if enough songs */}
            {songsForRankingList.length <= 1
              ? "Not enough songs submitted to rank."
              : "Waiting for other submissions..."}
          </p>
        )}

        {/* Display Own Song using ownSubmission */}
        {ownSubmission && (
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <p className="text-sm text-muted-foreground font-handwritten">
              Your submission (not ranked):
            </p>
            <div className="flex items-center gap-3 p-3 rounded-md border border-dashed border-muted bg-muted/50">
              {/* Optional: Display album art if available */}
              {ownSubmission.albumImageUrl && (
                  <img src={ownSubmission.albumImageUrl} alt={`Album art for ${ownSubmission.name}`} className="w-10 h-10 rounded object-cover" />
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{ownSubmission.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {ownSubmission.artist}
                </p>
              </div>
            </div> {/* Closing div for the ownSubmission section */}
          </div> // Closing div for the main content area started on line 270
        )}
      </div>
    </PhaseCard>
  );
};

// Helper function cn (if not globally available, though it should be via utils)
// You might not need this if CreativeCard already imports and uses cn correctly.
// import { clsx } from "clsx"
// import { twMerge } from "tailwind-merge"
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }