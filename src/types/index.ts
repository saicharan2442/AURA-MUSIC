/* ------------------------------------------------------------------ */
/*  Core, provider-independent data models                            */
/* ------------------------------------------------------------------ */

export interface Track {
  id: string;
  provider: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  artwork: string;            // hi-res (400-600px)
  artworkSmall: string;       // ~100px
  duration: number;           // seconds (0 for live)
  streamUrl?: string;         // playable stream (provider-permitted)
  genre?: string;
  year?: string;
  trackNumber?: number;
  url?: string;               // canonical web link
  live?: boolean;             // endless stream (internet radio)
}

export interface Album {
  id: string;
  provider: string;
  title: string;
  artist: string;
  artistId?: string;
  artwork: string;
  year?: string;
  genre?: string;
  url?: string;
}

export interface Artist {
  id: string;
  provider: string;
  name: string;
  artwork?: string;
  url?: string;
}

export interface SearchResults {
  top?: Track;
  songs: Track[];
  albums: Album[];
  artists: Artist[];
}

export interface HomeFeed {
  charts: Track[];
  topAlbums: Album[];
  newReleases: Album[];
  artists: Artist[];
}

/* ------------------------- Local library ------------------------- */

export interface LocalPlaylist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface RecentEntry {
  track: Track;
  at: number;
}

/* ------------------------- Settings ------------------------- */

export type ThemeMode = 'dark' | 'light' | 'system';
export type AnimLevel = 'full' | 'reduced' | 'off';
export type RepeatMode = 'off' | 'all' | 'one';
export type NotifyMode = 'off' | 'inapp' | 'native';

/* ------------------------- UI ------------------------- */

export type PageId =
  | 'home' | 'discover' | 'search'
  | 'library' | 'favorites' | 'playlists' | 'playlist' | 'recent'
  | 'album' | 'artist' | 'genre'
  | 'settings' | 'about';

export interface Page {
  id: PageId;
  params?: Record<string, any>;
}
