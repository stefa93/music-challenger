import type { Meta, StoryObj } from '@storybook/react';
import { CreativeCard } from './CreativeCard';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CreativeButton } from '@/components/CreativeButton/CreativeButton';

const meta = {
  title: 'Components/Layout/CreativeCard',
  component: CreativeCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `The primary card/container component for the Songer application, implementing the "Creative Handwritten" style.

        This is a wrapper around the base \`shadcn/ui\` Card component but primarily applies styling (border, shadow, hover effects) to its children. It's designed to contain standard \`CardHeader\`, \`CardContent\`, \`CardFooter\` etc. from \`@/components/ui/card\`.

        It applies the specific styles defined in the [Design Style Guide](../../../docs/design-style-guide.md), including the thick border, custom offset shadow, and hover effects (translation + shadow change).

        **New:** Includes an optional info popover triggered by an icon in the top-right corner via the \`infoPopoverContent\` and \`infoPopoverTitle\` props.

        Use this component as a container for related content sections. Apply layout and subtle rotation variants using Tailwind \`className\`.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'object' },
    className: { control: 'text' },
    // Added new props
    infoPopoverTitle: { control: 'text', description: 'Optional title for the info popover' },
    infoPopoverContent: { control: 'object', description: 'Optional content (ReactNode) for the info popover' },
  },
  args: {
    className: 'w-[350px]', // Default width for demonstration
    // Default new props to undefined
    infoPopoverTitle: undefined,
    infoPopoverContent: undefined,
  }
} satisfies Meta<typeof CreativeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content area of the creative card. It showcases the typical structure.</p>
        </CardContent>
        <CardFooter>
          <CreativeButton>Action</CreativeButton>
        </CardFooter>
      </>
    ),
  },
};

// New Story for Info Popover
export const WithInfoPopover: Story = {
    name: "With Info Popover",
    args: {
      infoPopoverTitle: "Card Information",
      infoPopoverContent: (
        <>
          <p>This popover provides extra context or help related to the card's content.</p>
          <p className="mt-2">It's triggered by the <span className="font-bold">info icon</span> in the top-right corner.</p>
        </>
      ),
      children: (
        <>
          <CardHeader>
            <CardTitle>Card With Info</CardTitle>
            <CardDescription>Hover over or click the info icon!</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This card demonstrates the optional info popover feature.</p>
          </CardContent>
          <CardFooter>
            <CreativeButton>Action</CreativeButton>
          </CardFooter>
        </>
      ),
    },
  };


export const RotatedNegative1: Story = {
  args: {
    className: 'w-[350px] rotate-[-1deg]',
    children: (
      <>
        <CardHeader>
          <CardTitle>Rotated Card (-1deg)</CardTitle>
          <CardDescription>Slightly tilted</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has a subtle -1 degree rotation.</p>
        </CardContent>
        <CardFooter>
          <CreativeButton className="bg-purple-500 text-white hover:bg-purple-400">Another Action</CreativeButton>
        </CardFooter>
      </>
    ),
  },
};

export const RotatedPositive1: Story = {
  args: {
    className: 'w-[350px] rotate-[1deg]',
    children: (
      <>
        <CardHeader>
          <CardTitle>Rotated Card (+1deg)</CardTitle>
          <CardDescription>Slightly tilted the other way</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has a subtle +1 degree rotation.</p>
        </CardContent>
        <CardFooter>
          <CreativeButton className="bg-green-500 text-white hover:bg-green-400">Go!</CreativeButton>
        </CardFooter>
      </>
    ),
  },
};

export const RotatedNegative2: Story = {
    args: {
      className: 'w-[350px] rotate-[-2deg]',
      children: (
        <>
          <CardHeader>
            <CardTitle>Rotated Card</CardTitle>
            <CardDescription>Slightly tilted</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This card has a subtle rotation applied for the hand-drawn effect.</p>
          </CardContent>
          <CardFooter>
            <CreativeButton className="bg-blue-500 text-white hover:bg-blue-400">Info</CreativeButton>
          </CardFooter>
        </>
      ),
    },
  };