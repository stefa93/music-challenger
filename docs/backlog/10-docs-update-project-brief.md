# User Story: Update Project Brief Document

**ID:** 10
**Type:** Docs
**Estimate:** 1 SP

**As a** Developer,
**I want** to review and update/annotate `docs/projectBrief.md` to reflect major decisions and the current project scope,
**So that** the brief accurately reflects the current project state and avoids confusion for anyone referencing it.

**Acceptance Criteria:**

*   The `docs/projectBrief.md` file is reviewed against key decisions logged in `decisionLog.md` and `productContext.md`.
*   Sections significantly outdated by major decisions are identified (e.g., Spotify vs Deezer integration, removal of Discussion Phase, changes to Song Selection/Pool logic with Predefined Songs, deprecated Authentication section).
*   Outdated sections are either:
    *   Updated to reflect the current implementation/decision.
    *   Clearly annotated (e.g., using blockquotes or footnotes) to indicate they are outdated and reference the relevant decision log entry or current documentation.
*   The document remains coherent and provides an accurate high-level overview of the *current* project goals and architecture.

**Notes:**

*   Ensures the foundational project document aligns with significant pivots made during development.
*   Helps maintain consistency between planning documents and actual implementation.