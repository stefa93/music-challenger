import type { Meta, StoryObj } from '@storybook/react';
import { ScoringPhase } from './ScoringPhase';

const meta = {
  title: 'Game Phases/ScoringPhase',
  component: ScoringPhase,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a loading state while scores are being calculated between rounds.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRound: {
        control: { type: 'number', min: 1 },
        description: 'The round number for which scores are being calculated.'
    },
  },
  args: { // Default args for Round 1
    currentRound: 1,
  },
} satisfies Meta<typeof ScoringPhase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Round1: Story = {
  name: "Scoring Round 1",
  args: {
    currentRound: 1,
  },
};

export const Round5: Story = {
    name: "Scoring Round 5",
    args: {
      currentRound: 5,
    },
  };

export const Round10: Story = {
    name: "Scoring Round 10",
    args: {
      currentRound: 10,
    },
  };