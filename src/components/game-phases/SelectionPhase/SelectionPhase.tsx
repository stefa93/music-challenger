import React, { useState, useEffect, useMemo } from 'react';
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { CreativeInput } from "@/components/CreativeInput/CreativeInput";
import { CreativeCard } from "@/components/CreativeCard/CreativeCard";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MusicTrack } from '@/types/music';
import { AlertCircle, ListMusic, Loader2, Search, Timer } from 'lucide-react'; // Added Timer, ListMusic, Search icons
import { ScrollArea } from "@/components/ui/scroll-area";
import { Timestamp } from 'firebase/firestore';
import { CreativeTabs } from '@/components/CreativeTabs/CreativeTabs'; // Import Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import base Tabs components
// Define props
interface SelectionPhaseProps {
  challenge: string | null; // Allow null for initial state
  searchQuery: string;
  searchResults: MusicTrack[];
  predefinedSongs: MusicTrack[]; // Add prop for predefined songs
  selectedTrack: MusicTrack | null; // Use generic MusicTrack type
  isSearching: boolean;
  searchError: string | null;
  isSubmittingNomination: boolean;
  nominationError: string | null;
  isSearchPopoverOpen: boolean; // Added prop
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTrack: (track: MusicTrack) => void; // Use generic MusicTrack type
  onSongSubmit: () => void;
  setIsSearchPopoverOpen: (isOpen: boolean) => void; // Keep for potential future use? Or remove if search popover is gone. Assuming gone for now.
  // Timer props
  timeLimit: number | null;
  startTime: Timestamp | null;
}

export const SelectionPhase: React.FC<SelectionPhaseProps> = ({
  challenge,
  searchQuery,
  searchResults,
  selectedTrack,
  predefinedSongs = [], // Default to empty array
  isSearching,
  searchError,
  isSubmittingNomination,
  nominationError,
  onSearchChange,
  onSelectTrack,
  onSongSubmit,
  // Added missing props to destructuring
  // isSearchPopoverOpen, // Removed if popover concept is replaced by tabs
  // setIsSearchPopoverOpen, // Removed if popover concept is replaced by tabs
  // Timer props
  timeLimit,
  startTime,
}) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Calculate initial remaining time and set up interval
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

  return (
    <CreativeCard>
      {/* Use flexbox to position title/description and timer */}
      <CardHeader className="flex flex-row justify-between items-start gap-4"> {/* Changed to flex-row */}
        {/* Left side: Title and Description */}
        <div className="flex-1"> {/* Allow this part to grow */}
          <CardTitle className="font-handwritten">
            {/* Dynamically change title based on selection */}
            {selectedTrack ? 'Confirm Your Nomination' : 'Nominate Your Song'}
          </CardTitle>
          <CardDescription>
            {/* Dynamically change description based on selection */}
            {selectedTrack
              ? `You selected "${selectedTrack.name}". Submit it for the challenge:`
              : `Search for music and submit a song that fits the challenge:`} {/* Generic text */}
            <br />
            <span className="font-semibold">"{challenge}"</span>
          </CardDescription>
        </div>
        {/* Timer Display */}
        {formattedTime && (
          // Right side: Timer - Remove absolute positioning
          // Ensure this div is correctly placed *inside* the conditional block
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold font-handwritten border-2 border-foreground shadow-sm flex-shrink-0 ${isTimeUp ? 'text-destructive border-destructive animate-pulse' : 'text-primary border-primary'}`}>
            <Timer className="h-4 w-4" />
            {formattedTime}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* --- Tabs for Suggestions vs Search (Show only if no track is selected) --- */}
        {!selectedTrack && (
          <CreativeTabs defaultValue="suggestions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="suggestions">
                <ListMusic className="mr-2 h-4 w-4" /> Suggestions
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="mr-2 h-4 w-4" /> Search
              </TabsTrigger>
            </TabsList>

            {/* --- Suggestions Tab --- */}
            <TabsContent value="suggestions">
              <CardDescription className="mb-2 px-1">
                Choose one of these suggestions fitting the challenge, or search for your own.
              </CardDescription>
              {predefinedSongs.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No suggestions available for this challenge.</p>
              )}
              {predefinedSongs.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground px-1 pb-2">
                    Note: Only tracks with available 30-second previews (not grayed out) can be nominated.
                  </p>
                  <ScrollArea className="h-72 border rounded-md"> {/* Fixed height */}
                    <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {predefinedSongs.map((track) => (
                        <button
                          key={`predefined-${track.trackId}`}
                          onClick={() => (track.previewUrl && track.previewUrl !== '') && onSelectTrack(track)}
                          disabled={!track.previewUrl || track.previewUrl === '' || isTimeUp} // Disable if time up
                          className={`flex items-center gap-2 p-2 rounded-md text-left w-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${(track.previewUrl && track.previewUrl !== '')
                            ? 'hover:bg-accent hover:text-accent-foreground'
                            : 'opacity-50 cursor-not-allowed'
                            } ${isTimeUp ? 'opacity-50 cursor-not-allowed' : ''}`} // Extra disabled style if time up
                        >
                          {track.albumImageUrl ? (
                            <img src={track.albumImageUrl} alt={`Album art for ${track.albumName || track.name}`} className="h-10 w-10 rounded-sm object-cover flex-shrink-0" />
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
              {/* Search Input Section */}
              {/* Search Input Section (Hidden when track is selected) */}
              {/* Search Input Section - Redundant check removed */}
              <div className="space-y-2">
                <Label htmlFor="songSearch" className="font-handwritten">Search Music</Label>
                <div className="relative">
                  <CreativeInput
                    type="text"
                    id="songSearch"
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Search for a track..."
                    disabled={isSubmittingNomination || isTimeUp}
                    className="pr-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" role="status" aria-label="Searching..." />
                  )}
                </div>
                {!isSearching && searchError && (
                  <p className="text-sm text-destructive flex items-center gap-1 pt-1" role="alert">
                    <AlertCircle className="h-4 w-4" /> Search Error: {searchError}
                  </p>
                )}
              </div>
              {/* Explanation for disabled tracks */}
              {/* Explanation for disabled tracks - Redundant check removed */}
              {searchResults.length > 0 && (
                <p className="text-xs text-muted-foreground px-1 pt-1">
                  Note: Only tracks with available 30-second previews (not grayed out) can be nominated.
                </p>
              )}
              {/* Search Results Area */}
              {/* Search Results Area - Redundant check removed */}
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
                          onClick={() => (track.previewUrl && track.previewUrl !== '') && onSelectTrack(track)}
                          disabled={!track.previewUrl || track.previewUrl === ''}
                          className={`flex items-center gap-2 p-2 rounded-md text-left w-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${(track.previewUrl && track.previewUrl !== '')
                            ? 'hover:bg-accent hover:text-accent-foreground'
                            : 'opacity-50 cursor-not-allowed'
                            }`}
                        >
                          {track.albumImageUrl ? (
                            <img src={track.albumImageUrl} alt={`Album art for ${track.albumName || track.name}`} className="h-10 w-10 rounded-sm object-cover flex-shrink-0" />
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
        )} {/* Add closing parenthesis for the !selectedTrack condition */}
        {/* --- End Tabs --- */}


        {/* --- Selected Track Confirmation (Show only if track is selected) --- */}
        {selectedTrack && (
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            {/* Changed label slightly */}
            <p className="text-sm text-muted-foreground font-handwritten">Your nomination:</p>
            <div className="flex items-center gap-3 p-2 rounded-md border border-muted">
              {/* Use generic albumImageUrl */}
              {selectedTrack.albumImageUrl ? (
                <img src={selectedTrack.albumImageUrl} alt={`Album art for ${selectedTrack.albumName || selectedTrack.name}`} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0"></div> // Placeholder
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-base font-medium truncate font-handwritten">{selectedTrack.name}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedTrack.artistName}</p> {/* Use generic artistName */}
              </div>
            </div>
            <CreativeButton
              variant="outline"
              size="sm"
              onClick={() => onSelectTrack(null as any)} // Clear selection
              disabled={isSubmittingNomination} // Disable if submitting
              className="mt-2"
            >
              Change Selection
            </CreativeButton>
          </div>
        )}

      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex flex-col items-start gap-2 w-full">
          <CreativeButton
            onClick={onSongSubmit}
            className="w-full h-12"
            disabled={!selectedTrack || isSubmittingNomination || isTimeUp} // Disable if time is up
          >
            {isSubmittingNomination ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Nomination'
            )}
          </CreativeButton>
          {nominationError && (
            <p data-testid="nomination-error" className="text-sm text-destructive flex items-center gap-1 w-full justify-center" role="alert">
              <AlertCircle className="h-4 w-4" /> {nominationError}
            </p>
          )}
        </div>
      </CardFooter>
    </CreativeCard>
  );
};