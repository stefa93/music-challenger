# User Story: Fix Failing E2E Tests

**ID:** 01
**Type:** Bug
**Estimate:** 1 SP

**As a** Developer,
**I want** to investigate and fix the failing Playwright E2E tests in `gameplay_round.spec.ts`,
**So that** the test suite is reliable and accurately reflects application health.

**Acceptance Criteria:**

*   The root cause of the failures in `tests/gameplay_round.spec.ts` (potentially related to timeouts, input clearing, or status updates as noted in `activeContext.md`) is identified.
*   Necessary code changes or test adjustments are implemented to resolve the failures.
*   The `gameplay_round.spec.ts` tests pass consistently when run locally and in the CI environment.
*   The overall E2E test suite stability is improved.

**Notes:**

*   Refer to `activeContext.md` [2025-04-02 00:00:21] for initial context on the failures.
*   Ensure fixes don't negatively impact other tests.