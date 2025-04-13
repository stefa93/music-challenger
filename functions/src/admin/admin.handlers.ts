import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import { getAdminDashboardDataService, getAdminChallengeDataService } from './admin.service';
import { AdminDashboardData, AdminChallengeData } from './types';
// TODO: Import necessary types (e.g., AdminDashboardData, AdminChallengeData)

/**
 * Fetches consolidated data for the admin dashboard.
 * - Active games
 * - Player counts
 * - Calculated KPIs
 */
export const getAdminDashboardData = functions.https.onCall(async (data, context) => {
  // Security Note: No authentication implemented as per initial requirement.
  // TODO: Add proper authentication/authorization checks in future iterations.
  logger.info('getAdminDashboardData called', { structuredData: true });

  try {
    const dashboardData: AdminDashboardData = await getAdminDashboardDataService();
    return dashboardData;
    // return { message: 'getAdminDashboardData not implemented yet' }; // Placeholder
  } catch (error) {
    logger.error('Error fetching admin dashboard data:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch admin dashboard data.');
  }
});

/**
 * Fetches all predefined challenges and their associated songs.
 */
export const getAdminChallengeData = functions.https.onCall(async (data, context) => {
  // Security Note: No authentication implemented as per initial requirement.
  logger.info('getAdminChallengeData called', { structuredData: true });

  try {
    const challengeData: AdminChallengeData[] = await getAdminChallengeDataService();
    return challengeData;
    // return { message: 'getAdminChallengeData not implemented yet' }; // Placeholder
  } catch (error) {
    logger.error('Error fetching admin challenge data:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch admin challenge data.');
  }
});