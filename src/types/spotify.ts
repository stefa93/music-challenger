// Frontend types mirroring functions/src/types/spotify.ts

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  type: 'artist';
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url: string | null;
  uri: string;
  external_urls: {
    spotify: string;
  };
  type: 'track';
}

// Structure expected from the searchSpotifyTracks backend function
export interface SpotifySearchSuccessResponse {
    success: true;
    results: SpotifyTrack[];
}