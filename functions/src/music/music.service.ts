import * as logger from "firebase-functions/logger";
import { MusicProviderService } from "./musicProvider.interface"; // Adjusted path
import { deezerMusicService } from "./deezer.service"; // Adjusted path
// Import other provider services here if/when implemented
// import { spotifyMusicService } from "./spotifyMusicService";

// TODO: Implement configuration mechanism (e.g., Firebase Remote Config, Firestore doc)
const getConfiguredProvider = (): string => {
  // For now, hardcode Deezer as the provider
  // In the future, read this from config: functions.config().music.provider || 'deezer'
  const provider = "deezer";
  logger.info(`Using configured music provider: ${provider}`);
  return provider;
};

/**
 * Factory function to get the configured music provider service instance.
 *
 * This acts as a central point for accessing music provider functionality,
 * allowing the underlying provider (Deezer, Spotify, etc.) to be switched
 * via configuration without changing the calling code.
 *
 * @returns An instance implementing the MusicProviderService interface.
 * @throws Error if the configured provider is not supported.
 */
export const getMusicProvider = (): MusicProviderService => {
  const providerName = getConfiguredProvider();

  switch (providerName.toLowerCase()) {
    case "deezer":
      return deezerMusicService;
    // case "spotify":
    //   // Ensure spotifyMusicService is imported and instantiated if needed
    //   // return spotifyMusicService;
    default:
      logger.error(`Unsupported music provider configured: ${providerName}`);
      // Throw an error to prevent the application from running with an invalid config
      throw new Error(`Unsupported music provider configured: ${providerName}`);
  }
};