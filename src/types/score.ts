export interface ScoreDetails {
  // id would be the playerId - not explicitly stored in doc usually
  roundScore: number;
  bonusPoints: number;
  jokerUsed: boolean;
  totalScoreForRound: number;
  // Add other fields as needed, e.g., timestamp
}