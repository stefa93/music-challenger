import React from 'react';
import { CreativeCard } from "@/components/CreativeCard/CreativeCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react'; // Import Loader2

// Define props
interface ScoringPhaseProps {
  currentRound: number;
}

export const ScoringPhase: React.FC<ScoringPhaseProps> = ({ currentRound }) => {
  return (
    <CreativeCard>
      <CardHeader className="text-center"> {/* Center header content */}
        <CardTitle className="font-handwritten">Scoring in Progress</CardTitle>
        {/* Use system font for description */}
        <CardDescription>
          Calculating scores for Round {currentRound}...
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 text-center">
        {/* Use system font for body text */}
        <p className="text-muted-foreground">Please wait while the scores are tallied.</p>
        <div className="flex justify-center items-center h-20">
          {/* Use Loader2 icon */}
          <Loader2 className="h-8 w-8 animate-spin text-primary" role="status" aria-label="Scoring..." />
        </div>
      </CardContent>
      {/* No Footer needed for this simple state */}
    </CreativeCard>
  );
};