# User Story: Fix Page Scrolling for Long Content

**ID:** 23
**Type:** Bug
**Estimate:** 0.5 SP

**As a** User,
**I want** to be able to scroll pages vertically when the content exceeds the viewport height (e.g., on the Admin page),
**So that** I can access all content on the page.

**Acceptance Criteria:**

*   Pages with content taller than the browser window's viewport height display a vertical scrollbar.
*   Users can scroll down to view all content on these pages.
*   The fix applies globally or specifically to affected layouts (like the main app layout and potentially the Admin page layout).
*   Scrolling behavior is smooth and standard across different browsers.

**Notes:**

*   Investigate the root cause, likely missing `overflow-y: auto` or `overflow-y: scroll` on a container element, or potentially fixed height/`overflow: hidden` being applied incorrectly.
*   Check the main layout component (`App.tsx` or similar) and specific page layouts (e.g., `AdminPage.tsx`).
*   Ensure the fix doesn't introduce unwanted scrollbars on pages with short content.