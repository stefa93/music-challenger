import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue directly, Removed db, Timestamp
import { Player, PlayerDocument } from "./types"; // Adjusted path
import * as logger from "firebase-functions/logger";
import { TraceId } from "../core/types"; // Adjusted path
import { getGameRef } from "../game/game.data"; // Adjusted path

const PLAYERS_SUBCOLLECTION = "players";

/**
 * Gets the Firestore CollectionReference for the players subcollection of a specific game.
 * @param gameId The ID of the parent game.
 * @returns CollectionReference for the players subcollection.
 */
export function getPlayersRef(gameId: string): FirebaseFirestore.CollectionReference {
  return getGameRef(gameId).collection(PLAYERS_SUBCOLLECTION);
}

/**
 * Gets the Firestore DocumentReference for a specific player within a game.
 * @param gameId The ID of the parent game.
 * @param playerId The ID of the player.
 * @returns DocumentReference for the player.
 */
export function getPlayerRef(gameId: string, playerId: string): FirebaseFirestore.DocumentReference {
  return getPlayersRef(gameId).doc(playerId);
}

/**
 * Fetches all player documents for a given game.
 * Can optionally be performed within a Firestore transaction.
 * @param gameId The ID of the game.
 * @param traceId For logging purposes.
 * @param transaction Optional Firestore transaction.
 * @returns A QuerySnapshot containing all player documents.
 */
export async function getAllPlayers(
  gameId: string,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction
): Promise<FirebaseFirestore.QuerySnapshot> {
  const playersRef = getPlayersRef(gameId);
  logger.debug(`[${traceId}] Reading all player documents: ${playersRef.path}`);
  const snapshot = transaction ? await transaction.get(playersRef) : await playersRef.get();
  logger.debug(`[${traceId}] Found ${snapshot.size} players for game ${gameId}.`);
  return snapshot;
}

/**
 * Fetches all *active* player documents (where hasJoined is true) for a given game.
 * Can optionally be performed within a Firestore transaction.
 * @param gameId The ID of the game.
 * @param traceId For logging purposes.
 * @param transaction Optional Firestore transaction.
 * @returns An array of Player objects for active players.
 */
export async function getActivePlayers(
  gameId: string,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction
): Promise<Player[]> {
  const playersRef = getPlayersRef(gameId);
  const query = playersRef.where("hasJoined", "==", true);
  logger.debug(`[${traceId}] Reading active player documents: ${playersRef.path} (querying hasJoined == true)`);
  const snapshot = transaction ? await transaction.get(query) : await query.get();
  logger.debug(`[${traceId}] Found ${snapshot.size} active players for game ${gameId}.`);

  const activePlayers: Player[] = [];
  snapshot.forEach(doc => {
    activePlayers.push({ id: doc.id, ...(doc.data() as PlayerDocument) });
  });
  return activePlayers;
}

/**
 * Fetches a player document by its ID within a specific game.
 * Can optionally be performed within a Firestore transaction.
 * @param gameId The ID of the parent game.
 * @param playerId The ID of the player to fetch.
 * @param traceId For logging purposes.
 * @param transaction Optional Firestore transaction.
 * @returns The Player object if found, otherwise null.
 */
export async function getPlayerById(
  gameId: string,
  playerId: string,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction
): Promise<Player | null> {
  const playerRef = getPlayerRef(gameId, playerId);
  logger.debug(`[${traceId}] Reading player document: ${playerRef.path}`);
  const docSnapshot = transaction ? await transaction.get(playerRef) : await playerRef.get();

  if (!docSnapshot.exists) {
    logger.warn(`[${traceId}] Player document ${playerId} in game ${gameId} not found.`);
    return null;
  }

  const playerData = docSnapshot.data() as PlayerDocument;
  return { id: docSnapshot.id, ...playerData };
}

/**
 * Checks if a player with a specific name already exists in the game.
 * Must be performed within a Firestore transaction to ensure consistency.
 * @param gameId The ID of the game.
 * @param playerName The name to check for.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 * @returns True if a player with the name exists, false otherwise.
 */
export async function checkPlayerNameExists(
  gameId: string,
  playerName: string,
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): Promise<boolean> {
  const playersRef = getPlayersRef(gameId);
  const nameQuery = playersRef.where("name", "==", playerName).limit(1);
  logger.debug(`[${traceId}] Querying for existing player name within transaction: ${playersRef.path}`);
  const nameSnapshot = await transaction.get(nameQuery);
  logger.debug(`[${traceId}] Player name query result: empty=${nameSnapshot.empty}`);
  return !nameSnapshot.empty;
}

/**
 * Adds a new player document to a game within a transaction.
 * @param gameId The ID of the parent game.
 * @param playerId The ID for the new player.
 * @param playerData The initial data for the player (excluding joinedAt).
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function addPlayerDocument(
  gameId: string,
  playerId: string,
  playerData: Omit<PlayerDocument, "joinedAt">, // Ensure joinedAt is handled internally
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): void {
  const playerRef = getPlayerRef(gameId, playerId);
  logger.debug(`[${traceId}] Setting player document within transaction: ${playerRef.path}`);
  transaction.set(playerRef, {
    ...playerData,
    joinedAt: FieldValue.serverTimestamp(), // Set join timestamp
  });
}

/**
 * Updates specific fields of a player document. Can be used within or outside a transaction.
 * @param gameId The ID of the parent game.
 * @param playerId The ID of the player to update.
 * @param updates An object containing the fields to update.
 * @param traceId For logging purposes.
 * @param transaction Optional Firestore transaction.
 */
export async function updatePlayerDetails(
  gameId: string,
  playerId: string,
  updates: Partial<PlayerDocument>,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction
): Promise<void> {
  const playerRef = getPlayerRef(gameId, playerId);
  logger.debug(`[${traceId}] Updating player document ${transaction ? 'within transaction' : ''}: ${playerRef.path}`, { updates });
  if (transaction) {
    transaction.update(playerRef, updates);
  } else {
    await playerRef.update(updates);
  }
}

/**
 * Increments the score for a specific player within a transaction.
 * @param gameId The ID of the parent game.
 * @param playerId The ID of the player whose score to increment.
 * @param amount The amount to increment the score by.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function incrementPlayerScore(
  gameId: string,
  playerId: string,
  amount: number,
  traceId: TraceId, // Moved before optional transaction
  transaction?: FirebaseFirestore.Transaction // Make optional
): void {
  const playerRef = getPlayerRef(gameId, playerId);
  logger.debug(`[${traceId}] Incrementing player score within transaction: ${playerRef.path} by ${amount}`);
  const incrementUpdate = { score: FieldValue.increment(amount) };
  if (transaction) {
    transaction.update(playerRef, incrementUpdate);
  } else {
    // If no transaction, perform a direct update
    playerRef.update(incrementUpdate).catch(err => {
      logger.error(`[${traceId}] Direct score increment failed for player ${playerId} in game ${gameId}:`, err);
      // Consider re-throwing or handling the error appropriately
    });
  }
}

// getPlayerSpotifyAccessToken function removed as part of generic music provider refactor