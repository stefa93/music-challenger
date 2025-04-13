import { useState, useCallback, useRef } from 'react';
import { searchMusicTracksAPI } from '@/services/firebaseApi'; // Renamed API function
import { MusicTrack } from '@/types/music'; // Use generic MusicTrack type
import logger from '@/lib/logger';

// Renamed interface to reflect generic nature
interface UseMusicSearchProps {
  gameId: string | null;
  playerId: string | null;
  allowExplicit: boolean; // Add setting prop
}

// Renamed hook
export const useMusicSearch = ({ gameId, playerId, allowExplicit }: UseMusicSearchProps) => { // Destructure allowExplicit
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]); // Use generic MusicTrack type
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (currentQuery: string) => {
    if (!currentQuery.trim() || !gameId || !playerId) {
      setSearchResults([]);
      setIsSearching(false);
      setIsSearchPopoverOpen(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const traceId = `musicSearch_${Date.now()}`; // Generic traceId prefix
    logger.debug(`[${traceId}] Performing music search for query: "${currentQuery}"`); // Generic log message

    try {
      // Pass allowExplicit to the API call
      const results = await searchMusicTracksAPI({ query: currentQuery, gameId, playerId, traceId, allowExplicit });
      setSearchResults(results);
      setIsSearchPopoverOpen(results.length > 0);
      logger.debug(`[${traceId}] Search successful, found ${results.length} tracks.`);
    } catch (error: any) {
      logger.error(`[${traceId}] Music search failed:`, error); // Generic log message
      setSearchError(error.message || "Failed to search music provider."); // Generic error message
      setSearchResults([]);
      setIsSearchPopoverOpen(false);
    } finally {
      setIsSearching(false);
    }
  }, [gameId, playerId, allowExplicit]); // Add allowExplicit to dependency array

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    // setSelectedTrack(null); // This will be handled by the nomination hook
    // setNominationError(null); // This will be handled by the nomination hook
    setIsSearchPopoverOpen(true);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (newQuery.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      setIsSearchPopoverOpen(false);
    }
  };

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(null);
    setIsSearchPopoverOpen(false);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []); // Memoize resetSearch


  return {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    isSearchPopoverOpen,
    setIsSearchPopoverOpen, // Expose setter for external control if needed
    handleSearchChange,
    resetSearch, // Expose reset function
    setSearchQuery, // Expose setter for external control (e.g., nomination hook)
    setSearchResults, // Expose setter for external control (e.g., nomination hook)
  };
};