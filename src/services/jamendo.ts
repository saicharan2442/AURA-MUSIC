import type { Album, Artist, HomeFeed, SearchResults, Track } from '../types';
import type { AlbumDetail, ArtistDetail, MusicProvider } from './provider';
import { ProviderError } from './provider';
import { cached, jget } from './http';
import { useSettings } from '../store/settings';

/* ------------------------------------------------------------------ */
/*  Jamendo provider — free music under Creative Commons / Art Libre. */
/*  Full-length streaming is explicitly permitted for client apps.    */
/*  Requires a free public client_id (dev.jamendo.com) which the      */
/*  user supplies in Settings — it is designed for client-side use    */
/*  and rate-limited per key, so it's not a secret.                   */
/* ------------------------------------------------------------------ */

const API = 'https://api.jamendo.com/v3.0';

const key = (): string => useSettings.getState().jamendoKey.trim();
const u = (path: string, extra = '') => `${API}${path}?client_id=${key()}&format=json${extra ? `&${extra}` : ''}`;

function ensureKey() {
  if (!key()) throw new ProviderError('Add your free Jamendo client ID in Settings → Network & sources');
}

const arr = (json: any): any[] => (Array.isArray(json?.results) ? json.results : []);

function mapTrack(r: any): Track {
  return {
    id: `jmt:${r.id}`,
    provider: 'jamendo',
    title: r.name ?? 'Unknown title',
    artist: r.artist_name ?? 'Unknown artist',
    artistId: r.artist_id ? `jmart:${r.artist_id}` : undefined,
    album: r.album_name || undefined,
    albumId: r.album_id ? `jmalb:${r.album_id}` : undefined,
    artwork: r.album_image || r.image || '',
    artworkSmall: r.album_image || r.image || '',
    duration: r.duration ?? 0,
    streamUrl: r.audio,
    genre: undefined,
    year: r.releasedate ? String(r.releasedate).slice(0, 4) : undefined,
    url: r.shareurl,
  };
}

const mapAlbum = (r: any): Album => ({
  id: `jmalb:${r.id}`,
  provider: 'jamendo',
  title: r.name ?? 'Album',
  artist: r.artist_name ?? 'Unknown artist',
  artistId: r.artist_id ? `jmart:${r.artist_id}` : undefined,
  artwork: r.image || '',
  year: r.releasedate ? String(r.releasedate).slice(0, 4) : undefined,
  url: r.shareurl,
});

const mapArtist = (r: any): Artist => ({
  id: `jmart:${r.id}`,
  provider: 'jamendo',
  name: r.name ?? 'Artist',
  artwork: r.image || undefined,
  url: r.shareurl,
});

async function searchSongs(query: string, limit = 28, signal?: AbortSignal): Promise<Track[]> {
  ensureKey();
  const json = await jget(u('/tracks/', `search=${encodeURIComponent(query)}&limit=${limit}&audioformat=mp32&imagesize=600`), 9000, signal);
  return arr(json).filter((r: any) => r.audio).map(mapTrack);
}

async function topTracks(limit = 24, order = 'popularity_total', signal?: AbortSignal): Promise<Track[]> {
  ensureKey();
  const json = await jget(u('/tracks/', `limit=${limit}&order=${order}&audioformat=mp32&imagesize=600`), 10000, signal);
  return arr(json).filter((r: any) => r.audio).map(mapTrack);
}

const TAG_MAP: Record<string, string> = {
  '14': 'pop', '18': 'hiphop', '7': 'electronic', '21': 'rock', '15': 'rnb',
  '17': 'dance', '11': 'jazz', '6': 'country', '20': 'alternative', '24': 'reggae',
};

export const jamendoProvider: MusicProvider = {
  id: 'jamendo',
  name: 'Jamendo',
  attribution: 'Free music from independent artists via the Jamendo API — full-length streams under open licenses.',

  searchSongs,
  suggestions: (q, signal) => searchSongs(q, 6, signal),

  async searchAll(query: string, signal?: AbortSignal): Promise<SearchResults> {
    ensureKey();
    const [songs, albums, artists] = await Promise.allSettled([
      searchSongs(query, 14, signal),
      jget(u('/albums/', `search=${encodeURIComponent(query)}&limit=10&imagesize=600`), 9000, signal).then(arr).then((a) => a.map(mapAlbum)),
      jget(u('/artists/', `search=${encodeURIComponent(query)}&limit=8`), 9000, signal).then(arr).then((a) => a.map(mapArtist)),
    ]);
    const songsArr = songs.status === 'fulfilled' ? songs.value : [];
    return {
      top: songsArr[0],
      songs: songsArr,
      albums: albums.status === 'fulfilled' ? albums.value : [],
      artists: artists.status === 'fulfilled' ? artists.value : [],
    };
  },

  homeFeed() {
    return cached('jm:home', 6 * 60_000, async (): Promise<HomeFeed> => {
      ensureKey();
      const [charts, topAlb, newAlb] = await Promise.all([
        topTracks(24),
        jget(u('/albums/', 'limit=14&order=popularity_total&imagesize=600'), 10000).then(arr).then((a) => a.map(mapAlbum)),
        jget(u('/albums/', 'limit=14&order=releasedate_desc&imagesize=600'), 10000).then(arr).then((a) => a.map(mapAlbum)),
      ]);
      if (!charts.length) throw new ProviderError('Jamendo feed is empty');
      const artistsMap = new Map<string, Artist>();
      charts.forEach((t) => {
        if (t.artistId && !artistsMap.has(t.artistId)) {
          artistsMap.set(t.artistId, { id: t.artistId, provider: 'jamendo', name: t.artist, artwork: t.artworkSmall });
        }
      });
      return { charts, artists: [...artistsMap.values()].slice(0, 12), topAlbums: topAlb, newReleases: newAlb };
    });
  },

  async albumDetail(id: string): Promise<AlbumDetail> {
    ensureKey();
    const albumId = id.replace(/^jmalb:/, '');
    const json = await cached(`jm:alb:${albumId}`, 10 * 60_000, () =>
      jget(u('/tracks/', `album_id=${albumId}&limit=60&audioformat=mp32&imagesize=600`), 10000));
    const tracks = arr(json).filter((r: any) => r.audio).map(mapTrack);
    return {
      album: {
        id, provider: 'jamendo', title: tracks[0]?.album ?? 'Album', artist: tracks[0]?.artist ?? '',
        artwork: tracks[0]?.artwork ?? '', year: tracks[0]?.year,
      },
      tracks,
    };
  },

  async artistDetail(id: string): Promise<ArtistDetail> {
    ensureKey();
    const artistId = id.replace(/^jmart:/, '');
    const [tracksJson, albumsJson, artistJson] = await Promise.all([
      cached(`jm:art:${artistId}`, 10 * 60_000, () =>
        jget(u('/tracks/', `artist_id=${artistId}&limit=16&order=popularity_total&audioformat=mp32&imagesize=600`), 10000)),
      cached(`jm:artalbs:${artistId}`, 10 * 60_000, () =>
        jget(u('/albums/', `artist_id=${artistId}&limit=14&imagesize=600`), 10000)),
      cached(`jm:artinfo:${artistId}`, 10 * 60_000, () =>
        jget(u('/artists/', `id=${artistId}`), 9000).then(arr).then((a) => a[0])),
    ]);
    const topTracks = arr(tracksJson).filter((r: any) => r.audio).map(mapTrack);
    const info = artistJson;
    return {
      artist: info
        ? mapArtist(info)
        : { id, provider: 'jamendo', name: topTracks[0]?.artist ?? 'Artist', artwork: topTracks[0]?.artwork },
      topTracks,
      albums: arr(albumsJson).map(mapAlbum),
    };
  },

  genreTop(genreId: string, limit = 24) {
    const tag = TAG_MAP[genreId] ?? 'pop';
    return cached(`jm:genre:${genreId}`, 6 * 60_000, () =>
      jget(u('/tracks/', `fuzzytags=${tag}&limit=${limit}&order=popularity_total&audioformat=mp32&imagesize=600`), 10000)
        .then(arr)
        .then((a) => a.filter((r: any) => r.audio).map(mapTrack)));
  },

  genreAlbums(genreId: string, limit = 14) {
    const tag = TAG_MAP[genreId] ?? 'pop';
    return cached(`jm:genreAlb:${genreId}`, 6 * 60_000, () =>
      jget(u('/albums/', `fuzzytags=${tag}&limit=${limit}&order=popularity_total&imagesize=600`), 10000)
        .then(arr)
        .then((a) => a.map(mapAlbum)));
  },
};
