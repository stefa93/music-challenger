import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test'; // Import fn for action logging

import { LobbyPhase, GameSettings } from './LobbyPhase'; // Import GameSettings type

// Mock Data
const mockPlayers = [
  { id: 'player1', name: 'Alice', score: 0 },
  { id: 'player2', name: 'Bob', score: 0 },
  { id: 'player3', name: 'Charlie', score: 0 },
];

// Default Settings for Stories
const defaultMockSettings: GameSettings = {
  rounds: 5,
  maxPlayers: 6,
  allowExplicit: false,
  selectionTimeLimit: 90,
  rankingTimeLimit: 60,
};

const meta = {
  title: 'Game Phases/LobbyPhase',
  component: LobbyPhase,
  parameters: {
    layout: 'centered', // Center the component in the Canvas
  },
  tags: ['autodocs'], // Enable automatic documentation
  argTypes: {
    gameId: { control: 'text', description: 'The unique ID of the game' },
    playersData: { control: 'object', description: 'Array of player objects' },
    playerId: { control: 'text', description: 'The ID of the current user' },
    creatorPlayerId: { control: 'text', description: 'The ID of the game creator' },
    initialSettings: { control: 'object', description: 'Initial game settings object' },
    onStartGame: { action: 'startGameClicked', description: 'Function called when the creator clicks Start Game' },
    onSettingsChange: { action: 'settingsChanged', description: 'Function called when settings are modified' },
  },
  args: { // Default args for all stories
    gameId: 'GAME123',
    initialSettings: defaultMockSettings, // Add default settings
    onStartGame: fn(),
    onSettingsChange: fn(), // Add mock action for settings change
  },
} satisfies Meta<typeof LobbyPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const WaitingForPlayers: Story = {
  args: {
    playersData: [],
    playerId: 'player1',
    creatorPlayerId: 'player1',
  },
};

export const WithPlayersCreatorView: Story = {
  args: {
    playersData: mockPlayers,
    playerId: 'player1', // Current user is the creator
    creatorPlayerId: 'player1',
  },
};

export const WithPlayersNonCreatorView: Story = {
  args: {
    playersData: mockPlayers,
    playerId: 'player2', // Current user is NOT the creator
    creatorPlayerId: 'player1',
  },
};

export const OnlyCreatorPresent: Story = {
  args: {
    playersData: [mockPlayers[0]], // Only Alice (creator) is present
    playerId: 'player1',
    creatorPlayerId: 'player1',
  },
};

export const NullGameId: Story = {
    args: {
      gameId: null, // Simulate case where gameId might be loading
      playersData: mockPlayers,
      playerId: 'player1',
      creatorPlayerId: 'player1',
    },
  };