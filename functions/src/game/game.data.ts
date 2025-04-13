import { db } from "../core/firestoreClient"; // Adjusted path
import { FieldValue } from 'firebase-admin/firestore';
import { Game, GameDocument, GameUpdateData } from "./types"; // Adjusted path
import * as logger from "firebase-functions/logger";
import { TraceId } from "../core/types"; // Adjusted path
import { MAX_PLAYERS } from "../core/constants"; // Adjusted path

const GAMES_COLLECTION = "games";

/**
 * Gets the Firestore DocumentReference for a specific game.
 * @param gameId The ID of the game.
 * @returns DocumentReference for the game.
 */
export function getGameRef(gameId: string): FirebaseFirestore.DocumentReference {
  return db.collection(GAMES_COLLECTION).doc(gameId);
}

/**
 * Fetches a game document by its ID.
 * Can optionally be performed within a Firestore transaction.
 * @param gameId The ID of the game to fetch.
 * @param traceId For logging purposes.
 * @param transaction Optional Firestore transaction.
 * @returns The Game object if found, otherwise null.
 */
export async function getGameById(
  gameId: string,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction
): Promise<Game | null> {
  const gameRef = getGameRef(gameId);
  logger.debug(`[${traceId}] Reading game document: ${gameRef.path}`);
  const docSnapshot = transaction ? await transaction.get(gameRef) : await gameRef.get();

  if (!docSnapshot.exists) {
    logger.warn(`[${traceId}] Game document ${gameId} not found.`);
    return null;
  }

  const gameData = docSnapshot.data() as GameDocument;
  return { id: docSnapshot.id, ...gameData };
}

/**
 * Creates a new game document within a transaction.
 * @param gameId The ID for the new game.
 * @param gameData The initial data for the game (excluding createdAt).
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function createGameDocument(
  gameId: string,
  gameData: Omit<GameDocument, "createdAt">, // Ensure createdAt is handled internally
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): void {
  const gameRef = getGameRef(gameId);
  logger.debug(`[${traceId}] Setting game document within transaction: ${gameRef.path}`);
  transaction.set(gameRef, {
    ...gameData,
    createdAt: FieldValue.serverTimestamp(), // Set creation timestamp
  });
}

/**
 * Finds an available game (status='waiting', playerCount < MAX_PLAYERS).
 * @param traceId For logging purposes.
 * @returns The ID of the first available game found, or null if none are available.
 */
export async function findAvailableGame(traceId: TraceId): Promise<string | null> {
  logger.info(`[${traceId}] Searching for an available game...`);
  try {
    const gamesRef = db.collection(GAMES_COLLECTION);
    const query = gamesRef
      .where("status", "==", "waiting")
      .where("playerCount", "<", MAX_PLAYERS)
      .orderBy("createdAt", "asc") // Find the oldest waiting game first
      .limit(1);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      logger.warn(`[${traceId}] No available games found matching criteria.`);
      return null;
    }

    const availableGameId = querySnapshot.docs[0].id;
    logger.info(`[${traceId}] Found available game: ${availableGameId}`);
    return availableGameId;

  } catch (error) {
    logger.error(`[${traceId}] Error finding available game:`, { error });
    // Depending on desired behavior, could throw or just return null
    return null; // Return null on error to indicate no game found
  }
}

/**
 * Updates specific fields of a game document within a transaction.
 * @param gameId The ID of the game to update.
 * @param updates An object containing the fields to update.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function updateGameDetails(
  gameId: string,
  updates: GameUpdateData, // Use the specific update type
  traceId: TraceId, // Moved before optional transaction
  transaction?: FirebaseFirestore.Transaction // Make optional
): void {
  const gameRef = getGameRef(gameId);
  logger.debug(`[${traceId}] Updating game document within transaction: ${gameRef.path}`, { updates });
  if (transaction) {
    transaction.update(gameRef, updates);
  } else {
    // If no transaction, perform a direct update
    gameRef.update(updates).catch(err => {
      logger.error(`[${traceId}] Direct update failed for game ${gameId}:`, err);
      // Consider re-throwing or handling the error appropriately
    });
  }
}

/**
 * Increments the player count for a game within a transaction.
 * @param gameId The ID of the game.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function incrementPlayerCount(
  gameId: string,
  traceId: TraceId, // Moved before optional transaction
  transaction?: FirebaseFirestore.Transaction // Make optional
): void {
  const gameRef = getGameRef(gameId);
  logger.debug(`[${traceId}] Incrementing player count within transaction: ${gameRef.path}`);
  const incrementUpdate = { playerCount: FieldValue.increment(1) };
  if (transaction) {
    transaction.update(gameRef, incrementUpdate);
  } else {
    // If no transaction, perform a direct update
    gameRef.update(incrementUpdate).catch(err => {
      logger.error(`[${traceId}] Direct increment failed for game ${gameId}:`, err);
      // Consider re-throwing or handling the error appropriately
    });
  }
}