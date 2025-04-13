import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue directly, Removed db, Timestamp
import { Round, RoundDocument, PlayerSongSubmission, RankingDocument, ScoreDocument, RoundUpdateData } from "./types"; // Adjusted path
import * as logger from "firebase-functions/logger";
import { TraceId } from "../core/types"; // Adjusted path
import { getGameRef } from "../game/game.data"; // Adjusted path

const ROUNDS_SUBCOLLECTION = "rounds";
const RANKINGS_SUBCOLLECTION = "rankings";
const SCORES_SUBCOLLECTION = "scores";

// --- Round References ---

/**
 * Gets the Firestore CollectionReference for the rounds subcollection of a specific game.
 * @param gameId The ID of the parent game.
 * @returns CollectionReference for the rounds subcollection.
 */
export function getRoundsRef(gameId: string): FirebaseFirestore.CollectionReference {
  return getGameRef(gameId).collection(ROUNDS_SUBCOLLECTION);
}

/**
 * Gets the Firestore DocumentReference for a specific round within a game.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number (ID) of the round.
 * @returns DocumentReference for the round.
 */
export function getRoundRef(gameId: string, roundNumber: number): FirebaseFirestore.DocumentReference {
  return getRoundsRef(gameId).doc(String(roundNumber));
}

// --- Round Data Operations ---

/**
 * Fetches a round document by its number within a specific game.
 * Can optionally be performed within a Firestore transaction.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round to fetch.
 * @param traceId For logging purposes.
 * @param transaction Optional Firestore transaction.
 * @returns The Round object if found, otherwise null.
 */
export async function getRoundByNumber(
  gameId: string,
  roundNumber: number,
  traceId: TraceId,
  transaction?: FirebaseFirestore.Transaction
): Promise<Round | null> {
  const roundRef = getRoundRef(gameId, roundNumber);
  logger.debug(`[${traceId}] Reading round document: ${roundRef.path}`);
  const docSnapshot = transaction ? await transaction.get(roundRef) : await roundRef.get();

  if (!docSnapshot.exists) {
    logger.warn(`[${traceId}] Round document ${roundNumber} in game ${gameId} not found.`);
    return null;
  }

  const roundData = docSnapshot.data() as RoundDocument;
  return { roundNumber: roundNumber, ...roundData };
}

/**
 * Creates a new round document within a transaction.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number for the new round.
 * @param roundData The initial data for the round (excluding createdAt).
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function createRoundDocument(
  gameId: string,
  roundNumber: number,
  roundData: Omit<RoundDocument, "createdAt">, // Ensure createdAt is handled internally
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): void {
  const roundRef = getRoundRef(gameId, roundNumber);
  logger.debug(`[${traceId}] Setting round document within transaction: ${roundRef.path}`);
  transaction.set(roundRef, {
    ...roundData,
    createdAt: FieldValue.serverTimestamp(), // Set creation timestamp
  });
}

/**
 * Updates specific fields of a round document within a transaction.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round to update.
 * @param updates An object containing the fields to update.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function updateRoundDetails(
  gameId: string,
  roundNumber: number,
  updates: RoundUpdateData, // Use RoundUpdateData to allow FieldValue
  traceId: TraceId, // Moved before optional transaction
  transaction?: FirebaseFirestore.Transaction // Make optional
): void {
  const roundRef = getRoundRef(gameId, roundNumber);
  logger.debug(`[${traceId}] Updating round document within transaction: ${roundRef.path}`, { updates });
  if (transaction) {
    transaction.update(roundRef, updates);
  } else {
    // If no transaction, perform a direct update
    roundRef.update(updates).catch(err => {
      logger.error(`[${traceId}] Direct update failed for round ${roundNumber} in game ${gameId}:`, err);
      // Consider re-throwing or handling the error appropriately
    });
  }
}

/**
 * Adds or updates a player's song submission within a round document using a transaction.
 * Uses dot notation for updating the map field.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round.
 * @param playerId The ID of the submitting player.
 * @param submission The song submission data (excluding submittedAt).
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function addPlayerSongSubmission(
  gameId: string,
  roundNumber: number,
  playerId: string,
  submission: Omit<PlayerSongSubmission, "submittedAt">,
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): void {
  const roundRef = getRoundRef(gameId, roundNumber);
  const submissionData = {
    ...submission,
    submittedAt: FieldValue.serverTimestamp(),
  };
  logger.debug(`[${traceId}] Updating playerSongs map within transaction: ${roundRef.path}`, { playerId, submissionData });
  // Use dot notation to update a specific key in the map
  transaction.update(roundRef, {
    [`playerSongs.${playerId}`]: submissionData,
  });
}


// --- Ranking References & Operations ---

/**
 * Gets the Firestore CollectionReference for the rankings subcollection of a specific round.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the parent round.
 * @returns CollectionReference for the rankings subcollection.
 */
export function getRankingsRef(gameId: string, roundNumber: number): FirebaseFirestore.CollectionReference {
  return getRoundRef(gameId, roundNumber).collection(RANKINGS_SUBCOLLECTION);
}

/**
 * Gets the Firestore DocumentReference for a specific player's ranking within a round.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the parent round.
 * @param playerId The ID of the player whose ranking it is.
 * @returns DocumentReference for the player's ranking.
 */
export function getPlayerRankingRef(gameId: string, roundNumber: number, playerId: string): FirebaseFirestore.DocumentReference {
  return getRankingsRef(gameId, roundNumber).doc(playerId);
}

/**
 * Fetches all ranking documents for a given round.
 * Must be performed within a Firestore transaction for score calculation consistency.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 * @returns A QuerySnapshot containing all ranking documents for the round.
 */
export async function getAllRankingsForRound(
  gameId: string,
  roundNumber: number,
  traceId: TraceId, // Moved before optional transaction
  transaction?: FirebaseFirestore.Transaction // Make optional
): Promise<FirebaseFirestore.QuerySnapshot> {
  const rankingsRef = getRankingsRef(gameId, roundNumber);
  logger.debug(`[${traceId}] Reading all ranking documents within transaction: ${rankingsRef.path}`);
  const snapshot = transaction ? await transaction.get(rankingsRef) : await rankingsRef.get();
  logger.debug(`[${traceId}] Found ${snapshot.size} rankings for game ${gameId}, round ${roundNumber}.`);
  return snapshot;
}

/**
 * Checks if a specific player's ranking document exists for a round.
 * Must be performed within a Firestore transaction.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round.
 * @param playerId The ID of the player.
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 * @returns True if the ranking document exists, false otherwise.
 */
export async function checkPlayerRankingExists(
  gameId: string,
  roundNumber: number,
  playerId: string,
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): Promise<boolean> {
    const rankingRef = getPlayerRankingRef(gameId, roundNumber, playerId);
    logger.debug(`[${traceId}] Checking for player ranking document within transaction: ${rankingRef.path}`);
    const rankingDoc = await transaction.get(rankingRef);
    return rankingDoc.exists;
}


/**
 * Adds a new player ranking document for a round within a transaction.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round.
 * @param playerId The ID of the player submitting the ranking.
 * @param rankingData The ranking data (excluding submittedAt).
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function addRankingDocument(
  gameId: string,
  roundNumber: number,
  playerId: string,
  rankingData: Omit<RankingDocument, "submittedAt">,
  transaction: FirebaseFirestore.Transaction,
  traceId: TraceId
): void {
  const rankingRef = getPlayerRankingRef(gameId, roundNumber, playerId);
  logger.debug(`[${traceId}] Setting ranking document within transaction: ${rankingRef.path}`);
  transaction.set(rankingRef, {
    ...rankingData,
    submittedAt: FieldValue.serverTimestamp(),
  });
}

// --- Score References & Operations ---

/**
 * Gets the Firestore CollectionReference for the scores subcollection of a specific round.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the parent round.
 * @returns CollectionReference for the scores subcollection.
 */
export function getScoresRef(gameId: string, roundNumber: number): FirebaseFirestore.CollectionReference {
  return getRoundRef(gameId, roundNumber).collection(SCORES_SUBCOLLECTION);
}

/**
 * Gets the Firestore DocumentReference for a specific player's score within a round.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the parent round.
 * @param playerId The ID of the player whose score it is.
 * @returns DocumentReference for the player's score.
 */
export function getPlayerScoreRef(gameId: string, roundNumber: number, playerId: string): FirebaseFirestore.DocumentReference {
  return getScoresRef(gameId, roundNumber).doc(playerId);
}

/**
 * Adds a new player score document for a round within a transaction.
 * @param gameId The ID of the parent game.
 * @param roundNumber The number of the round.
 * @param playerId The ID of the player whose score it is.
 * @param scoreData The score data (excluding calculatedAt).
 * @param transaction The Firestore transaction to use.
 * @param traceId For logging purposes.
 */
export function addScoreDocument(
  gameId: string,
  roundNumber: number,
  playerId: string,
  scoreData: Omit<ScoreDocument, "calculatedAt">,
  traceId: TraceId, // Moved before optional transaction
  transaction?: FirebaseFirestore.Transaction // Make optional
): void {
  const scoreRef = getPlayerScoreRef(gameId, roundNumber, playerId);
  logger.debug(`[${traceId}] Setting score document within transaction: ${scoreRef.path}`);
  const scoreDocWithTimestamp = {
    ...scoreData,
    calculatedAt: FieldValue.serverTimestamp(),
  };
  if (transaction) {
    transaction.set(scoreRef, scoreDocWithTimestamp);
  } else {
    // If no transaction, perform a direct set
    scoreRef.set(scoreDocWithTimestamp).catch(err => {
      logger.error(`[${traceId}] Direct set failed for score doc ${playerId} in round ${roundNumber}, game ${gameId}:`, err);
      // Consider re-throwing or handling the error appropriately
    });
  }
}