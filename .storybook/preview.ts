import React from 'react'; // Ensure React is imported
import type { Preview, Decorator } from '@storybook/react';
import '../src/index.css'; // Import global styles

// Define the decorator function using React.createElement
const withWidthConstraint: Decorator = (Story) => {
  return React.createElement(
    'div', // Element type
    { // Props
      className: "w-full md:min-w-[800px] md:max-w-4xl mx-auto py-4 px-4 md:px-0"
    },
    React.createElement(Story) // Render the story component as a child
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  // Add the decorator to the global decorators array
  decorators: [withWidthConstraint],
};

export default preview;