import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SelectionPhase } from './SelectionPhase';
import { MusicTrack, MusicArtist, MusicAlbum } from '@/types/music';
import { fn } from '@storybook/test';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Mock Data
// Updated mock helpers for generic types
const mockArtist = (name: string): MusicArtist => ({ name, id: name.toLowerCase().replace(/ /g, '') });
// Removed mockImage helper
const mockAlbum = (name: string, imageUrl?: string): MusicAlbum => ({ name, id: name.toLowerCase().replace(/ /g, ''), imageUrl });

// Expanded Mock Search Results to test scrolling
// Updated mock data using generic MusicTrack structure
const mockSearchResults: MusicTrack[] = [
  { trackId: 'track1', name: 'Dancing Queen', artistName: 'ABBA', albumName: 'Arrival', albumImageUrl: 'https://via.placeholder.com/40/0000FF/808080', durationMs: 230000, previewUrl: 'https://example.com/preview1.mp3' }, // Added previewUrl for testing enabled state
  { trackId: 'track2', name: 'September', artistName: 'Earth, Wind & Fire', albumName: 'The Best Of', albumImageUrl: 'https://via.placeholder.com/40/FF0000/FFFFFF', durationMs: 210000, previewUrl: 'https://example.com/preview2.mp3' },
  { trackId: 'track3', name: 'Stayin\' Alive', artistName: 'Bee Gees', albumName: 'Saturday Night Fever', albumImageUrl: 'https://via.placeholder.com/40/00FF00/000000', durationMs: 240000, previewUrl: null }, // Test disabled state
  { trackId: 'track4', name: 'Le Freak', artistName: 'Chic', albumName: 'C\'est Chic', albumImageUrl: 'https://via.placeholder.com/40/FFFF00/000000', durationMs: 330000, previewUrl: 'https://example.com/preview4.mp3' },
  { trackId: 'track5', name: 'I Will Survive', artistName: 'Gloria Gaynor', albumName: 'Love Tracks', albumImageUrl: 'https://via.placeholder.com/40/FF00FF/FFFFFF', durationMs: 198000, previewUrl: 'https://example.com/preview5.mp3' },
  { trackId: 'track6', name: 'Good Times', artistName: 'Chic', albumName: 'Risqué', albumImageUrl: 'https://via.placeholder.com/40/00FFFF/000000', durationMs: 488000, previewUrl: 'https://example.com/preview6.mp3' },
  { trackId: 'track7', name: 'Y.M.C.A.', artistName: 'Village People', albumName: 'Cruisin\'', albumImageUrl: 'https://via.placeholder.com/40/FFA500/FFFFFF', durationMs: 287000, previewUrl: 'https://example.com/preview7.mp3' },
  { trackId: 'track8', name: 'Disco Inferno', artistName: 'The Trammps', albumName: 'Disco Inferno', albumImageUrl: 'https://via.placeholder.com/40/800080/FFFFFF', durationMs: 654000, previewUrl: null }, // Test disabled state
  { trackId: 'track9', name: 'Funky Town', artistName: 'Lipps Inc.', albumName: 'Mouth to Mouth', albumImageUrl: 'https://via.placeholder.com/40/008000/FFFFFF', durationMs: 240000, previewUrl: 'https://example.com/preview9.mp3' },
  { trackId: 'track10', name: 'Night Fever', artistName: 'Bee Gees', albumName: 'Saturday Night Fever', albumImageUrl: 'https://via.placeholder.com/40/00FF00/000000', durationMs: 213000, previewUrl: 'https://example.com/preview10.mp3' },
];

const meta = {
  title: 'Game Phases/SelectionPhase',
  component: SelectionPhase,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    challenge: { control: 'text' },
    searchQuery: { control: 'text' },
    searchResults: { control: 'object' },
    selectedTrack: { control: 'object' },
    isSearching: { control: 'boolean' },
    searchError: { control: 'text' },
    isSubmittingNomination: { control: 'boolean' },
    nominationError: { control: 'text' },
    onSearchChange: { action: 'searchChanged' },
    onSelectTrack: { action: 'trackSelected' },
    onSongSubmit: { action: 'songSubmitted' },
    // Add argTypes for timer props
    timeLimit: { control: 'number', description: 'Time limit in seconds (null for none)' },
    startTime: { control: 'object', description: 'Firestore Timestamp when phase started' },
  },
  args: { // Default args
    challenge: 'Best Disco Track',
    searchQuery: '',
    searchResults: [],
    selectedTrack: null,
    isSearching: false,
    searchError: null,
    isSubmittingNomination: false,
    nominationError: null,
    onSearchChange: fn(),
    onSelectTrack: fn(),
    onSongSubmit: fn(),
    isSearchPopoverOpen: false, // Added default value
    setIsSearchPopoverOpen: fn(),
    // Add default values for timer props
    timeLimit: 90,
    startTime: Timestamp.now(),
  },
} satisfies Meta<typeof SelectionPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper to manage state within Storybook
const InteractiveSelectionPhase: React.FC<React.ComponentProps<typeof SelectionPhase>> = (args) => {
  const [searchQuery, setSearchQuery] = useState(args.searchQuery ?? '');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>(args.searchResults ?? []); // Use MusicTrack
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(args.selectedTrack ?? null); // Use MusicTrack
  const [isSearching, setIsSearching] = useState(args.isSearching ?? false);
  const [searchError, setSearchError] = useState(args.searchError ?? null);
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(args.isSubmittingNomination ?? false);
  const [nominationError, setNominationError] = useState(args.nominationError ?? null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setSelectedTrack(null);
    setNominationError(null);
    args.onSearchChange(event);

    // Simulate search (debouncing would happen in parent)
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setTimeout(() => {
      setIsSearching(false);
      // Use the expanded mock data for 'disco'
      if (query.toLowerCase().includes('disco')) {
        setSearchResults(mockSearchResults);
      } else if (query.length > 0) {
        setSearchResults([]);
      } else {
        setSearchResults([]);
      }
    }, 750);
  };

  const handleSelectTrack = (track: MusicTrack) => { // Use MusicTrack
    setSelectedTrack(track);
    setSearchResults([]); // Clear results after selection
    args.onSelectTrack(track);
  };

  const handleSongSubmit = () => {
    args.onSongSubmit();
    setIsSubmittingNomination(true);
    setNominationError(null);
    setTimeout(() => {
      setIsSubmittingNomination(false);
      alert('Mock Submission Successful!');
    }, 1000);
  };

  return (
    <SelectionPhase
      {...args}
      searchQuery={searchQuery}
      searchResults={searchResults}
      selectedTrack={selectedTrack}
      isSearching={isSearching}
      searchError={searchError}
      isSubmittingNomination={isSubmittingNomination}
      nominationError={nominationError}
      onSearchChange={handleSearchChange}
      onSelectTrack={handleSelectTrack}
      onSongSubmit={handleSongSubmit}
    />
  );
};


export const Default: Story = {
  render: (args) => <InteractiveSelectionPhase {...args} />,
};

export const Searching: Story = {
    render: (args) => <InteractiveSelectionPhase {...args} />,
    args: {
      searchQuery: 'disco',
      isSearching: true,
    },
  };

export const WithResults: Story = {
    name: "With Results (Scrollable)", // Updated name for clarity
    render: (args) => <InteractiveSelectionPhase {...args} />,
    args: {
      searchQuery: 'disco',
      // Explicitly pass the results for initial render
      searchResults: mockSearchResults,
    },
  };

export const TrackSelected: Story = {
    render: (args) => <InteractiveSelectionPhase {...args} />,
    args: {
      selectedTrack: mockSearchResults[0],
      searchQuery: 'disco', // Keep query to show context if needed
    },
  };

export const Submitting: Story = {
    render: (args) => <InteractiveSelectionPhase {...args} />,
    args: {
      selectedTrack: mockSearchResults[0],
      searchQuery: 'disco',
      isSubmittingNomination: true,
    },
  };

export const SearchError: Story = {
    render: (args) => <InteractiveSelectionPhase {...args} />,
    args: {
      searchQuery: 'something else',
      searchError: 'Failed to connect to Spotify API.',
    },
  };

export const NominationError: Story = {
    render: (args) => <InteractiveSelectionPhase {...args} />,
    args: {
      selectedTrack: mockSearchResults[1],
      searchQuery: 'disco',
      nominationError: 'You have already submitted a song for this round.',
    },
  };