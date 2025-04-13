import type { Meta, StoryObj } from '@storybook/react';
import { RoundFinishedPhase } from './RoundFinishedPhase';
import { fn } from '@storybook/test';

// Define types consistent with component props
interface SongResult {
  playerId: string;
  playerName: string;
  songName: string;
  songArtist: string;
  pointsAwarded: number;
  isWinner: boolean;
  albumArtUrl?: string;
}

interface RoundWinnerData {
    winnerNames: string[];
    winningScore: number;
}

// Mock Data
const mockResultsSingleWinner: SongResult[] = [
  { playerId: 'p2', playerName: 'Bob', songName: 'September', songArtist: 'Earth, Wind & Fire', pointsAwarded: 15, isWinner: true, albumArtUrl: 'https://via.placeholder.com/40/FF0000/FFFFFF' },
  { playerId: 'p1', playerName: 'Alice', songName: 'Dancing Queen', songArtist: 'ABBA', pointsAwarded: 10, isWinner: false, albumArtUrl: 'https://via.placeholder.com/40/0000FF/808080' },
  { playerId: 'p3', playerName: 'Charlie', songName: 'Stayin\' Alive', songArtist: 'Bee Gees', pointsAwarded: 5, isWinner: false, albumArtUrl: 'https://via.placeholder.com/40/00FF00/000000' },
];
const mockWinnerSingle: RoundWinnerData = { winnerNames: ['Bob'], winningScore: 15 };

const mockResultsTie: SongResult[] = [
    { playerId: 'p1', playerName: 'Alice', songName: 'Dancing Queen', songArtist: 'ABBA', pointsAwarded: 12, isWinner: true, albumArtUrl: 'https://via.placeholder.com/40/0000FF/808080' },
    { playerId: 'p3', playerName: 'Charlie', songName: 'Stayin\' Alive', songArtist: 'Bee Gees', pointsAwarded: 12, isWinner: true, albumArtUrl: 'https://via.placeholder.com/40/00FF00/000000' },
    { playerId: 'p2', playerName: 'Bob', songName: 'September', songArtist: 'Earth, Wind & Fire', pointsAwarded: 8, isWinner: false, albumArtUrl: 'https://via.placeholder.com/40/FF0000/FFFFFF' },
];
const mockWinnerTie: RoundWinnerData = { winnerNames: ['Alice', 'Charlie'], winningScore: 12 };


const meta = {
  title: 'Game Phases/RoundFinishedPhase',
  component: RoundFinishedPhase,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currentRound: { control: 'number' },
    roundResults: { control: 'object' },
    roundWinnerData: { control: 'object' },
    isStartingNextRound: { control: 'boolean' },
    startNextRoundError: { control: 'text' },
    onStartNextRound: { action: 'startNextRoundClicked' },
  },
  args: { // Default args: Single Winner scenario
    currentRound: 3,
    roundResults: mockResultsSingleWinner,
    roundWinnerData: mockWinnerSingle,
    isStartingNextRound: false,
    startNextRoundError: null,
    onStartNextRound: fn(),
  },
} satisfies Meta<typeof RoundFinishedPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultSingleWinner: Story = {
  name: "Round Finished - Single Winner",
  args: {
    // Uses default args
  },
};

export const TieForWinner: Story = {
    name: "Round Finished - Tie",
    args: {
      currentRound: 4,
      roundResults: mockResultsTie,
      roundWinnerData: mockWinnerTie,
    },
  };

export const StartingNextRound: Story = {
    name: "Starting Next Round",
    args: {
      isStartingNextRound: true,
    },
  };

export const StartNextRoundError: Story = {
    name: "Start Next Round Error",
    args: {
      startNextRoundError: "Failed to start the next round. Please try again.",
    },
  };

export const NoResults: Story = {
    name: "Round Finished - No Results",
    args: {
        currentRound: 1,
        roundResults: [],
        roundWinnerData: null,
    },
};