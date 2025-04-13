# Design Style Guide: Songer - "Creative Handwritten"

**Version:** 0.1
**Last Updated:** May 4, 2025

## 1. Introduction

This document defines the visual design language, user experience principles, and interaction patterns for the Songer application. The core style, "Creative Handwritten," aims to create an engaging, slightly playful, and distinct visual identity inspired by hand-drawn elements, dynamic interactions, and a touch of whimsy. It balances a unique aesthetic with usability and accessibility.

## 2. Core Principles

*   **Engaging & Playful:** The UI should feel inviting and fun, encouraging user interaction.
*   **Distinct & Memorable:** Stand out with a unique visual style that reinforces the brand.
*   **Clear & Usable:** Despite the stylistic elements, maintain clarity, intuitive navigation, and accessibility.
*   **Consistent:** Apply the design language uniformly across the application.
*   **Dynamic:** Incorporate subtle animations and transitions to enhance the user experience.

## 3. Visual Language

### 3.1. Color Palette

*(Note: This section needs formal definition based on the actual theme colors used, but we can infer some primary ones)*

*   **Primary Action/Accent:** Blue (`text-blue-500`: `#3b82f6`) - Used for primary tags, highlights, interactive elements. Glows use `bg-blue-500/20`.
*   **Primary Call-to-Action / Highlight:** Amber (`text-amber-500`: `#f59e0b`, `bg-amber-400`: `#facc15`) - Used for primary action buttons, key feature highlights (e.g., "Popular" tags). Provides strong visual pop. *Contrast Check: `bg-amber-400` with `text-zinc-900` passes WCAG AA (12.05:1).*
*   **Neutral Backgrounds:** White (`bg-white`: `#ffffff`) and Dark Zinc (`dark:bg-zinc-900`: `#18181b`).
*   **Neutral Text/Borders:** Dark Zinc (`text-zinc-900`/`border-zinc-900`/`shadow-zinc-900`: `#18181b`) and White (`dark:text-white`/`dark:border-white`/`dark:shadow-white`: `#ffffff`).
*   **Subtle Text:** Medium Zinc (`text-zinc-600`: `#52525b` on light, `dark:text-zinc-400`: `#a1a1aa` on dark). *Contrast Check: Passes WCAG AA on respective neutral backgrounds.*
*   **Tier-Specific / Secondary Accents:** Used for thematic coloring, secondary actions, states, or decoration. *Note: Ensure sufficient contrast, especially if used as backgrounds for normal-sized text.*
    *   Purple: `text-purple-500` (`#a855f7`), `bg-purple-400` (`#c084fc`). *BG Contrast w/ `#18181b`: 5.61:1 (Pass)*
    *   Green: `text-green-500` (`#22c55e`), `bg-green-400` (`#4ade80`). *BG Contrast w/ `#18181b`: 3.19:1 (Pass - Recommend large/bold text)*. *Fails contrast with `#ffffff`.*
    *   Rose: `text-rose-500` (`#f43f5e`), `bg-rose-400` (`#fb7185`). *BG Contrast w/ `#18181b`: 3.96:1 (Pass - Recommend large/bold text)*. *Fails contrast with `#ffffff`.*

### 3.2. Typography

*   **Primary Display/UI Font (`font-handwritten`):** "Patrick Hand" (from Google Fonts). Apply this class for:
    *   **Headings:** All semantic levels (H1-H6 equivalents).
    *   **Component Titles:** e.g., Card titles, Modal titles, Section titles.
    *   **Button Text.**
    *   **Pricing Figures.**
    *   **Short Labels & Tags:** e.g., "Popular!", category tags.
    *   **Short List Items:** e.g., Feature bullet points in pricing tiers (if concise, typically < 5-7 words).
    *   **Key UI Elements:** Where style is paramount and text is brief (e.g., `CreativeTabsTrigger`).
*   **Body/Standard Font (`system-ui` - default sans-serif):** Use the default browser font stack (i.e., *do not* apply `font-handwritten`) for:
    *   **Body Text:** Paragraphs or blocks of text exceeding 1-2 short sentences.
    *   **Descriptions:** Longer descriptive text accompanying components, features, or sections.
    *   **Input Field Values:** Text *entered by the user* or displayed *within* input fields (placeholders may use `font-handwritten` if legible).
    *   **Data Tables / Dense Information Displays:** Where scannability is critical.
    *   **Error Messages / Helper Text / Toasts:** Prioritize immediate comprehension.
    *   **Any text where legibility might be compromised** by the handwritten style due to small size, density, or context.
*   **Emphasis:** Use `font-bold` for key information like prices and titles.
*   **Rotation:** Subtle rotation (`rotate-[-1deg]`, `rotate-[1deg]`, `rotate-[-2deg]`, `rotate-12`) is applied to text elements (headings, tags) and components (pricing tiers) to enhance the hand-drawn feel.

### 3.3. Iconography

*   **Primary Icon Set:** `lucide-react` - Provides clean, consistent line icons. Used for:
    *   Feature checks (`<Check />`)
    *   Tier indicators (`<Pencil />`, `<Star />`, `<Sparkles />`)
    *   Decorative elements (`✨`, `⭐️`, `✎`, `✏️` - Note: Emojis/characters are also used for decoration).
*   **Styling:** Icons within elements often inherit text color or have specific colors applied (e.g., `text-amber-500`). Checkmark icons are placed within styled containers (`w-5 h-5 rounded-full border-2 ...`).

### 3.4. Imagery & Decoration

*   **Decorative Elements:** Use subtle, relevant emojis or simple shapes (like stars, sparkles, pencils) placed absolutely or relatively near key elements, often with rotation, to add visual interest (e.g., `absolute -right-12 top-0 text-amber-500 rotate-12`).
*   **Background Effects:**
    *   Subtle glows (`bg-blue-500/20 rotate-[-1deg] rounded-full blur-sm`) can be placed behind text elements for emphasis.
    *   Parallax/Floating elements (as seen in Onboarding) using components like `Floating` and `FloatingElement` for dynamic backgrounds.

## 4. Component Styling: The Wrapper Component Strategy

To apply the "Creative Handwritten" style while maintaining the underlying structure and functionality of base `shadcn/ui` components, we primarily use **wrapper components**. These wrappers (e.g., `CreativeButton`, `CreativeInput`, `CreativeCard`) are located in `src/components/`.

**Core Principles of Wrappers:**
*   **Composition:** They import and render the corresponding base `shadcn/ui` component (e.g., `CreativeButton` renders `<Button>`).
*   **Style Application:** They use `cn()` from `@/lib/utils` to merge the specific "Creative Handwritten" styles (handwritten font, borders, shadows, hover effects) with any `className` props passed down for customization.
*   **Prop Forwarding:** They forward all relevant props (including `ref`) to the underlying base component, ensuring full API compatibility.

This approach allows for easy updates of base components and centralizes the creative styling logic. **This wrapper pattern should be the default method for applying the 'Creative Handwritten' style to any new or existing components going forward.** Direct Tailwind utilities on standard components should be used sparingly, mainly for layout or minor adjustments not covered by wrappers.

### 4.1. Cards / Containers

*   **Base:** Use `shadcn/ui` Card or simple `div`s.
*   **Creative Style (Inspired by `CreativePricing` Tiers):**
    *   **Border:** `border-2 border-zinc-900 dark:border-white`.
    *   **Background:** `bg-white dark:bg-zinc-900`.
    *   **Shadow:** Custom offset shadow: `shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white`.
    *   **Hover Effect:** Translate slightly (`group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]`) and intensify shadow (`group-hover:shadow-[8px_8px_0px_0px]`). Achieved by applying `group` to the parent and `group-hover:` utilities to the styled element.
    *   **Rotation:** Apply subtle, varying rotation to individual cards (`rotate-[-1deg]`, `rotate-[1deg]`, `rotate-[-2deg]`) when displayed in a group.
    *   **Structure:** Often implemented with a relative parent and an absolutely positioned background `div` containing the border/shadow styles, allowing the content `div` to sit above it.

### 4.2. Buttons (`CreativeButton`)

*   **Implementation:** Use the `CreativeButton` wrapper component located at `src/components/creative-button.tsx`.
*   **Base Component:** Wraps the standard `shadcn/ui` Button (`@/components/ui/button`).
*   **Applied Styles:**
    *   **Font:** `font-handwritten text-lg`.
    *   **Border:** `border-2 border-foreground`. (Uses `foreground` variable for theme adaptability).
    *   **Shadow:** Custom offset shadow using Tailwind theme extensions: `shadow-creative-button shadow-foreground`.
    *   **Hover/Active Effect:** Translates slightly (`hover:translate-x-[-2px] hover:translate-y-[-2px]`) and intensifies shadow (`hover:shadow-creative-button-hover`). Resets translation and shadow on `active`.
    *   **Color Contrast:** Explicitly sets `text-black dark:text-white` for default variant.
    *   **Color Variants:** While base variants are passed through, the primary method for color variation is applying specific background/text classes directly when using `CreativeButton`.
        *   *Default:* Uses standard background/foreground.
        *   *Primary Action (Amber):* Apply `bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-400` classes for the main call-to-action style seen in examples.
    *   **Base Variants:** Passes through `variant` and `size` props to the underlying `Button` component, though visual styling is primarily controlled by the wrapper.

### 4.3. Inputs (`CreativeInput`)

*   **Implementation:** Use the `CreativeInput` wrapper component located at `src/components/creative-input.tsx`.
*   **Base Component:** Wraps the standard `shadcn/ui` Input (`@/components/ui/input`).
*   **Applied Styles:**
    *   **Font:** `font-handwritten`.
    *   **Border:** `border-2 border-foreground`.
    *   **Focus:** Standard `shadcn/ui` focus ring (`focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-2`).
    *   **Sizing:** Applies standard height and padding (`h-10 px-3`).
    *   *(Note: Does not currently apply an offset shadow like buttons/cards).*

### 4.4. Tags / Badges

*   *(Inspired by `CreativePricing` "Popular!" tag)*
*   **Font:** `font-handwritten text-sm`.
*   **Background/Text Color:** High contrast (e.g., `bg-amber-400 text-zinc-900`).
*   **Border:** `border-2 border-zinc-900`.
*   **Shape:** `rounded-full`.
*   **Placement:** Often positioned absolutely (`absolute -top-2 -right-2`) with rotation (`rotate-12`).
### 4.5 Tabs (`CreativeTabs`)

*   **Implementation:** Use the `CreativeTabs`, `CreativeTabsList`, `CreativeTabsTrigger`, and `CreativeTabsContent` components exported from `src/components/creative-tabs.tsx`.
*   **Base Component:** Wraps the standard `shadcn/ui` Tabs components (`@radix-ui/react-tabs`).
*   **Applied Styles (`CreativeTabsTrigger`):**
    *   **Font:** `font-handwritten text-base`.
    *   **Active State:** Mimics the `CreativeButton` active state with border, shadow, background change, and slight translation (`data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-creative-button ...`).
    *   **Inactive State:** Retains default inactive styling.
*   **Applied Styles (`CreativeTabsList`):** Uses default `shadcn/ui` styling (rounded background). *Optional: Consider adding creative border/shadow here in the future if desired.*
*   **Applied Styles (`CreativeTabsContent`):** Uses default `shadcn/ui` styling.

## 5. Layout & Spacing

*   **Framework:** Primarily use Tailwind CSS utility classes for grid, flexbox, padding, margins, etc.
*   **Consistency:** Maintain consistent spacing using Tailwind's spacing scale (e.g., `gap-8`, `mb-6`, `space-y-3`).
*   **Centering:** Use `mx-auto` for centering block elements within containers.
*   **Full Screen:** Views like Onboarding use `h-screen w-screen max-h-screen max-w-screen overflow-hidden` for immersive experiences.
*   **Responsiveness:** Design should be responsive (`md:` prefixes used for breakpoints). Prioritize mobile-first where applicable.
*   **Viewport Containment:** Aim to keep primary views contained within the viewport (`100vh`, `100vw`) where feasible, minimizing the need for scrolling, especially on core interaction screens. Use techniques like Tabs for organizing content if necessary.

### 5.1. Main Content Container (`GameView`)

*   **Goal:** Provide a consistent layout width for all game phases (Lobby, Selection, Ranking, etc.) displayed within `GameView.tsx` to prevent jarring size changes ("jumping") between phases.
*   **Implementation:** The main `div` container within `GameView.tsx` uses the following Tailwind classes: `w-full md:min-w-[800px] md:max-w-4xl mx-auto`.
    *   On small screens (`< md`), it takes the full width (with padding applied).
    *   On medium screens and up (`md:`), it has a minimum width of 800px and a maximum width of `4xl` (896px), centered horizontally (`mx-auto`).
*   **Storybook:** A global decorator in `.storybook/preview.ts` applies these same width constraints (`md:min-w-[800px] md:max-w-4xl mx-auto`) to stories, ensuring individual phase components are previewed with the correct layout width.

## 6. Interaction & Motion

*   **Hover Effects:** Subtle translations and shadow changes on interactive elements (cards, buttons) provide visual feedback. Use `transition-all duration-300` for smoothness.
*   **Animated Text:** Components like `TextRotate` can be used for dynamic text displays.
*   **Background Motion:** Components like `FloatingElement` create subtle background animations (e.g., floating, rotating images).
*   **Focus States:** Ensure clear focus indicators for accessibility (rely on default browser/shadcn styles unless custom styling is needed).

## 7. Accessibility (WCAG 2.1 AA)

*   **Color Contrast:** Ensure sufficient contrast between text and background colors, especially considering the custom font and color palette. Test using accessibility tools. Explicitly set text colors where needed (e.g., `CreativeButton` ensures `text-black dark:text-white` against base backgrounds).
*   **Semantic HTML:** Use appropriate HTML5 elements (nav, main, section, button, etc.).
*   **ARIA Attributes:** Apply ARIA roles and attributes where necessary, especially for custom components or complex interactions.
*   **Keyboard Navigation:** All interactive elements must be navigable and operable using a keyboard.
*   **Focus Indicators:** Maintain clear and visible focus states.
*   **Alternative Text:** Provide descriptive alt text for all meaningful images. Decorative images should have empty alt attributes (`alt=""`).

## 8. Implementation Notes

*   Use the `cn` utility from `@/lib/utils` for merging Tailwind classes and handling conditional styling.
*   Leverage Tailwind's `dark:` variant for dark mode styles.
*   Define custom utility classes or component variants in Tailwind configuration (`tailwind.config.ts`) if reusable patterns emerge beyond simple class combinations.
*   Keep custom CSS minimal; prefer Tailwind utilities.
*   **Tabs for Organization:** When a single view needs to present distinct sections of information or controls (like Players and Settings in the Lobby), use the `CreativeTabs` component to keep the UI organized and compact within the viewport.

*(This style guide is a living document and should be updated as the design evolves.)*