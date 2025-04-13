import type { Meta, StoryObj } from '@storybook/react';
import { GameFinishedPhase } from './GameFinishedPhase'; // Updated import path

// Mock Data
const mockPlayers = [
  { id: 'p1', name: 'Alice', score: 150 },
  { id: 'p2', name: 'Bob', score: 125 },
  { id: 'p3', name: 'Charlie', score: 180 }, // Winner
  { id: 'p4', name: 'David (You)', score: 140 },
];

const meta = {
  title: 'Game Phases/GameFinishedPhase', // Keep organized title
  component: GameFinishedPhase,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    playersData: { control: 'object' },
    playerId: { control: 'text' },
  },
  args: { // Default args
    playersData: mockPlayers,
    playerId: 'p4', // Current player
  },
} satisfies Meta<typeof GameFinishedPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Uses default args
  },
};

export const YouWon: Story = {
  args: {
    playersData: [
        { id: 'p1', name: 'Alice', score: 150 },
        { id: 'p2', name: 'Bob', score: 125 },
        { id: 'p4', name: 'David (You)', score: 180 }, // You are the winner
        { id: 'p3', name: 'Charlie', score: 140 },
      ],
    playerId: 'p4',
  },
};

export const TieForFirst: Story = {
    args: {
      playersData: [
          { id: 'p1', name: 'Alice', score: 180 }, // Tie
          { id: 'p2', name: 'Bob', score: 125 },
          { id: 'p4', name: 'David (You)', score: 180 }, // Tie (You)
          { id: 'p3', name: 'Charlie', score: 140 },
        ],
      playerId: 'p4',
    },
  };