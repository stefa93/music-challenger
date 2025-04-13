import { db } from '../core/firestoreClient';
import * as logger from 'firebase-functions/logger';
import { TraceId } from '../core/types';
import { ChallengeDocument } from './types';
import { Transaction } from 'firebase-admin/firestore';

const CHALLENGES_COLLECTION = 'challenges';

/**
 * Fetches a challenge document from Firestore based on the challenge text.
 * Assumes challenge text is unique or fetches the first match.
 *
 * @param challengeText The text of the challenge to find.
 * @param traceId For logging.
 * @param transaction Optional Firestore transaction.
 * @returns The ChallengeDocument or null if not found.
 */
export async function getChallengeByText(
  challengeText: string,
  traceId: TraceId,
  transaction?: Transaction
): Promise<(ChallengeDocument & { id: string }) | null> {
  logger.debug(`[${traceId}] DAL: getChallengeByText called.`, { challengeText });
  const challengesRef = db.collection(CHALLENGES_COLLECTION);
  const query = challengesRef.where('text', '==', challengeText).limit(1);

  try {
    const snapshot = transaction ? await transaction.get(query) : await query.get();

    if (snapshot.empty) {
      logger.warn(`[${traceId}] DAL: No challenge found with text: "${challengeText}"`);
      return null;
    }

    // Should only be one due to limit(1)
    const doc = snapshot.docs[0];
    const data = doc.data() as ChallengeDocument;
    logger.debug(`[${traceId}] DAL: Found challenge document ${doc.id}.`);
    return { id: doc.id, ...data };

  } catch (error) {
    logger.error(`[${traceId}] DAL: Error fetching challenge by text "${challengeText}":`, error);
    // Re-throwing might be better in service layer, but returning null for now
    return null;
  }
}