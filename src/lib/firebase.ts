// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import logger from './logger'; // Import the custom logger
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr53S2FUEp1s1HqO-qaNyisCCDdfYoIiQ",
  authDomain: "dance-floor-ranking.firebaseapp.com",
  projectId: "dance-floor-ranking",
  storageBucket: "dance-floor-ranking.firebasestorage.app",
  messagingSenderId: "511931340318",
  appId: "1:511931340318:web:ea58b7058c32be9bb6000f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Functions and get a reference to the service
const functions = getFunctions(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Connect to emulators in development mode
if (import.meta.env.DEV) {
  try {
    const host = "127.0.0.1"; // Use IP address instead of localhost
    logger.info(`Connecting to Firebase Emulators at ${host}...`);
    // Point Functions to the local emulator
    connectFunctionsEmulator(functions, host, 5001);
    logger.info(`Functions Emulator connected at ${host}:5001.`);
    // Point Firestore to the local emulator
    connectFirestoreEmulator(db, host, 8080);
    logger.info(`Firestore Emulator connected at ${host}:8080.`);
  } catch (error) {
    logger.error("Error connecting to Firebase Emulators:", error);
  }
} else {
  logger.info("Connecting to production Firebase services.");
}


// Export the initialized app, functions service, and firestore service
export { app, functions, db, httpsCallable };

// Example of how to define a callable function reference (can be done where needed)
// export const joinGameCallable = httpsCallable(functions, 'joinGame');