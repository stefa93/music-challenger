import type { Meta, StoryObj } from '@storybook/react';
import Floating, { FloatingElement } from './parallax-floating'; // Default and named import

const meta = {
  title: 'UI Effects/ParallaxFloating', // Updated title for organization
  component: Floating,
  subcomponents: { FloatingElement }, // Document subcomponent
  parameters: {
    layout: 'fullscreen', // Use fullscreen layout to better see the effect
    docs: {
      description: {
        component: `A container component (\`Floating\`) and child component (\`FloatingElement\`) used to create a simple parallax effect based on mouse position within the container.
        
        - **Floating:** The main container that listens for mouse movement. Requires relative positioning and overflow hidden usually. The \`sensitivity\` prop controls how much the elements react to mouse movement.
        - **FloatingElement:** Represents an individual item within the container that will move based on the mouse. Its position is controlled by standard Tailwind positioning classes (\`top\`, \`left\`, \`bottom\`, \`right\`). The \`depth\` prop determines how much this specific element moves relative to others (higher depth = more movement).
        
        This effect is used, for example, in the Onboarding screen background to add subtle visual interest.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: false }, // Children are typically FloatingElements, not controlled directly
    className: { control: 'text' },
    sensitivity: { control: 'number', min: 0, max: 5, step: 0.1 },
  },
  args: { // Default args for Floating container
    className: 'relative w-full h-[400px] bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden border rounded-md', // Example background and size
    sensitivity: 1,
  },
} satisfies Meta<typeof Floating>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base story showing the container and elements
export const Default: Story = {
  args: { children: null }, // Add placeholder children
  render: (args) => (
    <Floating {...args}>
      {/* Example Floating Elements */}
      <FloatingElement depth={0.2} className="top-[10%] left-[10%]">
        <div className="w-16 h-16 bg-blue-500 rounded-full shadow-lg opacity-80 rotate-12"></div>
      </FloatingElement>
      <FloatingElement depth={0.6} className="top-[25%] right-[15%]">
        <div className="w-24 h-24 bg-purple-500 rounded-lg shadow-lg opacity-80 -rotate-6"></div>
      </FloatingElement>
      <FloatingElement depth={1.0} className="bottom-[15%] left-[25%]">
        <div className="w-20 h-20 bg-pink-500 rounded-xl shadow-lg opacity-80 rotate-3"></div>
      </FloatingElement>
       <FloatingElement depth={1.4} className="bottom-[20%] right-[30%]">
        <span className="text-4xl opacity-70">✨</span>
      </FloatingElement>
       <FloatingElement depth={0.4} className="top-[60%] left-[45%]">
         <div className="w-12 h-12 border-4 border-dashed border-green-500 rounded-full opacity-70"></div>
      </FloatingElement>
      {/* Add text in the center for reference */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-center text-gray-600 font-semibold">Move mouse over this area</p>
      </div>
    </Floating>
  ),
};

export const HigherSensitivity: Story = {
    render: (args) => (
        <Floating {...args}>
          <FloatingElement depth={0.5} className="top-[30%] left-[30%]">
            <div className="w-20 h-20 bg-yellow-400 rounded-full shadow-lg opacity-80"></div>
          </FloatingElement>
          <FloatingElement depth={1.5} className="bottom-[30%] right-[30%]">
            <div className="w-20 h-20 bg-teal-500 rounded-lg shadow-lg opacity-80"></div>
          </FloatingElement>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-center text-gray-600 font-semibold">Higher Sensitivity (Move mouse)</p>
          </div>
        </Floating>
      ),
    args: {
      children: null, // Add placeholder children to satisfy TS
      sensitivity: 3, // Increased sensitivity
    },
  };

export const LowerSensitivity: Story = {
    render: (args) => (
        <Floating {...args}>
            <FloatingElement depth={0.5} className="top-[30%] left-[30%]">
                <div className="w-20 h-20 bg-red-500 rounded-full shadow-lg opacity-80"></div>
            </FloatingElement>
            <FloatingElement depth={1.5} className="bottom-[30%] right-[30%]">
                <div className="w-20 h-20 bg-indigo-600 rounded-lg shadow-lg opacity-80"></div>
            </FloatingElement>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-center text-gray-600 font-semibold">Lower Sensitivity (Move mouse)</p>
            </div>
        </Floating>
        ),
    args: {
        children: null, // Add placeholder children to satisfy TS
        sensitivity: 0.3, // Decreased sensitivity
    },
};