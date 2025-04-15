import React, { useState, useEffect, useMemo } from 'react';
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { CreativeInput } from "@/components/CreativeInput/CreativeInput";
import { PhaseCard } from "@/components/PhaseCard/PhaseCard"; // Removed PhaseCardProps import as it's not directly used here
import { Label } from "@/components/ui/label";
import { MusicTrack } from '@/types/music';
import { AlertCircle, ListMusic, Loader2, Search, Timer } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Timestamp } from 'firebase/firestore';
import { CreativeTabs } from '@/components/CreativeTabs/CreativeTabs';
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define props
interface SelectionPhaseProps {
  challenge: string | null;
  searchQuery: string;
  searchResults: MusicTrack[];
  predefinedSongs: MusicTrack[];
  selectedTrack: MusicTrack | null; // Locally selected track (before submission)
  isSearching: boolean;
  searchError: string | null;
  isSubmittingNomination: boolean;
  nominationError: string | null;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTrack: (track: MusicTrack | null) => void; // Allow null for clearing selection
  onSongSubmit: () => void;
  // Timer props
  timeLimit: number | null;
  startTime: Timestamp | null;
  // Added props to determine submission status
  playerId: string | null; // Current player's ID
  playerSongs: { [playerId: string]: any } | undefined; // Map of submitted songs from roundData
}

export const SelectionPhase: React.FC<SelectionPhaseProps> = ({
  challenge,
  searchQuery,
  searchResults,
  predefinedSongs = [],
  selectedTrack, // This is the locally selected track *before* submission
  isSearching,
  searchError,
  isSubmittingNomination,
  nominationError,
  onSearchChange,
  onSelectTrack,
  onSongSubmit,
  timeLimit,
  startTime,
  playerId,
  playerSongs,
}) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // --- Timer Logic ---
  useEffect(() => {
    if (!timeLimit || !startTime) {
      setRemainingTime(null);
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
    }, 1000);

    // Initial calculation
    const nowInitial = Date.now();
    const startMillisInitial = startTime.toMillis();
    const elapsedSecondsInitial = Math.floor((nowInitial - startMillisInitial) / 1000);
    const currentRemainingInitial = timeLimit - elapsedSecondsInitial;
    if (currentRemainingInitial <= 0) {
      setRemainingTime(0);
      setIsTimeUp(true);
      clearInterval(intervalId);
    } else {
      setRemainingTime(currentRemainingInitial);
      setIsTimeUp(false);
    }

    return () => clearInterval(intervalId);
  }, [timeLimit, startTime]);

  const formattedTime = useMemo(() => {
    if (remainingTime === null) return null;
    if (isTimeUp) return "Time's Up!";
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [remainingTime, isTimeUp]);

  // --- Submission Status & Display Logic ---

  // Determine if the current player has already submitted based on playerSongs prop
  const hasSubmitted = useMemo(() => {
    return !!(playerId && playerSongs && playerSongs[playerId]);
  }, [playerId, playerSongs]);

  // Determine the track to display: submitted track if available, otherwise the locally selected track
  const displayTrack = useMemo(() => {
    if (hasSubmitted && playerId && playerSongs?.[playerId]) {
      const submittedData = playerSongs[playerId];
      // Construct a MusicTrack-like object from submitted data
      return {
        trackId: submittedData.trackId || `submitted-${playerId}`, // Use trackId if present, fallback
        name: submittedData.name || 'Unknown Track',
        artistName: submittedData.artist || submittedData.artistName || 'Unknown Artist',
        albumImageUrl: submittedData.albumImageUrl,
        previewUrl: submittedData.previewUrl,
        // Add other fields if they exist in playerSongs[playerId] and are needed
      } as MusicTrack; // Assert as MusicTrack, ensure required fields are present
    }
    return selectedTrack; // Show locally selected track if not submitted
  }, [hasSubmitted, playerId, playerSongs, selectedTrack]);

  // --- PhaseCard Props ---
  const cardTitle = hasSubmitted ? "Your Nomination" : (displayTrack ? "Confirm Your Nomination" : "Nominate Your Song");

  // Combine description and challenge text logic
  const cardDescription = useMemo(() => {
    if (hasSubmitted && displayTrack) {
      return `You submitted "${displayTrack.name}". Waiting for others...`;
    }
    const baseText = displayTrack
      ? `You selected "${displayTrack.name}". Submit it for the challenge:`
      : `Search for music and submit a song that fits the challenge:`;
    // Append challenge text only if not submitted
    return (
      <>
        {baseText}
        {challenge && <><br /><span className="font-semibold">"{challenge}"</span></>}
      </>
    );
  }, [hasSubmitted, displayTrack, challenge]);


  const cardTimerDisplay = formattedTime && !hasSubmitted && ( // Hide timer after submission
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold font-handwritten border-2 border-foreground shadow-sm flex-shrink-0 ${
        isTimeUp
          ? "text-destructive border-destructive animate-pulse"
          : "text-primary border-primary"
      }`}
    >
      <Timer className="h-4 w-4" />
      {formattedTime}
    </div>
  );

  const cardFooterContent = !hasSubmitted ? ( // Only show submit button if not submitted
    <div className="flex flex-col items-start gap-2 w-full">
      <CreativeButton
        onClick={onSongSubmit}
        className="w-full h-12"
        disabled={!displayTrack || isSubmittingNomination || isTimeUp} // Disable if no track selected OR submitting OR time up
      >
        {isSubmittingNomination ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Nomination"
        )}
      </CreativeButton>
      {nominationError && (
        <p
          data-testid="nomination-error"
          className="text-sm text-destructive flex items-center gap-1 w-full justify-center"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" /> {nominationError}
        </p>
      )}
    </div>
  ) : null; // No footer content after submission

  // --- Render ---
  return (
    <PhaseCard
      title={cardTitle}
      description={cardDescription}
      // Removed incorrect challengeText prop
      timerDisplay={cardTimerDisplay}
      footerContent={cardFooterContent}
    >
      <div className="space-y-4 pt-4">
        {/* --- Tabs/Search/Suggestions (Show only if NOT submitted AND no track is locally selected) --- */}
        {!hasSubmitted && !displayTrack && (
          <CreativeTabs defaultValue="suggestions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="suggestions" disabled={isTimeUp}>
                <ListMusic className="mr-2 h-4 w-4" /> Suggestions
              </TabsTrigger>
              <TabsTrigger value="search" disabled={isTimeUp}>
                <Search className="mr-2 h-4 w-4" /> Search
              </TabsTrigger>
            </TabsList>

            {/* --- Suggestions Tab --- */}
            <TabsContent value="suggestions">
              <div className="mb-2 px-1 text-muted-foreground text-sm">
                Choose one of these suggestions fitting the challenge, or search for your own.
              </div>
              {predefinedSongs.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No suggestions available for this challenge.</p>
              )}
              {predefinedSongs.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground px-1 pb-2">
                    Note: Only tracks with available 30-second previews (not grayed out) can be nominated.
                  </p>
                  <ScrollArea className="h-72 border rounded-md">
                    <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {predefinedSongs.map((track) => (
                        <button
                          key={`predefined-${track.trackId}`}
                          onClick={() => (track.previewUrl && track.previewUrl !== "") && onSelectTrack(track)}
                          disabled={!track.previewUrl || track.previewUrl === "" || isTimeUp}
                          className={`flex items-center gap-2 p-2 rounded-md text-left w-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                            track.previewUrl && track.previewUrl !== ""
                              ? "hover:bg-accent hover:text-accent-foreground"
                              : "opacity-50 cursor-not-allowed"
                          } ${isTimeUp ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {track.albumImageUrl ? (
                            <img
                              src={track.albumImageUrl}
                              alt={`Album art for ${track.albumName || track.name}`}
                              className="h-10 w-10 rounded-sm object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-sm bg-muted flex-shrink-0"></div>
                          )}
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{track.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            {/* --- Search Tab --- */}
            <TabsContent value="search">
              <div className="space-y-2">
                <Label htmlFor="songSearch" className="font-handwritten">
                  Search Music
                </Label>
                <div className="relative">
                  <CreativeInput
                    type="text"
                    id="songSearch"
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Search for a track..."
                    disabled={isSubmittingNomination || isTimeUp} // Keep disabled logic
                    className="pr-10"
                  />
                  {isSearching && (
                    <Loader2
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
                      role="status"
                      aria-label="Searching..."
                    />
                  )}
                </div>
                {!isSearching && searchError && (
                  <p className="text-sm text-destructive flex items-center gap-1 pt-1" role="alert">
                    <AlertCircle className="h-4 w-4" /> Search Error: {searchError}
                  </p>
                )}
              </div>
              {searchResults.length > 0 && (
                <p className="text-xs text-muted-foreground px-1 pt-1">
                  Note: Only tracks with available 30-second previews (not grayed out) can be nominated.
                </p>
              )}
              <ScrollArea id="spotify-search-results-grid" className="border-t border-border pt-4 mt-4 h-60">
                {isSearching && searchResults.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">Searching...</p>
                )}
                {!isSearching && !searchError && searchResults.length === 0 && searchQuery.length > 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
                )}
                {searchResults.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {searchResults.map((track) => (
                        <button
                          key={track.trackId}
                          onClick={() => (track.previewUrl && track.previewUrl !== "") && onSelectTrack(track)}
                          disabled={!track.previewUrl || track.previewUrl === "" || isTimeUp} // Add timeUp check
                          className={`flex items-center gap-2 p-2 rounded-md text-left w-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                            track.previewUrl && track.previewUrl !== ""
                              ? "hover:bg-accent hover:text-accent-foreground"
                              : "opacity-50 cursor-not-allowed"
                          } ${isTimeUp ? "opacity-50 cursor-not-allowed" : ""}`} // Add timeUp check
                        >
                          {track.albumImageUrl ? (
                            <img
                              src={track.albumImageUrl}
                              alt={`Album art for ${track.albumName || track.name}`}
                              className="h-10 w-10 rounded-sm object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-sm bg-muted flex-shrink-0"></div>
                          )}
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{track.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </ScrollArea>
            </TabsContent>
          </CreativeTabs>
        )}

        {/* --- Selected/Submitted Track Confirmation --- */}
        {displayTrack && (
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <p className="text-sm text-muted-foreground font-handwritten">
              {hasSubmitted ? "Your submitted nomination:" : "Your selection:"}
            </p>
            <div className="flex items-center gap-3 p-2 rounded-md border border-muted">
              {displayTrack.albumImageUrl ? (
                <img
                  src={displayTrack.albumImageUrl}
                  alt={`Album art for ${displayTrack.albumName || displayTrack.name}`}
                  className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0"></div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-base font-medium truncate font-handwritten">{displayTrack.name}</p>
                <p className="text-sm text-muted-foreground truncate">{displayTrack.artistName}</p>
              </div>
            </div>
            {/* Show "Change Selection" only if NOT submitted */}
            {!hasSubmitted && (
              <CreativeButton
                variant="outline"
                size="sm"
                onClick={() => onSelectTrack(null)} // Clear local selection
                disabled={isSubmittingNomination || isTimeUp} // Disable if submitting or time up
                className="mt-2"
              >
                Change Selection
              </CreativeButton>
            )}
          </div>
        )}
      </div>
    </PhaseCard>
  );
};