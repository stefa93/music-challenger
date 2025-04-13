/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Test runner configuration
    include: ['src/**/*.test.{ts,tsx}'], // Files to run as tests
    exclude: [ // Files/dirs to ignore during test discovery
        'node_modules',
        'dist',
        '.idea',
        '.git',
        '.cache',
        'tests/**', // Ignore Playwright directory
        '**/*.spec.ts' // Ignore Playwright spec files
    ],
    // Coverage configuration
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'], // Choose your reporters
      reportsDirectory: './coverage', // Output directory
      // Files to include in the coverage report (source files)
      include: ['src/**/*.{ts,tsx}'],
      // Files/patterns to exclude from the coverage report
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/setupTests.ts',
        'src/**/*.test.{ts,tsx}', // Exclude test files themselves
        'src/components/ui/**', // Exclude generated UI components
        'src/lib/utils.ts', // Exclude basic utility functions if desired
        'src/lib/pkce.ts', // Exclude PKCE helpers
        '**/*.spec.ts', // Exclude Playwright spec files (redundant but safe)
        'tests/**', // Exclude Playwright tests directory (redundant but safe)
        // Add other patterns like interfaces, types, constants if needed
        'src/types/**', // Exclude type definition files
      ],
      // Optional: Set thresholds
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
