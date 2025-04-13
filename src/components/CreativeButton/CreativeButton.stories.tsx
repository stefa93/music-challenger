import type { Meta, StoryObj } from '@storybook/react';
import { CreativeButton } from './CreativeButton'; // Updated import path

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Components/Buttons/CreativeButton', // Keep organized title
  component: CreativeButton,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      description: {
        component: `The primary button component for the Songer application, implementing the "Creative Handwritten" style.
        
        This is a wrapper around the base \`shadcn/ui\` Button component (\`@/components/ui/button\`).
        It applies the specific styles defined in the [Design Style Guide](../../../docs/design-style-guide.md), including the handwritten font, custom border, offset shadow, and hover/active effects.
        
        Use this component for all standard button interactions. Apply layout and specific color variants (like the primary amber action) using Tailwind \`className\`.`,
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    // Define controls for props here if needed, e.g.:
    // backgroundColor: { control: 'color' },
    children: { control: 'text' },
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
  },
  args: { // Default args for all stories
    children: 'Creative Button',
    disabled: false,
  }
} satisfies Meta<typeof CreativeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const Default: Story = {
  args: {
    // Specific args for this story can override default args
  },
};

export const PrimaryAction: Story = {
  args: {
    children: 'Primary Action!',
    // Apply the amber background style as per the style guide
    className: 'bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-400',
  },
};

export const Disabled: Story = {
    args: {
      children: 'Disabled Button',
      disabled: true,
    },
  };