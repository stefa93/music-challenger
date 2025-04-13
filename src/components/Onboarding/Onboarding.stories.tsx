import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// Removed MemoryRouter import as OnboardingForm doesn't use routing directly
import { SubmitHandler } from 'react-hook-form';
import { OnboardingForm } from './OnboardingForm'; // Import the new form component
import { OnboardingFormData } from './OnboardingForm'; // Import form data type from the form component

// Mock function for the onSubmit prop
const mockOnSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
  console.log('Mock Onboarding Submit:', data);
  alert(`Mock Submit Triggered!\nAction: ${data.action}\nName: ${data.displayName}\nGame ID: ${data.gameId || 'N/A'}`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async call
  // In a real scenario, you might throw an error here for the error story
  // if (data.displayName.toLowerCase() === 'error') {
  //   throw new Error("Simulated submission error!");
  // }
};

const meta = {
  title: 'Components/Forms/OnboardingForm', // Title is already correct
  component: OnboardingForm, // Point component to the new form
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `The form component used within the main Onboarding screen.
        
        Handles user input for either creating a new game (display name) or joining an existing game (display name and game ID). It uses \`react-hook-form\` for validation and state management.
        
        It utilizes \`CreativeTabs\` to switch between "Create Game" and "Join Game" modes, and \`CreativeInput\` and \`CreativeButton\` for the form elements, all styled according to the "Creative Handwritten" theme.
        
        Props control the submission handler (\`onSubmit\`), loading state (\`isLoading\`), and error display (\`error\`).`,
      },
    },
  },
  // Decorator removed as OnboardingForm doesn't need MemoryRouter
  tags: ['autodocs'],
  argTypes: {
    // Define argTypes for the actual props
    onSubmit: { action: 'submitted' }, // Log action in Storybook UI
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: { // Default args using correct props
    onSubmit: mockOnSubmit,
    isLoading: false,
    error: null,
  },
} satisfies Meta<typeof OnboardingForm>; // Update Meta type

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {
    // Uses default args from meta
  },
};

export const LoadingCreate: Story = {
  args: {
    isLoading: true,
    // To properly simulate loading state for a specific action (create vs join),
    // would require internal component state manipulation or more complex story setup.
    // This story shows the general loading state.
  },
  parameters: {
    docs: {
        description: {
            story: 'Shows the component in a loading state (e.g., after clicking "Create Game"). The button shows "Creating..." and is disabled.',
        },
    },
  },
};

export const LoadingJoin: Story = {
    args: {
      isLoading: true,
      // Similar to LoadingCreate, this shows the general loading state.
      // The specific button text ("Joining...") depends on internal component state (active tab).
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the component in a loading state (e.g., after clicking "Join Game"). The button shows "Joining..." and is disabled.',
            },
        },
      },
  };


export const WithError: Story = {
  args: {
    error: 'Invalid Game ID. Please check and try again.',
  },
};

// Note: Stories for specific tab states (Create vs Join active) are hard to represent
// directly with args as it depends on internal component state managed by CreativeTabs.
// These states are best tested via interaction in Storybook or using integration/E2E tests.