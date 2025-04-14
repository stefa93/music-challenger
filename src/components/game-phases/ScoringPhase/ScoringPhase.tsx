import React from 'react';
import { PhaseCard } from "@/components/PhaseCard/PhaseCard";
import { Loader2 } from 'lucide-react'; // Import Loader2

// Define props
interface ScoringPhaseProps {
  currentRound: number;
}

export const ScoringPhase: React.FC<ScoringPhaseProps> = ({ currentRound }) => {
  return (
    <PhaseCard
      title="Scoring in Progress"
      description={`Calculating scores for Round ${currentRound}...`}
    >
      <div className="pt-4 text-center">
        <p className="text-muted-foreground">Please wait while the scores are tallied.</p>
        <div className="flex justify-center items-center h-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" role="status" aria-label="Scoring..." />
        </div>
      </div>
    </PhaseCard>
  );
};