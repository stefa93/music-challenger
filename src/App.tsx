// Keep only necessary imports for routing and context providers
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'; // Added useNavigate, useLocation
import './App.css'
// Removed unused logger import
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { useEffect } from 'react'; // Added useEffect
import { AuthProvider } from '@/contexts/AuthContext'; // Only need Provider here
// Import Page Components
import OnboardingPage from '@/pages/OnboardingPage';
import GamePage from '@/pages/GamePage';
import AdminPage from '@/pages/AdminPage'; // Import AdminPage
// Removed CallbackPage import


// --- Main App Component ---
// This component now primarily sets up routing and global context consumers
function App() {
  // Consume context state needed for global display AND navigation logic
  const { gameId, playerId, isLoading, error } = useGameContext(); // Added gameId, playerId
  const navigate = useNavigate();
  const location = useLocation();

  // Effect for automatic navigation based on restored session
  useEffect(() => {
    // Only navigate if NOT loading, context has IDs, and we are on the root page
    if (!isLoading && gameId && playerId && location.pathname === '/') {
      // log.debug(`App.tsx: Auto-navigating to /game/${gameId} due to restored session.`); // Use logger if needed
      navigate(`/game/${gameId}`);
    }
    // Dependencies: context state, location, navigate function
  }, [gameId, playerId, isLoading, location, navigate]);

  // Effect to navigate home if session becomes invalid while on game page
  useEffect(() => {
    // Only navigate if NOT loading, gameId is null, and we are on a game page
    if (!isLoading && gameId === null && location.pathname.startsWith('/game/')) {
      console.warn('[App.tsx] Session invalid (gameId is null) while on game page. Navigating home.');
      navigate('/');
    }
    // Dependencies: context state, location, navigate function
  }, [gameId, isLoading, location, navigate]); // Removed playerId as it's not needed for this check

  return (
    <div className="App">
      {/* Removed h2 title */}
      {/* Global Loading/Error Indicators from GameContext */}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Game Error: {error}</p>}
      {/* Spotify error/loading/status will be consumed from AuthContext where needed */}

      <Routes>
        {/* Page components now consume context directly, no props needed here */}
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/game/:gameIdParam" element={<GamePage />} />
        {/* Removed /callback route */}
        <Route path="/admin" element={<AdminPage />} />
        {/* TODO: Add a 404 Not Found route */}
      </Routes>
    </div>
  );
}

// App component now needs to be wrapped by the providers
const AppWithProvider = () => (
  <GameProvider> {/* GameProvider must wrap AuthProvider because AuthProvider uses GameContext */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </GameProvider>
);

// Wrap the provider-wrapped App with BrowserRouter
const RoutedApp = () => (
  <BrowserRouter>
    <AppWithProvider /> {/* Render the App wrapped in the provider */}
  </BrowserRouter>
);

export { App }; // Export the raw App component for testing
export default RoutedApp; // Keep the default export
