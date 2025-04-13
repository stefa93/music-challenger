import type { Meta, StoryObj } from '@storybook/react';
import { TextRotate } from './text-rotate';

const meta = {
  title: 'UI Effects/TextRotate', // Updated title for organization
  component: TextRotate,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A component that displays a list of texts, rotating through them with an animated effect. Each letter animates individually using Framer Motion.
        
        - **texts:** An array of strings to cycle through.
        - **mainClassName:** Tailwind classes applied to the main container span. Use this for overall text styling (font, size, color).
        - **rotationInterval:** Time in milliseconds between text rotations.
        - **staggerDuration:** Delay between each letter's animation start.
        - **transition:** Framer Motion transition object for the animation physics.
        
        Useful for dynamic headings or highlighting key terms.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    texts: { control: 'object' },
    mainClassName: { control: 'text' },
    // textClassName is not a valid prop, removed. Use mainClassName, splitLevelClassName, elementLevelClassName instead.
    rotationInterval: { control: 'number' },
    staggerDuration: { control: 'number' },
    transition: { control: 'object' },
  },
  args: { // Default args
    texts: ["Songer", "the Music Game", "the Challenge!", "Fun Times!"],
    mainClassName: 'text-4xl font-bold text-blue-600', // Example styling
    // textClassName: '', // Removed invalid prop
    rotationInterval: 2500,
    staggerDuration: 0.02,
    transition: { type: "spring", damping: 15, stiffness: 200 },
  },
} satisfies Meta<typeof TextRotate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Uses default args
  },
};

export const DifferentStyling: Story = {
  args: {
    texts: ["Create", "Join", "Play"],
    mainClassName: 'text-6xl font-handwritten text-amber-500', // Use creative font and color
    rotationInterval: 1500, // Fixed missing comma
  },
};

export const FasterRotation: Story = {
    args: {
      texts: ["Fast", "Quick", "Speedy", "Rapid"],
      mainClassName: 'text-3xl italic text-green-700',
      rotationInterval: 800, // Faster interval
      staggerDuration: 0.01,
    },
  };