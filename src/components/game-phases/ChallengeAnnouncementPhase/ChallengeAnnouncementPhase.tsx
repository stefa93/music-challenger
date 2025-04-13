import React, { useState } from 'react';
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { CreativeCard } from "@/components/CreativeCard/CreativeCard";
import { CreativeInput } from "@/components/CreativeInput/CreativeInput";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Dice6 } from 'lucide-react';

// Define props
interface PlayerInfo {
  id: string;
  name: string;
}

interface ChallengeAnnouncementPhaseProps {
  challenge: string | null;
  roundHostPlayerId?: string | null;
  playersData: PlayerInfo[] | null;
  isHost: boolean;
  predefinedChallenges: string[];
  isSettingChallenge: boolean;
  isStartingSelection: boolean;
  startSelectionError: string | null;
  onSetChallenge: (challenge: string) => void;
  onStartSelectionPhase: () => void;
}

export const ChallengeAnnouncementPhase: React.FC<ChallengeAnnouncementPhaseProps> = ({
  challenge,
  roundHostPlayerId,
  playersData = [], // Default prop
  isHost,
  predefinedChallenges = [], // Default prop
  isSettingChallenge,
  isStartingSelection,
  startSelectionError,
  onSetChallenge,
  onStartSelectionPhase,
}) => {
  const [customChallenge, setCustomChallenge] = useState('');
  const [selectedPredefined, setSelectedPredefined] = useState<string | undefined>(undefined);

  const roundHostName = playersData?.find(p => p.id === roundHostPlayerId)?.name || '...';

  const handleSetChallenge = () => {
    const challengeToSet = customChallenge.trim() || selectedPredefined;
    if (challengeToSet && !isSettingChallenge) {
      onSetChallenge(challengeToSet);
    }
  };

  const handleRandomChallenge = () => {
    if (predefinedChallenges.length > 0 && !isSettingChallenge) {
      const randomIndex = Math.floor(Math.random() * predefinedChallenges.length);
      const randomChallenge = predefinedChallenges[randomIndex];
      setCustomChallenge('');
      setSelectedPredefined(randomChallenge);
      onSetChallenge(randomChallenge);
    }
  };

  const handleSelectChange = (value: string) => {
    setSelectedPredefined(value);
    setCustomChallenge('');
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomChallenge(event.target.value);
    if (event.target.value.trim()) {
      setSelectedPredefined(undefined);
    }
  };

  const challengeIsSet = !!challenge;
  const canSetChallenge = (!!customChallenge.trim() || !!selectedPredefined) && !isSettingChallenge;

  return (
    <CreativeCard>
      <CardHeader>
        <CardTitle className="font-handwritten">
          {challengeIsSet ? 'Challenge Announced!' : (isHost ? 'Set the Challenge' : 'Waiting for Challenge')}
        </CardTitle>
        <CardDescription>
          {challengeIsSet
            ? `The challenge for this round, set by ${roundHostName}, is:`
            : isHost
              ? 'As the Round Host, choose or create the challenge!'
              : `Waiting for the Round Host (${roundHostName}) to set the challenge...`}
        </CardDescription>
      </CardHeader>

      {/* Host Controls Section */}
      {isHost && !challengeIsSet && (
        <CardContent className="space-y-4 pt-4">
          {/* Custom Input */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-challenge">Write your own challenge:</Label>
            <CreativeInput
              id="custom-challenge"
              placeholder="e.g., Songs about rain"
              value={customChallenge}
              onChange={handleInputChange}
              disabled={isSettingChallenge}
            />
          </div>

          {/* OR Separator */}
          <div className="flex items-center gap-2">
            <hr className="flex-grow border-muted-foreground" />
            <span className="text-sm text-muted-foreground">OR</span>
            <hr className="flex-grow border-muted-foreground" />
          </div>

          {/* Predefined Select */}
          <div className="space-y-1.5">
            <Label htmlFor="predefined-challenge">Choose a predefined challenge:</Label>
            <Select
              value={selectedPredefined}
              onValueChange={handleSelectChange}
              disabled={isSettingChallenge || predefinedChallenges.length === 0}
            >
              <SelectTrigger id="predefined-challenge" className="font-handwritten">
                <SelectValue placeholder="Select a challenge..." />
              </SelectTrigger>
              <SelectContent>
                {predefinedChallenges.map((pc) => (
                  <SelectItem key={pc} value={pc}>
                    {pc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           {/* OR Separator */}
           <div className="flex items-center gap-2">
            <hr className="flex-grow border-muted-foreground" />
            <span className="text-sm text-muted-foreground">OR</span>
            <hr className="flex-grow border-muted-foreground" />
          </div>

          {/* Random Button */}
           <CreativeButton
              onClick={handleRandomChallenge}
              variant="outline"
              className="w-full"
              disabled={isSettingChallenge || predefinedChallenges.length === 0}
            >
              <Dice6 className="mr-2 h-4 w-4" /> Pick Random Challenge
            </CreativeButton>
        </CardContent> // Correct closing tag for host controls CardContent
      )}

      {/* Announced Challenge Section */}
      {challengeIsSet && (
        <CardContent className="space-y-3 pt-4">
          <p className="font-handwritten text-xl font-semibold text-center py-2">
            "{challenge}"
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Round Host: <span className="font-medium text-foreground">{roundHostName}</span>
          </p>
        </CardContent> // Correct closing tag for announced challenge CardContent
      )}

      {/* Footer Actions */}
      <CardFooter className="pt-4">
        <div className="flex flex-col items-start gap-2 w-full">
          {/* Set Challenge Button */}
          {isHost && !challengeIsSet && (
            <CreativeButton
              onClick={handleSetChallenge}
              className="w-full h-12 bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-400"
              disabled={!canSetChallenge}
            >
              {isSettingChallenge ? 'Setting...' : 'Set This Challenge'}
            </CreativeButton>
          )}

          {/* Start Selection Button */}
          {isHost && challengeIsSet && (
            <CreativeButton
              onClick={onStartSelectionPhase}
              className="w-full h-12"
              disabled={isStartingSelection}
            >
              {isStartingSelection ? 'Starting Selection...' : 'Start Song Selection'}
            </CreativeButton>
          )}

          {/* Error Message */}
          {startSelectionError && <p className="text-sm text-destructive" role="alert">{startSelectionError}</p>}

          {/* Non-host Waiting Message (Challenge Set) */}
          {!isHost && challengeIsSet && (
             <p className="text-sm text-muted-foreground text-center w-full">Waiting for host to start song selection...</p>
          )}
          {/* Non-host Waiting Message (Challenge Not Set) */}
           {!isHost && !challengeIsSet && (
             <p className="text-sm text-muted-foreground text-center w-full">Waiting for host to set the challenge...</p>
          )}
        </div>
      </CardFooter>
    </CreativeCard>
  );
};