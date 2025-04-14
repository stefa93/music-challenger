# User Story: Implement Secure Authentication

**ID:** 02
**Type:** Security
**Estimate:** 1 SP

**As a** User,
**I want** the application to use secure authentication (like Firebase Anonymous Auth) instead of temporary checks,
**So that** my game actions are properly authorized and my session is secure.

**Acceptance Criteria:**

*   Firebase Authentication (preferably Anonymous Auth, unless another method is chosen) is implemented.
*   Users are automatically signed in anonymously when they first access the application.
*   Cloud Functions (`*.handlers.ts`) are updated to use `request.auth.uid` for authorization checks instead of relying on `playerId` passed in the request data.
*   The temporary `playerId`-based authorization logic is removed from Cloud Functions and frontend API calls.
*   Firestore security rules are updated to leverage `request.auth.uid` for appropriate data access control (e.g., ensuring users can only modify their own submissions/rankings).
*   Existing functionality (creating games, joining games, submitting songs/rankings) continues to work correctly with the new authentication mechanism.

**Notes:**

*   This addresses the security TODO noted in `activeContext.md` [2025-09-04 14:02:00].
*   Consider how authentication state integrates with the existing `GameContext` and session restoration logic.