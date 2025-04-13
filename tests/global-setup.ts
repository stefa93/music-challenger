import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function globalSetup() {
  console.log('Global Setup: Clearing Firestore emulator data...');
  // Replace with your actual project ID if different
  const projectId = 'dance-floor-ranking';
  // Ensure the emulator host/port are correct
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  const command = `curl -s -X DELETE "http://${firestoreHost}/emulator/v1/projects/${projectId}/databases/(default)/documents"`;

  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.error(`Error clearing Firestore (stderr): ${stderr}`);
      // Decide if this should throw an error and halt tests
      // throw new Error(`Failed to clear Firestore: ${stderr}`);
    } else {
      console.log(`Firestore emulator cleared successfully: ${stdout || '(No stdout)'}`);
      // Add a short delay after successful clearing
      console.log('Global Setup: Waiting 1 second after clearing...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      console.log('Global Setup: Delay finished.');
    }
  } catch (error: any) {
    console.error(`Error executing Firestore clear command: ${error.message}`);
    // Decide if this should throw an error and halt tests
    throw new Error(`Failed to execute Firestore clear command: ${error.message}`);
  }
}

export default globalSetup;