import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RankingPhase } from './RankingPhase';
import { fn } from '@storybook/test';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Define types consistent with component
interface SongData {
  name: string;
  artist: string;
  albumArtUrl?: string;
}
interface PlayerSongsMap {
  [playerId: string]: SongData;
}

// Mock Data
const mockPlayerSongs: PlayerSongsMap = {
  p1: { name: 'Dancing Queen', artist: 'ABBA' },
  p2: { name: 'September', artist: 'Earth, Wind & Fire' },
  p3: { name: 'Stayin\' Alive', artist: 'Bee Gees' },
  p4: { name: 'Waterloo', artist: 'ABBA' }, // Current player's song (p4)
};

const meta = {
  title: 'Game Phases/RankingPhase',
  component: RankingPhase,
  parameters: {
    layout: 'centered',
    // Add notes about dnd-kit context if needed for complex stories,
    // but basic rendering should work.
  },
  tags: ['autodocs'],
  argTypes: {
    playerId: { control: 'text' },
    roundData: { control: 'object' },
    // rankings removed
    isSubmittingRanking: { control: 'boolean' },
    hasSubmittedRanking: { control: 'boolean' },
    rankingError: { control: 'text' },
    // onRankChange removed
    onRankingSubmit: { action: 'rankingSubmitted', description: '(rankedPlayerIds: string[]) => void' },
    // Add timer prop
    timeLimit: { control: 'number', description: 'Time limit in seconds (null for none)' },
  },
  args: { // Default args
    playerId: 'p4', // Current player
    roundData: { playerSongs: mockPlayerSongs, rankingStartTime: Timestamp.now() }, // Add rankingStartTime
    // rankings removed
    isSubmittingRanking: false,
    hasSubmittedRanking: false,
    rankingError: null,
    onRankingSubmit: fn(),
    timeLimit: 60, // Add default timeLimit
  },
} satisfies Meta<typeof RankingPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper is no longer needed as dnd-kit handles internal state
// We just need to pass the correct props for different scenarios

export const Default: Story = {
  name: "Default Ranking View",
  args: {
    // Uses default args from meta
  },
};

export const Submitting: Story = {
  name: "Submitting State",
  args: {
    isSubmittingRanking: true, // Show submitting state
  },
};

export const Submitted: Story = {
  name: "Submitted State",
  args: {
    hasSubmittedRanking: true, // Show submitted state
  },
};

export const WithError: Story = {
  name: "With Submission Error",
  args: {
    rankingError: 'Failed to submit rankings. Please try again.', // Example error
  },
};

export const NoSongsToRank: Story = {
  name: "No Other Songs To Rank",
  args: {
    roundData: { playerSongs: { p4: { name: 'My Only Song', artist: 'Me' } } }, // Only current player submitted
  },
};

export const OnlyOneOtherSong: Story = {
    name: "Only One Other Song",
    args: {
      roundData: { playerSongs: {
        p1: { name: 'Dancing Queen', artist: 'ABBA' },
        p4: { name: 'Waterloo', artist: 'ABBA' }, // Current player
      }},
    },
  };