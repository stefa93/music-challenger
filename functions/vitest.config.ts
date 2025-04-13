import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Specify the directory containing the test files
    include: ['test/**/*.test.{ts,tsx}'],
    // Enable globals like describe, it, expect for convenience
    globals: true,
    // Optional: Set up environment if needed (e.g., 'node')
    // environment: 'node',
  },
});