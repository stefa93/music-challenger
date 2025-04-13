/**
 * Main entry point for Firebase Cloud Functions.
 * This file imports and exports function handlers defined using a Feature-Based Architecture.
 */

// Initialize Firebase Admin SDK (delegated to firestoreClient in core)
import "./core/firestoreClient"; // Ensure admin is initialized from the core directory

// Import handlers from their respective feature modules
import * as gameHandlers from "./game/game.handlers";
import * as playerHandlers from "./player/player.handlers";
import * as roundHandlers from "./round/round.handlers";
import * as scoringHandlers from "./scoring/scoring.handlers";
import * as musicHandlers from "./music/music.handlers";
import * as configHandlers from "./config/config.handlers";
import * as challengeHandlers from "./challenge/challenge.handlers"; // Added challenge handlers
import * as adminHandlers from "./admin/admin.handlers";

// Export functions with the names expected by Firebase deployment

// Game Management
export const createGame = gameHandlers.createGame;
export const startGame = gameHandlers.startGame;
export const updateGameSettings = gameHandlers.updateGameSettings;

// Player Actions
export const joinGame = playerHandlers.joinGame;

// Round Lifecycle
export const submitRanking = roundHandlers.submitRanking;
export const startNextRound = roundHandlers.startNextRound;
export const startSelectionPhase = roundHandlers.startSelectionPhase;
export const onRoundStatusUpdate = roundHandlers.onRoundStatusUpdate; // Firestore trigger
export const submitSongNomination = roundHandlers.submitSongNomination;
export const setChallenge = roundHandlers.setChallenge;
export const startRankingPhase = roundHandlers.startRankingPhase;
export const controlPlayback = roundHandlers.controlPlayback;

// Scoring
export const calculateScores = scoringHandlers.calculateScores; // Note: This is callable, but scoring is primarily triggered by onRoundStatusUpdate

// Music Provider Integration
export const searchMusicTracks = musicHandlers.searchMusicTracks;

// Config / Misc
export const getPredefinedChallenges = configHandlers.getPredefinedChallenges;
export const populateChallenges = configHandlers.populateChallenges; // Utility/Admin function
export const getChallengeDetails = challengeHandlers.getChallengeDetailsHandler; // Added new handler

// Admin Dashboard
export const getAdminDashboardData = adminHandlers.getAdminDashboardData;
export const getAdminChallengeData = adminHandlers.getAdminChallengeData;
