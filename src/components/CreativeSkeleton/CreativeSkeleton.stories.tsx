import type { Meta, StoryObj } from '@storybook/react';
import { CreativeSkeleton } from './CreativeSkeleton'; // Import the new component

// Meta information for the story
const meta: Meta<typeof CreativeSkeleton> = {
  title: 'Components/CreativeSkeleton', // Storybook path
  component: CreativeSkeleton,
  parameters: {
    // Optional parameters: layout, backgrounds, etc.
    layout: 'centered',
  },
  tags: ['autodocs'], // Enable automatic documentation generation
  argTypes: {
    // Define controls for props if needed, though Skeleton usually just uses className for sizing
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

// Default story (simulating a line of text)
export const Default: Story = {
  args: {
    className: 'h-4 w-[250px]', // Example size for a text line
  },
};

// Simulating an Avatar
export const Avatar: Story = {
  args: {
    className: 'h-12 w-12 rounded-full', // Example size for an avatar
  },
};

// Simulating a larger block (e.g., an image or card content)
export const Block: Story = {
  args: {
    className: 'h-[125px] w-[250px] rounded-md', // Example size for a block
  },
};

// Example within a flex container to show multiple skeletons
export const Group: Story = {
  render: (args) => (
    <div className="flex items-center space-x-4">
      <CreativeSkeleton {...args} className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <CreativeSkeleton {...args} className="h-4 w-[250px]" />
        <CreativeSkeleton {...args} className="h-4 w-[200px]" />
      </div>
    </div>
  ),
  args: {
    // Args for the wrapper, individual skeletons override className
  },
};