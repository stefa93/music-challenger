# User Story: Trigger Populate Challenges Function

**ID:** 12
**Type:** Task (Data)
**Estimate:** 1 SP

**As a** Developer,
**I want** to trigger the `populateChallenges` Cloud Function once after deployment,
**So that** challenges in Firestore have associated predefined songs populated via the Deezer API.

**Acceptance Criteria:**

*   The `populateChallenges` Cloud Function is successfully triggered (e.g., via HTTPS request, Google Cloud Console, or gcloud CLI).
*   Function logs indicate successful execution, including Deezer API calls and Firestore writes.
*   Firestore data for the `/challenges` collection is verified to contain the `predefinedSongs` array populated with track details for the relevant challenges.

**Notes:**

*   Depends on the successful deployment in Story #11.
*   This populates the initial data needed for the Predefined Songs feature.
*   If the function is refactored in Story #19, this task should use the refactored version.