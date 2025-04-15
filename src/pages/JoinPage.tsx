import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameContext } from '@/contexts/GameContext';
import logger from '@/lib/logger';

const JoinPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setGameId, setPlayerId } = useGameContext();

  useEffect(() => {
    const traceId = `trace_join_${Date.now()}`;
    logger.info(`[${traceId}] JoinPage: Mounted. Processing join link...`, { search: location.search });

    const queryParams = new URLSearchParams(location.search);
    const gameIdFromUrl = queryParams.get('gameId');

    if (gameIdFromUrl) {
      logger.info(`[${traceId}] JoinPage: Found gameId=${gameIdFromUrl} in URL. Clearing existing session and setting context.`);

      // Clear any existing session from localStorage
      localStorage.removeItem('gameId');
      localStorage.removeItem('playerId');

      // Set the gameId in context, clear playerId (user needs to enter name)
      setGameId(gameIdFromUrl);
      setPlayerId(null);

      // Navigate to the root (OnboardingPage) where the user can enter their name
      logger.info(`[${traceId}] JoinPage: Navigating to /`);
      navigate('/');

    } else {
      logger.warn(`[${traceId}] JoinPage: No gameId found in URL query parameters. Navigating to /`);
      // If no gameId, just redirect to the home page
      navigate('/');
    }
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once

  // Render nothing or a loading indicator while redirecting
  // Using null for simplicity as the redirect should be quick
  return null;
};

export default JoinPage;