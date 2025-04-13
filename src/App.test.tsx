// src/App.test.tsx (Refactored)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Import custom render and screen from test-utils
import { render, screen, cleanup } from '@/test-utils';
// Import the component *without* the BrowserRouter
import { App } from './App';

// --- Mocks ---
// No global mocks needed here anymore, test-utils handles router/context/logger etc.

// --- Test Setup ---
beforeEach(() => {
    // Clear all mocks handled by Vitest/test-utils before each test
    vi.clearAllMocks();
});

// Clean up after each test
afterEach(cleanup);

// --- End Test Setup ---

describe('App Component', () => {
    it('should render Onboarding initially when not in a game', () => {
        // Use the custom render function, which provides MemoryRouter and context providers
        render(<App />);

        // Assertions remain the same, but now test the App component in isolation
        // within the environment provided by test-utils
        expect(screen.getByPlaceholderText(/Your display name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Game/i })).toBeInTheDocument();
        // Check for the "Join Game" *tab* instead of the button, as it's not initially visible
        expect(screen.getByRole('tab', { name: /Join Game/i })).toBeInTheDocument();
    });

    // Other tests specific to the App component itself (not page interactions) could go here.
    // Tests for page interactions (Onboarding, Game, Callback) belong in their respective files.
});