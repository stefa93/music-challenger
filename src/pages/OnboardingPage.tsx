import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '@/contexts/GameContext';
import logger from '@/lib/logger';
import { joinGameService, createGameService, GameJoinResponse } from '@/services/firebaseApi';
import Onboarding, { OnboardingFormData } from '@/components/Onboarding/Onboarding'; // Updated import path
import { SubmitHandler } from 'react-hook-form'; // Import SubmitHandler

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setGameId, setPlayerId, setIsLoading, setError, isLoading, error } = useGameContext(); // Get isLoading and error

  // Single submit handler for the form
  const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
    const traceId = `trace_${data.action}_${Date.now()}`;
    logger.info(`[${traceId}] OnboardingPage: Submitting form for action: ${data.action}`, data);
    setIsLoading(true);
    setError(null);

    try {
      let response: GameJoinResponse;

      if (data.action === 'join' && data.gameId) {
        // --- Join Game ---
        logger.info(`[${traceId}] OnboardingPage: Joining game ${data.gameId} as ${data.displayName}...`);
        response = await joinGameService({
          playerName: data.displayName,
          gameId: data.gameId,
          traceId: traceId,
        });
        logger.info(`[${traceId}] OnboardingPage: Join successful`, response);
        // Set context - Navigation might still rely on App.tsx/context listeners
        setGameId(response.gameId);
        setPlayerId(response.playerId);
        logger.debug(`[${traceId}] OnboardingPage: Navigating to /game/${response.gameId} after join`);
        navigate(`/game/${response.gameId}`); // Explicitly navigate after successful join

      } else if (data.action === 'create') {
        // --- Create Game ---
        logger.info(`[${traceId}] OnboardingPage: Creating game as ${data.displayName}...`);
        response = await createGameService(data.displayName, traceId); // createGameService signature might need update if payload changes
        logger.info(`[${traceId}] OnboardingPage: Create successful`, response);
        // --- DEBUG LOGGING START ---
        logger.debug(`[${traceId}] OnboardingPage: Response from createGameService:`, JSON.stringify(response));
        if (!response || !response.gameId) {
          logger.error(`[${traceId}] OnboardingPage: Invalid response or missing gameId from createGameService! Cannot navigate.`);
          setError("Failed to create game: Invalid response from server.");
          setIsLoading(false); // Ensure loading state is reset
          return; // Stop execution here
        }
        // --- DEBUG LOGGING END ---
        // Set context
        setGameId(response.gameId);
        setPlayerId(response.playerId);
        // Navigate after successful creation
        logger.debug(`[${traceId}] OnboardingPage: Navigating to /game/${response.gameId}`);
        navigate(`/game/${response.gameId}`);

      } else {
        // Should not happen with proper form logic, but handle defensively
        throw new Error("Invalid form submission state.");
      }

    } catch (err) {
      // --- DEBUG LOGGING START ---
      logger.error(`[${traceId}] OnboardingPage: Error caught during ${data.action}:`, err);
      // --- DEBUG LOGGING END ---
      setError(err instanceof Error ? err.message : `Failed to ${data.action} game.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      {/* Pass the onSubmit handler, isLoading, and error state */}
      <Onboarding onSubmit={onSubmit} isLoading={isLoading} error={error} />
    </div>
  );
};

export default OnboardingPage;