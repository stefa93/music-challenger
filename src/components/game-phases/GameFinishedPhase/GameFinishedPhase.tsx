import React from 'react';
import { CreativeCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/CreativeCard/CreativeCard"; // Use enhanced CreativeCard
import { CreativeButton } from "@/components/CreativeButton/CreativeButton"; // Uncommented
import { Trophy, Star } from 'lucide-react'; // Added icons
import { cn } from '@/lib/utils'; // Import cn

// Define props
interface Player {
  id: string;
  name: string;
  score: number;
}

interface GameFinishedPhaseProps {
  playersData: Player[] | null;
  playerId: string | null; // Current user's player ID
  // Add callback prop if Play Again button needs functionality
  // onPlayAgain?: () => void;
}

export const GameFinishedPhase: React.FC<GameFinishedPhaseProps> = ({
  playersData,
  playerId,
  // onPlayAgain
}) => {
  const sortedPlayers = playersData ? [...playersData].sort((a, b) => b.score - a.score) : [];

  // Determine winner(s)
  const winningScore = sortedPlayers.length > 0 ? sortedPlayers[0].score : 0;
  const winners = sortedPlayers.filter(p => p.score === winningScore);
  const winnerNames = winners.map(w => w.name).join(' & '); // Handle ties

  const getWinnerAnnouncement = () => {
    if (winners.length === 0) return "Scores are final!";
    const isTie = winners.length > 1;
    const youWon = winners.some(w => w.id === playerId);

    if (youWon) {
        return isTie ? `It's a tie! You and ${winnerNames.replace(` & ${winners.find(w=>w.id===playerId)?.name}`, '').replace(`${winners.find(w=>w.id===playerId)?.name} & `, '')} win!` : "Congratulations, You Win!";
    } else {
        return isTie ? `It's a tie between ${winnerNames}!` : `Winner: ${winnerNames}!`;
    }
  };


  return (
    <CreativeCard>
      <CardHeader className="text-center"> {/* Center header */}
        <CardTitle className="font-handwritten text-3xl md:text-4xl">Game Over!</CardTitle>
        {/* Announce Winner */}
        <CardDescription className="text-lg"> {/* System font */}
            <Trophy className="inline-block h-5 w-5 mr-1 text-amber-500" />
            {getWinnerAnnouncement()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <h3 className="text-xl font-semibold mb-3 font-handwritten text-center">Final Scores:</h3>
        <ul className="space-y-1">
          {sortedPlayers.map((player, index) => {
            const isWinner = player.score === winningScore && winningScore > 0; // Check if player is a winner
            return (
                <li
                    key={player.id}
                    className={cn(
                        "flex justify-between items-center gap-3 p-3 border-b last:border-b-0",
                        isWinner ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md shadow-sm" : "border-transparent" // Highlight winner
                    )}
                >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {/* Rank */}
                        <span className="font-handwritten font-bold w-6 text-right text-lg text-muted-foreground">{index + 1}.</span>
                        {/* Name */}
                        <span className="font-medium truncate"> {/* System font */}
                            {player.name} {player.id === playerId ? <span className="text-xs text-primary font-normal">(You)</span> : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Score */}
                        <span className="font-semibold text-lg">{player.score}</span> {/* System font */}
                        {/* Winner Icon */}
                        {isWinner && <Star className="h-5 w-5 text-amber-500" />}
                    </div>
                </li>
            );
          })}
        </ul>
      </CardContent>
      <CardFooter className="pt-4 flex-col gap-2 items-center"> {/* Center footer items */}
        {/* Uncommented Play Again button - requires onPlayAgain prop and handler */}
        <CreativeButton
            variant="outline"
            // onClick={onPlayAgain} // Add handler if prop is passed
            className="w-full max-w-xs" // Limit button width
        >
            Play Again?
        </CreativeButton>
        <p className="text-sm text-muted-foreground">Thank you for playing!</p> {/* System font */}
      </CardFooter>
    </CreativeCard>
  );
};