/**
 * Represents a unique identifier for tracing requests across function calls and logs.
 */
export type TraceId = string;

/**
 * Represents a generic successful function response.
 */
export interface SuccessResponse {
  success: true;
  message: string;
}

/**
 * Represents a Firestore Timestamp.
 * Using an interface for better type checking than relying on the admin SDK type directly everywhere.
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}