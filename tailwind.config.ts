import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme' // Correct default import

const config = {
  darkMode: "class", // Correct dark mode strategy
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', // Ensure src directory is included
	],
  prefix: "", // Assuming no prefix for shadcn
  theme: {
    container: { // Assuming shadcn default container settings
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Add Patrick Hand to the sans font stack (or create a new key)
        // Using 'sans' will make it the default unless overridden
        // sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans], // Keep existing sans if defined via CSS var
        handwritten: ["'Patrick Hand'", ...defaultTheme.fontFamily.sans], // Define 'font-handwritten' utility using correct import
      },
      colors: { // Assuming shadcn default color setup via CSS vars
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: { // Assuming shadcn default border radius setup via CSS vars
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Assuming shadcn default keyframes
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'creative-pulse': { // Added for CreativeSkeleton
          '0%, 100%': { boxShadow: '0 0 10px 0px theme(colors.blue.500/0)' },
          '50%': { boxShadow: '0 0 15px 3px theme(colors.blue.500/20)' },
        },
      },
      animation: { // Assuming shadcn default animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'creative-pulse': 'creative-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', // Added for CreativeSkeleton
      },
       boxShadow: { // Add the custom shadow from CreativePricing
        'creative': '4px 4px 0px 0px',
        'creative-hover': '8px 8px 0px 0px',
        'creative-button': '4px 4px 0px 0px',
        'creative-button-hover': '6px 6px 0px 0px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // Assuming shadcn default plugin
} satisfies Config

export default config