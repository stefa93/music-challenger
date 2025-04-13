import React, { useState, useEffect } from 'react';
import { CreativeCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/CreativeCard/CreativeCard";
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { CreativeTabs, CreativeTabsContent, CreativeTabsList, CreativeTabsTrigger } from "@/components/CreativeTabs/CreativeTabs"; // Import Tabs
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import base Select
import { Switch } from "@/components/ui/switch"; // Import base Switch
import { Label } from "@/components/ui/label"; // Import Label
import { Share2, Copy, QrCode } from 'lucide-react';
import logger from '@/lib/logger';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils'; // Import cn utility

// Define Player type locally or import from a shared types file if available
interface Player {
  id: string;
  name: string;
  score: number;
}

// Define structure for game settings
export interface GameSettings { // Added export
  rounds: number;
  maxPlayers: number;
  allowExplicit: boolean;
  selectionTimeLimit: number | null; // seconds or null for none
  rankingTimeLimit: number | null; // seconds or null for none
}

interface LobbyPhaseProps {
  gameId: string | null;
  playersData: Player[] | null;
  playerId: string | null;
  creatorPlayerId?: string | null;
  initialSettings: GameSettings; // Receive initial settings
  onStartGame?: () => void;
  onSettingsChange?: (newSettings: GameSettings) => void; // Callback for settings updates
}

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({
  gameId,
  playersData,
  playerId,
  creatorPlayerId,
  initialSettings, // Destructure new props
  onStartGame,
  onSettingsChange, // Destructure new props
}) => {
  const isCreator = playerId === creatorPlayerId;
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle');
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<GameSettings>(initialSettings); // State for settings

  // Update local settings if initialSettings prop changes (e.g., loaded from Firestore)
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Get the game URL once the component mounts
  useEffect(() => {
    setGameUrl(window.location.href);
  }, []);

  const handleShare = async () => {
    const shareUrl = gameUrl || window.location.href; // Use state or fallback
    const shareText = `Join my Songer game! ID: ${gameId}`;
    const shareData = {
      title: 'Songer Game Invite',
      text: shareText,
      url: shareUrl,
    };

    setShareStatus('idle'); // Reset status

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        logger.info(`[LobbyPhase] Game link shared successfully via Web Share API: ${shareUrl}`);
        setShareStatus('shared');
      } catch (err) {
        // Handle specific errors like AbortError if needed
        if (err instanceof Error && err.name !== 'AbortError') {
            logger.error('[LobbyPhase] Error using Web Share API:', err);
            setShareStatus('error');
        } else {
            logger.info('[LobbyPhase] Web Share dialog dismissed by user.');
            // Keep status idle or handle as needed
        }
      }
    } else if (navigator.clipboard && gameId) {
      try {
        await navigator.clipboard.writeText(gameId);
        logger.info(`[LobbyPhase] Game ID copied to clipboard: ${gameId}`);
        setShareStatus('copied');
      } catch (err) {
        logger.error('[LobbyPhase] Error copying Game ID to clipboard:', err);
        setShareStatus('error');
      }
    } else {
      logger.warn('[LobbyPhase] Neither Web Share API nor Clipboard API is available/supported.');
      setShareStatus('error'); // Indicate sharing is not possible
    }

    // Reset status after a short delay
    if (shareStatus !== 'idle' && shareStatus !== 'error') {
        setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const handleSettingChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings); // Notify parent/backend
    }
  };

  const canShare = !!navigator.share || !!navigator.clipboard;
  return (
    <div className="space-y-6">
      {/* Lobby Info Header & Sharing Section */}
      <CreativeCard>
        <CardHeader>
          <CardTitle className="font-handwritten text-center mb-2">Lobby</CardTitle>
          <CardDescription className="font-handwritten text-center mb-4">
            Status: <span className="font-semibold">waiting</span> - Game ID: <span className="font-bold text-primary">{gameId ?? '...'}</span>
          </CardDescription>

          {/* QR Code Section */}
          {gameId && gameUrl && (
            <div className="flex flex-col items-center mt-4 mb-4 space-y-2">
              <p className="font-handwritten text-muted-foreground text-sm">Scan to Join!</p>
              <div className="p-2 bg-white border-2 border-foreground shadow-[4px_4px_0px_0px] shadow-foreground rounded-lg rotate-[-1deg]">
                <QRCodeSVG
                  value={gameUrl}
                  size={100} // Slightly smaller size for header
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"} // Error correction level
                  includeMargin={false}
                />
              </div>
            </div>
          )}

          {/* Share/Copy Button */}
          {canShare && gameId && (
             <div className="flex justify-center mt-2">
                <CreativeButton
                  // Remove variant="outline", apply background/text colors
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-400 px-3 py-1 text-sm" // Blue accent style
                  onClick={handleShare}
                  // className="px-3 py-1 text-sm" // Removed as size/padding handled above
                  disabled={shareStatus !== 'idle'}
                  aria-label={typeof navigator.share === 'function' ? 'Share game link' : 'Copy game ID'}
                >
                  {shareStatus === 'copied' ? (
                    <>Copied! <Copy className="ml-1 h-3 w-3" /></>
                  ) : shareStatus === 'shared' ? (
                    <>Shared! <Share2 className="ml-1 h-3 w-3" /></>
                  ) : shareStatus === 'error' ? (
                    <>Error</>
                  ) : typeof navigator.share === 'function' ? (
                    <><Share2 className="mr-1 h-3 w-3" /> Share Link</>
                  ) : (
                    <><Copy className="mr-1 h-3 w-3" /> Copy ID</>
                  )}
                </CreativeButton>
             </div>
          )}
        </CardHeader>
      </CreativeCard>

      {/* Removed QR Code Section from here */}

      {/* Tabs for Players and Settings */}
      <CreativeTabs defaultValue="players" className="w-full">
        <CreativeTabsList className="grid w-full grid-cols-2">
          <CreativeTabsTrigger value="players">Players ({playersData?.length ?? 0})</CreativeTabsTrigger>
          <CreativeTabsTrigger value="settings">Settings</CreativeTabsTrigger>
        </CreativeTabsList>

        {/* Players Tab */}
        <CreativeTabsContent value="players">
          <CreativeCard className="mt-0 border-t-0 rounded-t-none"> {/* Adjust styling for tab content */}
             {/* Removed CardHeader as title is in the Tab Trigger */}
            <CardContent className="pt-4"> {/* Add padding top */}
              {playersData && playersData.length > 0 ? (
                <ul data-testid="player-list" className="space-y-1">
                  {playersData.map((player) => (
                    <li key={player.id} className="flex justify-between items-center p-3 border-2 border-foreground rounded-md shadow-sm mb-2 last:mb-0 hover:bg-muted/50 transition-colors">
                      <span className="font-handwritten text-lg">
                        {player.name} {player.id === playerId ? <span className="text-primary font-medium">(You)</span> : ''}
                      </span>
                      <span data-testid="player-score" className="font-handwritten text-lg font-semibold">{player.score} pts</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center font-handwritten pt-4">Waiting for players to join...</p>
              )}
            </CardContent>
          </CreativeCard>
        </CreativeTabsContent>

        {/* Settings Tab */}
        <CreativeTabsContent value="settings">
          <CreativeCard className="mt-0 border-t-0 rounded-t-none">
            {/* Removed CardHeader as title is in the Tab Trigger */}
            <CardContent className="space-y-5 pt-6"> {/* Add padding top and increase spacing */}

              {/* Rounds Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="rounds-select" className="font-handwritten text-lg shrink-0 mr-4">Rounds:</Label>
                <Select
                  value={settings.rounds.toString()}
                  onValueChange={(v) => handleSettingChange('rounds', parseInt(v))}
                  disabled={!isCreator}
                >
                  <SelectTrigger id="rounds-select" className="w-[120px] font-handwritten border-2 border-foreground shadow-sm focus:shadow-[2px_2px_0px_0px] focus:shadow-foreground">
                    <SelectValue placeholder="Rounds" />
                  </SelectTrigger>
                  <SelectContent className="font-handwritten border-2 border-foreground bg-background shadow-md">
                    <SelectItem value="3">3 Rounds</SelectItem>
                    <SelectItem value="5">5 Rounds</SelectItem>
                    <SelectItem value="7">7 Rounds</SelectItem>
                    <SelectItem value="10">10 Rounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Players Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="players-select" className="font-handwritten text-lg shrink-0 mr-4">Max Players:</Label>
                <Select
                  value={settings.maxPlayers.toString()}
                  onValueChange={(v) => handleSettingChange('maxPlayers', parseInt(v))}
                  disabled={!isCreator}
                >
                  <SelectTrigger id="players-select" className="w-[120px] font-handwritten border-2 border-foreground shadow-sm focus:shadow-[2px_2px_0px_0px] focus:shadow-foreground">
                    <SelectValue placeholder="Players" />
                  </SelectTrigger>
                  <SelectContent className="font-handwritten border-2 border-foreground bg-background shadow-md">
                    {/* Assuming min 2 players, creator is 1st */}
                    <SelectItem value="3">3 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                    <SelectItem value="5">5 Players</SelectItem>
                    <SelectItem value="6">6 Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Time Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="selection-time-select" className="font-handwritten text-lg shrink-0 mr-4">Selection Time:</Label>
                <Select
                  value={settings.selectionTimeLimit?.toString() ?? 'none'}
                  onValueChange={(v) => handleSettingChange('selectionTimeLimit', v === 'none' ? null : parseInt(v))}
                  disabled={!isCreator}
                >
                  <SelectTrigger id="selection-time-select" className="w-[120px] font-handwritten border-2 border-foreground shadow-sm focus:shadow-[2px_2px_0px_0px] focus:shadow-foreground">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent className="font-handwritten border-2 border-foreground bg-background shadow-md">
                    <SelectItem value="60">60 sec</SelectItem>
                    <SelectItem value="90">90 sec</SelectItem>
                    <SelectItem value="120">120 sec</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ranking Time Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="ranking-time-select" className="font-handwritten text-lg shrink-0 mr-4">Ranking Time:</Label>
                 <Select
                  value={settings.rankingTimeLimit?.toString() ?? 'none'}
                  onValueChange={(v) => handleSettingChange('rankingTimeLimit', v === 'none' ? null : parseInt(v))}
                  disabled={!isCreator}
                >
                  <SelectTrigger id="ranking-time-select" className="w-[120px] font-handwritten border-2 border-foreground shadow-sm focus:shadow-[2px_2px_0px_0px] focus:shadow-foreground">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent className="font-handwritten border-2 border-foreground bg-background shadow-md">
                    <SelectItem value="60">60 sec</SelectItem>
                    <SelectItem value="90">90 sec</SelectItem>
                    <SelectItem value="120">120 sec</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Explicit Songs Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="explicit-toggle" className="font-handwritten text-lg shrink-0 mr-4">Allow Explicit Songs:</Label>
                <Switch
                  id="explicit-toggle"
                  checked={settings.allowExplicit}
                  onCheckedChange={(c: boolean) => handleSettingChange('allowExplicit', c)}
                  disabled={!isCreator}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border-2 border-foreground focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </CreativeCard>
        </CreativeTabsContent>
      </CreativeTabs>

      {/* Message for non-creator players */}
      {!isCreator && (
        <p className="text-center text-muted-foreground font-handwritten text-lg mt-6"> {/* Reverted to simpler paragraph and margin */}
          Waiting for the host ({playersData?.find(p => p.id === creatorPlayerId)?.name ?? 'Creator'}) to start the game...
        </p>
      )}

      {/* Start Game Button (Visible only in Lobby to Creator) */}
      {isCreator && onStartGame && (
        <div className="text-center mt-6">
          <CreativeButton
            onClick={onStartGame}
            className="bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-400 text-xl px-8 py-3" // Primary action style from guide
            data-testid="start-game-button"
          >
            Start Game! ✨
          </CreativeButton>
        </div>
      )}
    </div>
  );
};