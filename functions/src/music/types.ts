// Generic Music Provider Types - Backend

export interface MusicArtist {
  id?: string; // Provider-specific ID (optional)
  name: string;
}

export interface MusicAlbum {
  id?: string; // Provider-specific ID (optional)
  name: string;
  imageUrl?: string; // URL for album art (prefer smaller size if available)
}

export interface MusicTrack {
  trackId: string; // Provider-specific Track ID (e.g., Deezer ID)
  name: string;
  artistName: string; // Combined artist names or primary artist
  albumName?: string; // Optional album name
  previewUrl: string | null; // URL for 30-second preview, null if unavailable
  albumImageUrl?: string; // URL for album art
  durationMs?: number; // Optional track duration
  providerUrl?: string; // Optional link to track on provider's site (e.g., Deezer page)

  // Include raw provider data optionally for debugging or future use?
  // raw?: any;
}