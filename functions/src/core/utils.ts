import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { TraceId } from "./types"; // Import TraceId from core types

/**
 * Generates a unique trace ID for logging.
 * @param functionName The name of the function for context.
 * @returns A unique trace ID string.
 */
export function generateTraceId(functionName: string): TraceId {
  return `${functionName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Wraps service calls to handle errors consistently and log them.
 * @param traceId The trace ID for logging.
 * @param serviceCall The async function representing the service call.
 * @returns The result of the service call.
 * @throws HttpsError if the service call fails.
 */
export async function handleServiceCall<T>(traceId: TraceId, serviceCall: () => Promise<T>): Promise<T> {
  try {
    return await serviceCall();
  } catch (error) {
    logger.error(`[${traceId}] Service call failed:`, { error });
    if (error instanceof HttpsError) {
      // Re-throw HttpsErrors directly as they are intended for the client
      throw error;
    }
    // Wrap unexpected errors in a generic internal error
    throw new HttpsError("internal", "An unexpected server error occurred.", { originalError: error instanceof Error ? error.message : String(error) });
  }
}