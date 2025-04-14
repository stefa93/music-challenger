import { useState, useCallback } from 'react';
import { submitSongNominationAPI } from '@/services/firebaseApi'; // Remove TrackDetailsPayload import
import { MusicTrack } from '@/types/music';
import { SongNominationInputPayload } from '@/types/round'; // Import new payload type
import logger from '@/lib/logger';

interface UseSongNominationProps {
  gameId: string | null;
  playerId: string | null;
  // Functions from useSpotifySearch to control its state
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: MusicTrack[]) => void; // Use generic MusicTrack type
  setIsSearchPopoverOpen: (isOpen: boolean) => void;
}

export const useSongNomination = ({
  gameId,
  playerId,
  setSearchQuery,
  setSearchResults,
  setIsSearchPopoverOpen,
}: UseSongNominationProps) => {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null); // Use generic MusicTrack type
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);
  const [nominationError, setNominationError] = useState<string | null>(null);
  const [selectionSource, setSelectionSource] = useState<'search' | 'predefined' | null>(null); // Track selection source

  // Modified handleSelectTrack to accept source
  const handleSelectTrack = useCallback((track: MusicTrack | null, source: 'search' | 'predefined' | null = 'search') => {
    setSelectedTrack(track);
    setSelectionSource(track ? source : null); // Set source only if track is selected
    setNominationError(null); // Clear error on selection

    if (track) {
      // Update search query visually only if selected from search? Or always? Let's update always for now.
      setSearchQuery(`${track.name} - ${track.artistName}`);
      setSearchResults([]); // Hide results list after selection
      setIsSearchPopoverOpen(false); // Close popover/tabs on selection
      logger.debug(`Track selected: ${track.name} (Source: ${source})`);
    } else {
      // If track is null (e.g., "Change Selection" clicked), reset search query
      setSearchQuery('');
      logger.debug('Track selection cleared.');
    }
  }, [setSearchQuery, setSearchResults, setIsSearchPopoverOpen]);

  const handleSongSubmit = useCallback(async () => {
    setNominationError(null);
    if (!selectedTrack || !gameId || !playerId) {
      logger.error("Missing data for song submission:", { gameId, playerId, selectedTrack });
      setNominationError("Please search and select a track first.");
      return;
    }

    setIsSubmittingNomination(true);
    const traceId = `submitNomination_${Date.now()}`;
    logger.debug(`[${traceId}] Submitting song nomination: ${selectedTrack.name}`);

    // Construct the correct payload based on selection source
    let nominationPayload: SongNominationInputPayload;
    if (selectionSource === 'predefined' && selectedTrack?.trackId) {
      nominationPayload = { predefinedTrackId: selectedTrack.trackId };
      logger.debug(`[${traceId}] Submitting predefined track ID: ${selectedTrack.trackId}`);
    } else if (selectedTrack) { // Assume 'search' or null source defaults to search result
      // Omit frontend-only fields like submittedAt, selectionSource
      // Destructure, removing the newly added optional 'selectionSource'
      // 'submittedAt' was already correctly absent from the frontend MusicTrack type
      const { selectionSource: src, artistName, ...rest } = selectedTrack;
      // Map artistName to artist for backend compatibility
      nominationPayload = { searchResult: { ...rest, artist: artistName } };
      logger.debug(`[${traceId}] Submitting search result track: ${selectedTrack.name}`);
    } else {
      // This case should ideally not be reached due to the check at the start
      setNominationError("Cannot submit: No track selected.");
      setIsSubmittingNomination(false);
      return;
    }

    try {
      // Update API call signature later in firebaseApi.ts
      await submitSongNominationAPI({ gameId, playerId, nominationPayload, traceId });
      logger.info(`[${traceId}] Song submitted successfully!`);
      // Clear state on success using resetNomination
      resetNomination(); // Call reset function
    } catch (error: any) {
      logger.error(`[${traceId}] Error submitting song nomination:`, error);
      setNominationError(error.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmittingNomination(false);
    }
  // Removed resetNomination from dependencies as it causes a cycle
  }, [selectedTrack, gameId, playerId, selectionSource, setSearchQuery, setSearchResults, setIsSearchPopoverOpen]);

  const resetNomination = useCallback(() => {
    setSelectedTrack(null);
    setIsSubmittingNomination(false);
    setNominationError(null);
    // Also clear the search state via the passed setters
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchPopoverOpen(false); // Close popover/tabs
    setSelectionSource(null); // Reset selection source
    logger.debug('Nomination state reset.');
  }, [setSearchQuery, setSearchResults, setIsSearchPopoverOpen]);


  return {
    selectedTrack,
    isSubmittingNomination,
    nominationError,
    handleSelectTrack,
    handleSongSubmit,
    resetNomination, // Expose reset function
  };
};