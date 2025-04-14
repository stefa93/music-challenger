import React from "react";
import { PhaseCard } from "./PhaseCard";

export default {
  title: "Components/PhaseCard",
  component: PhaseCard,
};

export const Default = {
  args: {
    title: "Phase Title",
    description: "This is a description for the phase. It can be instructions or context for the current game phase.",
    infoPopoverTitle: "What is this phase?",
    infoPopoverContent: (
      <span>
        This popover provides more information about the phase. You can use it to explain rules or give tips.
      </span>
    ),
    timerDisplay: (
      <span className="font-mono text-lg bg-muted px-2 py-1 rounded">
        01:23
      </span>
    ),
    footerContent: (
      <div>
        <button className="px-4 py-2 bg-primary text-white rounded">Action</button>
      </div>
    ),
    children: (
      <div>
        <p>
          Main content goes here. This area is scrollable if the content exceeds the maximum height.
        </p>
        <div style={{ height: 400 }}>
          <p>
            Simulated overflow content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.
          </p>
        </div>
      </div>
    ),
  },
};