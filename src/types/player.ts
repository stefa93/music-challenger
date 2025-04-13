import { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string; // Document ID (same as playerId)
  name: string;
  score: number;
  hasJoined: boolean; // Or maybe just check existence? Assuming it's used.
  joinedAt: Timestamp;
  jokerAvailable: boolean;
  // Add other fields as needed
}