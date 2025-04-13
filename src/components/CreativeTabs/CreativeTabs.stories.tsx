import type { Meta, StoryObj } from '@storybook/react';
import {
  CreativeTabs,
  CreativeTabsList,
  CreativeTabsTrigger,
  CreativeTabsContent,
} from './CreativeTabs'; // Updated import path

const meta = {
  title: 'Components/Navigation/CreativeTabs', // Keep organized title
  component: CreativeTabs,
  subcomponents: { CreativeTabsList, CreativeTabsTrigger, CreativeTabsContent }, // Document subcomponents
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A set of components for building tabbed interfaces in the Songer application, implementing the "Creative Handwritten" style.
        
        These are wrappers around the base \`shadcn/ui\` Tabs components (\`@radix-ui/react-tabs\`), specifically \`Tabs\`, \`TabsList\`, \`TabsTrigger\`, and \`TabsContent\`.
        
        The primary styling is applied to \`CreativeTabsTrigger\`, which mimics the \`CreativeButton\`'s active state (border, shadow, background change, translation) as defined in the [Design Style Guide](../../../docs/design-style-guide.md). \`CreativeTabsList\` and \`CreativeTabsContent\` currently use default shadcn/ui styling.
        
        Use these components together to create navigable tabbed sections.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    // We don't typically control the children directly via args for Tabs
  },
  args: { // Default args
    defaultValue: 'account',
    className: 'w-[400px]', // Default width for demonstration
  }
} satisfies Meta<typeof CreativeTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <CreativeTabs {...args}>
      <CreativeTabsList>
        <CreativeTabsTrigger value="account">Account</CreativeTabsTrigger>
        <CreativeTabsTrigger value="password">Password</CreativeTabsTrigger>
        <CreativeTabsTrigger value="notifications">Notifications</CreativeTabsTrigger>
      </CreativeTabsList>
      <CreativeTabsContent value="account">
        <p className="p-4 font-handwritten text-lg">Account settings would go here. Notice the active tab style!</p>
      </CreativeTabsContent>
      <CreativeTabsContent value="password">
        <p className="p-4 font-handwritten text-lg">Password change form would go here.</p>
      </CreativeTabsContent>
      <CreativeTabsContent value="notifications">
        <p className="p-4 font-handwritten text-lg">Notification preferences would go here.</p>
      </CreativeTabsContent>
    </CreativeTabs>
  ),
  args: {
    // Uses default args from meta
  },
};

export const AnotherTabActive: Story = {
    render: (args) => (
      <CreativeTabs {...args}>
        <CreativeTabsList>
          <CreativeTabsTrigger value="account">Account</CreativeTabsTrigger>
          <CreativeTabsTrigger value="password">Password</CreativeTabsTrigger>
          <CreativeTabsTrigger value="notifications">Notifications</CreativeTabsTrigger>
        </CreativeTabsList>
        <CreativeTabsContent value="account">
          <p className="p-4 font-handwritten text-lg">Account settings would go here.</p>
        </CreativeTabsContent>
        <CreativeTabsContent value="password">
          <p className="p-4 font-handwritten text-lg">Password change form would go here. This one is active!</p>
        </CreativeTabsContent>
        <CreativeTabsContent value="notifications">
          <p className="p-4 font-handwritten text-lg">Notification preferences would go here.</p>
        </CreativeTabsContent>
      </CreativeTabs>
    ),
    args: {
      defaultValue: 'password', // Set a different default active tab
    },
  };