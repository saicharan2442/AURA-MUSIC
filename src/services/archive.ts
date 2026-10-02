import type { Album, Artist, HomeFeed, SearchResults, Track } from '../types';
import type { AlbumDetail, ArtistDetail, MusicProvider } from './provider';
import { cached, jget } from './http';

/* ------------------------------------------------------------------ */
/*  Internet Archive provider                                         */
/*                                                                    */
/*  • Free public domain audio and live concerts (Live Music Archive) */
/*  • No API key required, open metadata and MP3 files                */
/* ------------------------------------------------------------------ */

const API = 'https://archive.org';

function mapItemToAlbum(doc: any): Album {
  return {
    id: `arc:${doc.identifier}`,
    provider: 'archive',
    title: doc.title || 'Unknown Title',
    artist: doc.creator || 'Internet Archive',
    artwork: `https://archive.org/services/img/${doc.identifier}`,
    year: doc.date ? String(doc.date).slice(0, 4) : undefined,
    url: `https://archive.org/details/${doc.identifier}`,
  };
}

async function searchArchiveAlbums(query: string, limit = 12, signal?: AbortSignal): Promise<Album[]> {
  const q = encodeURIComponent(`collection:(etree OR audio_music) AND (title:(${query}) OR creator:(${query}))`);
  const json = await jget(`${API}/advancedsearch.php?q=${q}&fl[]=identifier,title,creator,date&sort[]=downloads+desc&output=json&rows=${limit}`, 9000, signal);
  const docs = json?.response?.docs ?? [];
  return docs.map(mapItemToAlbum);
}

export const archiveProvider: MusicProvider = {
  id: 'archive',
  name: 'Internet Archive',
  attribution: 'Live concerts and open audio hosted by the Internet Archive (archive.org).',

  searchSongs: async () => [], // Archive search focuses on collections/albums
  suggestions: async () => [],

  async searchAll(query: string, signal?: AbortSignal): Promise<SearchResults> {
    const albums = await searchArchiveAlbums(query, 12, signal);
    return {
      top: undefined,
      songs: [],
      albums,
      artists: [],
    };
  },

  homeFeed: async () => {
    return cached('arc:home', 10 * 60_000, async () => {
      const q = encodeURIComponent('collection:etree');
      const json = await jget(`${API}/advancedsearch.php?q=${q}&fl[]=identifier,title,creator,date&sort[]=addeddate+desc&output=json&rows=14`, 10000);
      const docs = json?.response?.docs ?? [];
      const albums = docs.map(mapItemToAlbum);
      return { charts: [], artists: [], topAlbums: albums.slice(0, 7), newReleases: albums.slice(7) };
    });
  },

  async albumDetail(idPrefixed: string): Promise<AlbumDetail> {
    const id = idPrefixed.replace(/^arc:/, '');
    const meta = await cached(`arc:${id}`, 10 * 60_000, () => jget(`${API}/metadata/${id}`, 10000));
    
    const album: Album = {
      id: idPrefixed,
      provider: 'archive',
      title: meta?.metadata?.title?.[0] || 'Unknown',
      artist: meta?.metadata?.creator?.[0] || 'Internet Archive',
      artwork: `https://archive.org/services/img/${id}`,
      year: meta?.metadata?.date?.[0]?.slice(0, 4),
    };

    const files: any[] = meta?.files ?? [];
    const audioFiles = files.filter(f => f.format && (f.format.includes('MP3') || f.format.includes('VBR MP3')));
    
    // Sort by track number if available in filename
    audioFiles.sort((a, b) => a.name.localeCompare(b.name));

    const tracks: Track[] = audioFiles.map((f, i) => ({
      id: `arct:${id}:${f.name}`,
      provider: 'archive',
      title: f.title || f.name.replace(/\.mp3$/i, ''),
      artist: album.artist,
      album: album.title,
      albumId: album.id,
      artwork: album.artwork,
      artworkSmall: album.artwork,
      duration: parseFloat(f.length || '0') || 0,
      streamUrl: `https://archive.org/download/${id}/${f.name}`,
      trackNumber: f.track ? parseInt(f.track, 10) : (i + 1),
    }));

    return { album, tracks };
  },

  async artistDetail(idPrefixed: string): Promise<ArtistDetail> {
    return { artist: { id: idPrefixed, provider: 'archive', name: 'Archive Artist' }, topTracks: [], albums: [] };
  },

  genreTop: async () => [],
  genreAlbums: async () => [],
};
