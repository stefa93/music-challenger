import { onCall } from 'firebase-functions/v2/https'; // Removed unused HttpsError
import * as logger from 'firebase-functions/logger';
import * as challengeData from './challenge.data';
import { PredefinedSong } from './types'; // Use local type

interface GetChallengeDetailsRequest {
    challengeText: string;
    traceId?: string; // Optional traceId from client
}

interface GetChallengeDetailsResponse {
    success: true;
    predefinedSongs: PredefinedSong[];
}

interface ErrorResponse {
    success: false;
    error: string;
}

/**
 * Fetches the details (including predefined songs) for a specific challenge.
 */
export const getChallengeDetailsHandler = onCall(
    async (request): Promise<GetChallengeDetailsResponse | ErrorResponse> => {
        const { challengeText } = request.data as GetChallengeDetailsRequest;
        const traceId = request.data.traceId || `getChallengeDetails_${Date.now()}`;

        logger.info(`[${traceId}] getChallengeDetailsHandler triggered.`, { challengeText });

        // Basic validation
        if (!challengeText || typeof challengeText !== 'string' || challengeText.trim() === '') {
            logger.warn(`[${traceId}] Invalid challengeText received.`);
            // Consider throwing HttpsError for client feedback
            return { success: false, error: 'Invalid challenge text provided.' };
            // throw new HttpsError('invalid-argument', 'Challenge text is required.');
        }

        // Authentication check (optional, depending on if challenges are public)
        // if (!request.auth) {
        //   logger.warn(`[${traceId}] Unauthenticated user attempt.`);
        //   return { success: false, error: 'Authentication required.' };
        // }

        try {
            const challengeDoc = await challengeData.getChallengeByText(challengeText, traceId);

            if (!challengeDoc) {
                logger.warn(`[${traceId}] Challenge not found for text: "${challengeText}"`);
                // Return empty list if challenge text is valid but not found (e.g., during population)
                return { success: true, predefinedSongs: [] };
                // Or throw an error:
                // throw new HttpsError('not-found', `Challenge not found for text: "${challengeText}"`);
            }

            const predefinedSongs = challengeDoc.predefinedSongs || [];
            logger.info(`[${traceId}] Successfully fetched ${predefinedSongs.length} predefined songs for challenge "${challengeText}".`);

            return { success: true, predefinedSongs };

        } catch (error) {
            logger.error(`[${traceId}] Error fetching challenge details for "${challengeText}":`, error);
            // Consider throwing HttpsError for client feedback
            return { success: false, error: 'Failed to fetch challenge details.' };
            // throw new HttpsError('internal', 'Failed to fetch challenge details.');
        }
    }
);