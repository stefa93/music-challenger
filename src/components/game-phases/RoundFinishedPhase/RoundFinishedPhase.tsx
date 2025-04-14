import React from 'react';
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { PhaseCard } from "@/components/PhaseCard/PhaseCard";
import { Trophy, Star, AlertCircle, Loader2 } from 'lucide-react'; // Added icons
import { cn } from '@/lib/utils'; // Import cn

// Define data structures for results
interface SongResult {
  playerId: string;
  playerName: string; // Need player name associated with the song
  songName: string;
  songArtist: string;
  pointsAwarded: number;
  isWinner: boolean; // Flag to indicate if this song was a winner
  albumArtUrl?: string; // Optional album art
}

interface RoundWinnerData {
    winnerNames: string[]; // Array in case of ties
    winningScore: number;
}

// Define component props
interface RoundFinishedPhaseProps {
  currentRound: number;
  roundResults: SongResult[]; // Array of results for the round
  roundWinnerData: RoundWinnerData | null; // Info about the winner(s)
  isStartingNextRound: boolean;
  startNextRoundError: string | null;
  onStartNextRound: () => void;
}

export const RoundFinishedPhase: React.FC<RoundFinishedPhaseProps> = ({
  currentRound,
  roundResults = [], // Default to empty array
  roundWinnerData,
  isStartingNextRound,
  startNextRoundError,
  onStartNextRound,
}) => {

  // Sort results by points descending
  const sortedResults = [...roundResults].sort((a, b) => b.pointsAwarded - a.pointsAwarded);

  const getWinnerNames = () => {
    if (!roundWinnerData || roundWinnerData.winnerNames.length === 0) return "N/A";
    if (roundWinnerData.winnerNames.length === 1) return roundWinnerData.winnerNames[0];
    return roundWinnerData.winnerNames.join(' & '); // Handle ties
  };

  return (
    // Added info popover prop example (content can be customized)
    <PhaseCard
      infoPopoverContent="Scores for this round are shown below. Highest score wins!"
      title={
        <span className="font-handwritten text-3xl md:text-4xl">
          Round {currentRound} Finished!
        </span>
      }
      description={
        roundWinnerData ? (
          <span className="text-lg">
            <Trophy className="inline-block h-5 w-5 mr-1 text-amber-500" />
            Winner: <span className="font-bold text-foreground">{getWinnerNames()}</span> with {roundWinnerData.winningScore} points!
          </span>
        ) : (
          <>Scores calculated.</>
        )
      }
      footerContent={
        <div className="flex flex-col items-start gap-2 w-full">
          <CreativeButton
            onClick={onStartNextRound}
            className="w-full h-12"
            disabled={isStartingNextRound}
          >
            {isStartingNextRound ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
              </>
            ) : (
              "Start Next Round"
            )}
          </CreativeButton>
          {startNextRoundError && (
            <p
              data-testid="start-next-round-error"
              className="text-sm text-destructive flex items-center gap-1 w-full justify-center"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" /> {startNextRoundError}
            </p>
          )}
        </div>
      }
    >
      <div className="pt-4 space-y-3">
        <h3 className="font-handwritten text-xl text-center mb-2">Round Scores</h3>
        {sortedResults.length > 0 ? (
          <ul className="space-y-2">
            {sortedResults.map((result) => (
              <li
                key={result.playerId}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-md",
                  result.isWinner
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-md"
                    : "border-border"
                )}
              >
                {result.albumArtUrl ? (
                  <img
                    src={result.albumArtUrl}
                    alt=""
                    className="h-10 w-10 rounded-sm object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                    ?
                  </div>
                )}
                <div className="flex-1 overflow-hidden min-w-0">
                  <p className="font-medium truncate">{result.songName}</p>
                  <p className="text-sm text-muted-foreground truncate">{result.songArtist}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted by: {result.playerName}
                  </p>
                </div>
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="font-handwritten text-2xl font-bold text-primary">
                    {result.pointsAwarded}
                  </span>
                  <span className="text-xs text-muted-foreground">Points</span>
                </div>
                {result.isWinner && <Star className="h-5 w-5 text-amber-500 flex-shrink-0" />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center">
            No scores available for this round.
          </p>
        )}
      </div>
    </PhaseCard>
  );
};