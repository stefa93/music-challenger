import type { Meta, StoryObj } from '@storybook/react';
import { ChallengeAnnouncementPhase } from './ChallengeAnnouncementPhase';
import { fn } from '@storybook/test'; // Use fn for mock functions

const mockPlayers = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Charlie' },
];

const mockPredefinedChallenges = [
  'Songs about space travel',
  'Best song to sing in the shower',
  'Guilty pleasure pop songs',
  'Track with a killer bassline',
];

const meta = {
  title: 'Game Phases/ChallengeAnnouncementPhase',
  component: ChallengeAnnouncementPhase,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Existing
    challenge: { control: 'text', description: 'The announced challenge (null if not set)' },
    roundHostPlayerId: { control: 'select', options: [null, ...mockPlayers.map(p => p.id)], description: 'ID of the round host' },
    playersData: { control: 'object', description: 'List of players' },
    isStartingSelection: { control: 'boolean', description: 'Loading state for starting selection' },
    startSelectionError: { control: 'text', description: 'Error message for starting selection' },
    onStartSelectionPhase: { action: 'startSelectionPhaseClicked', description: 'Callback when Start Selection is clicked' },
    // New
    isHost: { control: 'boolean', description: 'Is the current user the host?' },
    predefinedChallenges: { control: 'object', description: 'List of predefined challenges' },
    isSettingChallenge: { control: 'boolean', description: 'Loading state for setting challenge' },
    onSetChallenge: { action: 'setChallengeClicked', description: 'Callback when Set Challenge is clicked' },
  },
  // Default args represent the HOST view BEFORE challenge is set
  args: {
    challenge: null, // Default: No challenge set yet
    roundHostPlayerId: 'p2', // Bob is the host
    playersData: mockPlayers,
    isHost: true, // Default: Viewing as the host
    predefinedChallenges: mockPredefinedChallenges,
    isSettingChallenge: false,
    isStartingSelection: false,
    startSelectionError: null,
    // Use fn() for mock callbacks
    onSetChallenge: fn(),
    onStartSelectionPhase: fn(),
  },
} satisfies Meta<typeof ChallengeAnnouncementPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story: Host view, before challenge is set
export const HostSettingChallenge: Story = {
  name: "Host View - Setting Challenge",
  args: {
    // Inherits default args (isHost: true, challenge: null)
  },
};

// Story: Host view, setting challenge loading state
export const HostSettingChallengeLoading: Story = {
  name: "Host View - Setting Challenge (Loading)",
  args: {
    isSettingChallenge: true,
  },
};


// Story: View after challenge is announced (for any player)
export const ChallengeAnnounced: Story = {
  name: "Challenge Announced (Host View)",
  args: {
    challenge: 'Songs that mention a specific color',
    // isHost: true (inherited)
  },
};

// Story: Non-host view, waiting for challenge
export const NonHostWaiting: Story = {
  name: "Non-Host View - Waiting",
  args: {
    isHost: false,
    challenge: null,
  },
};

// Story: Non-host view, after challenge is announced
export const NonHostChallengeSet: Story = {
  name: "Non-Host View - Challenge Set",
  args: {
    isHost: false,
    challenge: 'Songs that mention a specific color',
  },
};


// Story: Host view, challenge announced, starting selection phase loading state
export const StartingSelection: Story = {
  name: "Host View - Starting Selection (Loading)",
  args: {
    challenge: 'Songs that mention a specific color', // Ensure challenge is set
    isHost: true,
    isStartingSelection: true,
  },
};

// Story: Host view, challenge announced, error during starting selection
export const WithError: Story = {
  name: "Host View - Start Selection Error",
  args: {
    challenge: 'Songs that mention a specific color', // Ensure challenge is set
    isHost: true,
    startSelectionError: 'Failed to start selection phase. Please try again.',
  },
};