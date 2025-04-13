import { Timestamp } from 'firebase/firestore';

export interface RankingSubmission {
  // id would be the playerId - not explicitly stored in doc usually
  rankings: { [songId: string]: number }; // Map of song ID to rank number
  submittedAt: Timestamp;
}