import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK only if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
  logger.info("Firebase Admin SDK initialized by firestoreClient.");
}

export const db = admin.firestore();
export const { Timestamp } = admin.firestore; // Export Timestamp for convenience (FieldValue imported directly)

logger.info("Firestore client instance created.");