# User Story: Implement User-Friendly Error Messages

**ID:** 21
**Type:** Feature (Error Handling)
**Estimate:** 1 SP

**As a** Developer,
**I want** to replace technical error messages with user-friendly explanations throughout the application,
**So that** users understand what went wrong and potentially how to resolve it without seeing confusing technical jargon.

**Acceptance Criteria:**

*   Review frontend components and API service calls (`firebaseApi.ts`) where errors are caught and displayed to the user.
*   Identify common error codes or messages returned from Cloud Functions (e.g., `functions/invalid-argument`, `functions/permission-denied`, `functions/not-found`, `functions/internal`).
*   Implement a mapping or utility function to translate known technical errors into clear, concise, user-facing messages (e.g., "Invalid input provided.", "You don't have permission.", "Game not found.", "An unexpected error occurred.").
*   Update error handling logic in the frontend to use this translation mechanism before displaying errors.
*   Ensure generic, non-technical messages are shown for unexpected or unknown errors.
*   Technical details should still be logged (using `logger`) for debugging purposes but not shown directly to the user.

**Notes:**

*   Addresses the user request for better error logging presentation.
*   Improves overall user experience, especially for non-technical users.