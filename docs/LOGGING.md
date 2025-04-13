# Logging Strategy

This document outlines the logging strategy for the Songer project, aiming for effective debugging, monitoring, and troubleshooting while adhering to best practices.

## 1. Logging Objectives (Why Log?)

*   **Debugging:** Effectively trace issues in frontend UI interactions (component lifecycle, state changes, user inputs), backend function execution flows, API calls (Spotify, Firebase), and the communication between frontend and backend.
*   **Monitoring:** Track key application events (game creation, player joins, song nominations, rankings, round progression), identify performance bottlenecks (function execution times, API latencies), monitor error rates (frontend exceptions, function failures, API errors), and observe system health.
*   **Troubleshooting:** Provide sufficient context in logs (request IDs, user context, state data) to quickly diagnose and resolve production issues, especially asynchronous ones involving Firebase listeners and callbacks.

## 2. Proposed Logging Strategy

This strategy incorporates key principles: clear plan, log levels, structured logging, context, centralization, security, and performance awareness.

*   **A. Use Dedicated Logging Libraries:**
    *   **Backend (Cloud Functions):** **Mandatory:** Use the built-in Firebase `functions.logger` SDK (`import * as logger from "firebase-functions/logger";`). This automatically integrates with Google Cloud Logging, providing structured JSON logging out-of-the-box with appropriate severity levels mapped to Cloud Logging standards. *Avoid `console.log` in functions.*
    *   **Frontend (React App):** Introduce a lightweight logging library. Starting with `loglevel` for simplicity and level control.

*   **B. Structured Logging (JSON):**
    *   **Backend:** `functions.logger` handles this automatically when you pass objects.
    *   **Frontend:** Logs intended for collection (via a potential future log shipping function) should be formatted as JSON. Basic browser console logs via `loglevel` will respect levels but won't be JSON by default.
    *   *Standard JSON Structure Example (for Cloud Logging):*
        ```json
        {
          "severity": "INFO", // Mapped from logger.info, logger.warn, logger.error etc.
          "message": "User joined game",
          "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ", // Added automatically by Cloud Logging
          "serviceContext": { "service": "backend-functions" / "frontend-app" },
          "component": "joinGameFunction" / "OnboardingComponent",
          "traceId": "unique-request-id-xyz", // Crucial for correlation
          "userId": "player-id-abc", // If available
          "gameId": "game-id-123", // If relevant
          // --- Other relevant context ---
          "playerName": "Roo",
          "durationMs": 55 // e.g., for function execution
        }
        ```

*   **C. Log Levels:** Adopt standard levels:
    *   `DEBUG`: Verbose information for fine-grained debugging. *Disabled in production by default.*
    *   `INFO`: Routine operational messages, key events, successful operations. *Default level for production.*
    *   `WARN`: Potentially harmful situations or unexpected events.
    *   `ERROR`: Runtime errors, exceptions, failed operations. Include stack traces.
    *   `FATAL` (Backend Only via `logger.error` or higher severity): Severe errors causing application termination.

*   **D. Context is Key:**
    *   **Trace/Request ID:** Generate on frontend, pass to backend, include in all related logs.
    *   **User/Game Context:** Include `userId`, `gameId`, `roundNumber` where relevant.
    *   **Function/Component Name:** Log the source of the message.
    *   **Payloads:** Log relevant (non-sensitive) data. *Be cautious with size.*
    *   **Error Details:** Log the full error object (including stack trace) for `ERROR` level logs.

*   **E. Centralized Logging:**
    *   **Backend:** `functions.logger` automatically sends logs to Google Cloud Logging.
    *   **Frontend:** Start with browser console via `loglevel`. Consider a dedicated Cloud Function (`logFrontendEvent`) later to ship important logs (WARN, ERROR, key INFO) to Cloud Logging.

*   **F. Security & PII:**
    *   **NEVER log sensitive data:** Passwords, API keys, full OAuth tokens, PII beyond non-sensitive IDs.
    *   Review logs periodically.
    *   Use environment variables securely for secrets.

*   **G. Performance:**
    *   `functions.logger` is generally optimized.
    *   Avoid excessive `DEBUG` logging in production.
    *   Be mindful of logging within loops or high-frequency operations.

*   **H. Log Sampling & Retention (Cloud Logging):**
    *   Configure log retention policies in Google Cloud Logging (e.g., DEBUG 7d, INFO 30d, ERROR 90d).
    *   Consider log sampling later if costs become high.

*   **I. Logs vs. Metrics vs. Tracing:**
    *   Use logs for discrete events and debugging.
    *   Use Cloud Monitoring for metrics (function counts, error rates, latency).
    *   Consider Cloud Trace (or OpenTelemetry later) for distributed tracing.

## 3. Implementation Plan (High-Level)

1.  **Backend:**
    *   Import and use `firebase-functions/logger` instead of `console.*`.
    *   Add structured logs (start/end, errors, key steps), including Trace IDs.
2.  **Frontend:**
    *   Install `loglevel`.
    *   Create `src/lib/logger.ts` utility.
    *   Set level based on environment.
    *   Refactor `console.*` calls to use the logger utility.
    *   Implement Trace ID generation and propagation.
    *   *(Optional - Phase 2)* Implement `logFrontendEvent` Cloud Function and frontend shipper.
3.  **Documentation:** Keep this `LOGGING.md` file updated.
4.  **Configuration:** Set up retention policies in Google Cloud Logging.

## 4. Logging Flow Diagram

```mermaid
graph TD
    subgraph Frontend (React App)
        A[User Action (e.g., Join Game)] -->|Generates TraceID| B(logger.info('Action started', {traceId}));
        B --> C{API Call to Cloud Function w/ TraceID};
        C --> |Error| E(logger.error('API Call failed', {traceId, error}));
        E --> F[Browser Console / Optional Log Shipper];
        B --> F;
    end

    subgraph Backend (Firebase Functions)
        G[Cloud Function Triggered w/ TraceID] --> H(logger.info('Function started', {traceId, inputData}));
        H --> I{Business Logic};
        I --> J(logger.debug('Step completed', {traceId, intermediateData}));
        I --> |Error| K(logger.error('Function error', {traceId, error}));
        I --> L(logger.info('Function finished', {traceId, resultData, durationMs}));
    end

    subgraph Centralized Logging (Google Cloud Logging)
        M[Cloud Logging Sink]
    end

    H --> M;
    J --> M;
    K --> M;
    L --> M;
    F -- Optional --> N(Log Shipper Function) -- logger.* --> M;

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style N fill:#ccf,stroke:#333,stroke-width:2px