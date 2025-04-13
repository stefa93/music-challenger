import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { AuthProvider, useAuthContext } from './AuthContext';
// Removed unused imports: useGameContext, pkce, exchangeSpotifyCodeService, logger

// --- Mocks ---

// Mock dependencies
// Removed mocks for pkce, firebaseApi, GameContext, logger, localStorage, window.location, env vars


// --- Test Wrapper ---
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// --- Test Suite ---

describe('AuthContext & AuthProvider', () => {
  // Removed setup related to Spotify mocks (beforeEach, afterEach, mock constants)
  beforeEach(() => {
    vi.clearAllMocks(); // Keep clearing mocks
  });

  // Removed tests related to Spotify access token, loading state, errors,
  // initiateSpotifyLogin, and handleSpotifyCallback as the context is now empty.

  it('should initialize without errors', () => {
    // Simple test to ensure the provider renders and context can be accessed
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    // Expect the context value to be the empty object provided
    expect(result.current).toEqual({});
  });


  it('useAuthContext should throw error when used outside AuthProvider', () => {
    // Suppress console.error output from React for this expected error
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    expect(() => renderHook(() => useAuthContext())).toThrow(
      'useAuthContext must be used within an AuthProvider'
    );
    errSpy.mockRestore();
  });
});