// Define a type for Firebase HttpsError (simplified)
export interface FirebaseHttpsError extends Error {
  code?: string;
  details?: any;
}

// Add other common types here as needed