import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GameView from './GameView'; // Import the co-located component
import { GameStatus } from '@/types/game'; // Import GameStatus type

// Mock Data (can be expanded)
const mockPlayers = [
  { id: 'p1', name: 'Alice (Host)', score: 150 },
  { id: 'p2', name: 'Bob', score: 125 },
  { id: 'p3', name: 'Charlie', score: 180 },
  { id: 'p4', name: 'David (You)', score: 140 },
];

const mockRoundData = {
  playerSongs: {
    p1: { name: 'Dancing Queen', artist: 'ABBA' },
    p2: { name: 'September', artist: 'Earth, Wind & Fire' },
    p3: { name: 'Stayin\' Alive', artist: 'Bee Gees' },
    p4: { name: 'Waterloo', artist: 'ABBA' },
  },
  // Add other round-specific data if needed by phases
};

// Define possible game statuses for the control
const gameStatuses: GameStatus[] = [
    'round1_announcing',
    'round1_selecting',
    'round1_ranking',
    'round1_scoring',
    'round1_finished',
    'round2_announcing', // Example for next round
    'finished',
];

const meta = {
  title: 'Pages/GameView', // Place under Pages category
  component: GameView,
  parameters: {
    layout: 'fullscreen', // Use fullscreen to see the whole view
    docs: {
      description: {
        component: `The main view container for an active Songer game session.
        
        This component acts as a router or orchestrator, rendering the appropriate UI for the current phase of the game based on the \`gameData.status\` prop. It delegates the actual phase-specific UI and logic to sub-components located in \`src/components/game-phases/\` (e.g., \`ChallengeAnnouncementPhase\`, \`SelectionPhase\`, \`RankingPhase\`, etc.).
        
        It receives game state (\`gameData\`), player information (\`playersData\`), the current player's ID (\`playerId\`), and round-specific data (\`roundData\`) as props and passes them down to the relevant phase component.
        
        Use the 'Game Status' control below to switch between different phases of the game.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    gameData: { control: 'object' },
    playersData: { control: 'object' },
    playerId: { control: 'text' },
    gameId: { control: 'text' },
    roundData: { control: 'object' },
    // Add a custom control for selecting the game status
    statusControl: {
        control: 'select',
        options: gameStatuses,
        name: 'Game Status', // Custom label for the control
     },
  },
  args: { // Default args
    gameId: 'storybookGame123',
    playerId: 'p4', // Current player is David
    playersData: mockPlayers,
    roundData: mockRoundData, // Provide round data for phases that need it
    gameData: {
        currentRound: 1,
        challenge: 'Most Likely to Cause a Singalong',
        status: 'round1_selecting', // Default status for the story
        roundHostPlayerId: 'p1', // Alice is host
    },
  },
} satisfies Meta<typeof GameView>;

export default meta;
type Story = StoryObj<typeof meta>;

// The main story allows changing the status via controls
export const Interactive: Story = {
  render: (args) => {
    // Need to reconstruct gameData based on the custom status control
    const status = args.statusControl || 'round1_selecting'; // Get status from the custom control arg
    const updatedGameData = {
        ...args.gameData, // Keep other gameData args
        status: status, // Apply the selected status
        // Adjust other data based on status if needed (e.g., challenge for announcing)
        challenge: status.endsWith('_announcing') ? `Challenge for ${status}` : args.gameData?.challenge || 'Default Challenge',
        currentRound: parseInt(status.match(/round(\d+)/)?.[1] || '1', 10) || args.gameData?.currentRound || 1,
    };

    // Pass potentially updated roundData based on status if necessary
    const updatedRoundData = status.endsWith('_ranking') || status.endsWith('_scoring') || status.endsWith('_finished')
        ? args.roundData // Assume roundData is relevant for these phases
        : null; // Clear roundData for phases where it might not be set yet

    return <GameView {...args} gameData={updatedGameData} roundData={updatedRoundData} />;
  },
  args: {
    // Add the custom control to args
    statusControl: 'round1_selecting', // Set default for the control
  },
};

// Example of a specific state (optional, as controls handle it)
// export const AnnouncingPhase: Story = {
//   args: {
//     gameData: {
//       currentRound: 2,
//       challenge: 'Best Road Trip Song',
//       status: 'round2_announcing',
//       roundHostPlayerId: 'p2',
//     },
//     roundData: null, // No round data yet
//   },
// };