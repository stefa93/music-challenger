import type { Meta, StoryObj } from '@storybook/react';
import { CreativeInput } from './CreativeInput'; // Updated import path
import { Label } from '@/components/ui/label'; // Import Label for context

const meta = {
  title: 'Components/Forms/CreativeInput', // Keep organized title
  component: CreativeInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `The primary input component for the Songer application, implementing the "Creative Handwritten" style.
        
        This is a wrapper around the base \`shadcn/ui\` Input component (\`@/components/ui/input\`).
        It applies the specific styles defined in the [Design Style Guide](../../../docs/design-style-guide.md), primarily the handwritten font and the custom border. It does *not* currently include the offset shadow seen on buttons and cards.
        
        Use this component for all standard text input fields. It forwards props like \`type\`, \`placeholder\`, \`disabled\`, etc., to the underlying input. Apply layout constraints using Tailwind \`className\`.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
  },
  args: { // Default args
    type: 'text',
    placeholder: 'Enter text...',
    disabled: false,
    className: 'w-[300px]', // Default width
  }
} satisfies Meta<typeof CreativeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Uses default args
  },
};

export const WithLabel: Story = {
    render: (args) => (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email-input" className="font-handwritten text-lg">Email</Label>
        <CreativeInput {...args} id="email-input" type="email" placeholder="you@example.com" />
      </div>
    ),
    args: {
        className: '', // Remove default width for this layout
    }
  };

export const Disabled: Story = {
  args: {
    placeholder: 'Cannot type here',
    disabled: true,
  },
};