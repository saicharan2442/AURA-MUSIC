import type { Album, Artist, HomeFeed, SearchResults, Track } from '../types';

/* ------------------------------------------------------------------ */
/*  MusicProvider — the abstraction every source adapter implements.  */
/*  New providers (e.g. Jamendo, Audius, radio directory) should      */
/*  implement this interface and register in services/index.          */
/*  Only provider-permitted public APIs must be used.                 */
/* ------------------------------------------------------------------ */

export interface AlbumDetail {
  album: Album;
  tracks: Track[];
}

export interface ArtistDetail {
  artist: Artist;
  topTracks: Track[];
  albums: Album[];
}

export interface MusicProvider {
  readonly id: string;
  readonly name: string;
  readonly attribution: string;

  searchSongs(query: string, limit?: number, signal?: AbortSignal): Promise<Track[]>;
  searchAll(query: string, signal?: AbortSignal): Promise<SearchResults>;
  suggestions(query: string, signal?: AbortSignal): Promise<Track[]>;

  homeFeed(): Promise<HomeFeed>;
  albumDetail(albumId: string): Promise<AlbumDetail>;
  artistDetail(artistId: string): Promise<ArtistDetail>;
  genreTop(genreId: string, limit?: number): Promise<Track[]>;
  genreAlbums(genreId: string, limit?: number): Promise<Album[]>;
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}
