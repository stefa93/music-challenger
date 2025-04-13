import React, { createContext, useContext, ReactNode } from 'react'; // Removed useState, useCallback, useEffect
// Removed unused imports: logger, pkce, exchangeSpotifyCodeService, useGameContext

// Spotify configuration constants removed

// Define the shape of the context data
// Define the shape of the context data (currently empty after removing Spotify auth)
// We keep the structure in case other auth methods are added later.
interface AuthContextProps {
  // Placeholder for potential future auth properties (e.g., user object)
}

// Create the context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Create the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Removed Spotify-related state variables (spotifyAccessToken, isSpotifyLoading, spotifyAuthError)
  // Removed useGameContext hook call

  // Removed initiateSpotifyLogin function
  // Removed handleSpotifyCallback function

  // The context value is now empty, but we keep the provider structure
  // in case other authentication methods (e.g., Firebase Auth) are added later.
  const value = {};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};