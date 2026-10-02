import type { Album, Artist, HomeFeed, SearchResults, Track } from '../types';
import type { AlbumDetail, ArtistDetail, MusicProvider } from './provider';
import { cached, jget } from './http';

/* ------------------------------------------------------------------ */
/*  Audius provider — the Open Audio Protocol.                        */
/*                                                                    */
/*  • Free, open catalog from independent artists                     */
/*  • Full-length streaming, no account, no API key (app_name only)   */
/*  • Streams honor each artist's own accessibility settings          */
/*  Docs: https://docs.audius.org                                     */
/* ------------------------------------------------------------------ */

const API = 'https://api.audius.co/v1';
const APP = 'app_name=AuraMusic';

const u = (path: string, extra = '') => `${API}${path}?${APP}${extra ? `&${extra}` : ''}`;

/* --------------------------- mapping ------------------------------ */

const art = (a: any, size: '1000x1000' | '480x480' | '150x150'): string | undefined =>
  a?.[size] ?? a?.['480x480'] ?? a?.['1000x1000'] ?? a?.['150x150'] ?? undefined;

function mapTrack(r: any): Track {
  return {
    id: `audt:${r.id}`,
    provider: 'audius',
    title: r.title ?? 'Unknown title',
    artist: r.user?.name ?? 'Unknown artist',
    artistId: r.user?.id ? `aud:${r.user.id}` : undefined,
    album: undefined,
    artwork: art(r.artwork, '1000x1000') ?? '',
    artworkSmall: art(r.artwork, '150x150') ?? art(r.artwork, '480x480') ?? '',
    duration: r.duration ?? 0,
    streamUrl: `${API}/tracks/${r.id}/stream?${APP}`,
    genre: r.genre,
    year: r.release_date ? String(r.release_date).slice(0, 4) : undefined,
    url: r.permalink ? `https://audius.co${r.permalink}` : undefined,
  };
}

const streamable = (r: any) =>
  r && r.is_streamable !== false && r.access?.stream !== false && r.is_delete !== true;

const mapUser = (r: any): Artist => ({
  id: `aud:${r.id}`,
  provider: 'audius',
  name: r.name ?? r.handle ?? 'Unknown artist',
  artwork: art(r.profile_picture, '480x480'),
  url: r.handle ? `https://audius.co/${r.handle}` : undefined,
});

function mapPlaylist(r: any): Album {
  return {
    id: `aup:${r.id}`,
    provider: 'audius',
    title: r.playlist_name ?? 'Playlist',
    artist: r.user?.name ?? 'Audius',
    artistId: r.user?.id ? `aud:${r.user.id}` : undefined,
    artwork: art(r.artwork, '1000x1000') ?? '',
    url: r.permalink ? `https://audius.co${r.permalink}` : undefined,
  };
}

const dataArr = (json: any): any[] => (Array.isArray(json?.data) ? json.data : []);

/* --------------------------- endpoints ---------------------------- */

async function searchSongs(query: string, limit = 28, signal?: AbortSignal): Promise<Track[]> {
  const json = await jget(u('/tracks/search', `query=${encodeURIComponent(query)}&limit=${limit}`), 9000, signal);
  return dataArr(json).filter(streamable).map(mapTrack);
}

async function searchArtists(query: string, limit = 10, signal?: AbortSignal): Promise<Artist[]> {
  const json = await jget(u('/users/search', `query=${encodeURIComponent(query)}&limit=${limit}`), 9000, signal);
  return dataArr(json).filter((r: any) => (r.track_count ?? 0) > 0 || (r.playlist_count ?? 0) > 0).map(mapUser);
}

async function searchPlaylists(query: string, limit = 10, signal?: AbortSignal): Promise<Album[]> {
  const json = await jget(u('/playlists/search', `query=${encodeURIComponent(query)}&limit=${limit}`), 9000, signal);
  return dataArr(json).filter((r: any) => r.is_album !== true || r.playlist_name).map(mapPlaylist);
}

async function trending(limit = 24, time = 'week', genre?: string, signal?: AbortSignal): Promise<Track[]> {
  const g = genre ? `&genre=${encodeURIComponent(genre)}` : '';
  const json = await jget(u('/tracks/trending', `time=${time}&limit=${limit}${g}`), 10000, signal);
  return dataArr(json).filter(streamable).map(mapTrack);
}

async function trendingPlaylists(limit = 14, signal?: AbortSignal): Promise<Album[]> {
  const json = await jget(u('/playlists/trending', `limit=${limit}`), 10000, signal);
  return dataArr(json).map(mapPlaylist);
}

async function homeFeed(): Promise<HomeFeed> {
  const [tracksJson, playlists] = await Promise.all([
    jget(u('/tracks/trending', 'time=week&limit=24'), 10000),
    trendingPlaylists(14),
  ]);
  const raw = dataArr(tracksJson).filter(streamable);
  if (!raw.length) throw new Error('feed empty');
  const artistsMap = new Map<string, Artist>();
  raw.forEach((r: any) => {
    if (r.user?.id && !artistsMap.has(r.user.id)) artistsMap.set(r.user.id, mapUser(r.user));
  });
  return {
    charts: raw.map(mapTrack),
    artists: [...artistsMap.values()].slice(0, 12),
    topAlbums: playlists.slice(0, 7),
    newReleases: playlists.slice(7),
  };
}

async function albumDetail(playlistIdPrefixed: string): Promise<AlbumDetail> {
  const id = playlistIdPrefixed.replace(/^aup:/, '');
  const pl = await cached(`audpl:${id}`, 10 * 60_000, () => jget(u(`/playlists/${id}`), 10000));
  const meta = dataArr(pl)[0] ?? pl?.data;
  const items = Array.isArray(meta?.playlist_contents)
    ? meta.playlist_contents
    : (meta?.playlist_contents?.track_ids ?? []);
  const ids: string[] = items
    .map((x: any) => x?.track ?? x?.track_id)
    .filter(Boolean)
    .slice(0, 60);
  let tracks: Track[] = [];
  if (ids.length) {
    const queryStr = ids.map(id => `id=${id}`).join('&');
    const json = await cached(`audtracks:${ids.join(',')}`, 10 * 60_000, () =>
      jget(u('/tracks', queryStr), 12000));
    const byId = new Map<string, any>();
    dataArr(json).filter(streamable).forEach((r: any) => byId.set(String(r.id), r));
    tracks = ids.map((x) => byId.get(x)).filter(Boolean).map(mapTrack);
  }
  return { album: meta ? mapPlaylist(meta) : { id: playlistIdPrefixed, provider: 'audius', title: 'Playlist', artist: 'Audius', artwork: '' }, tracks };
}

async function artistDetail(artistIdPrefixed: string): Promise<ArtistDetail> {
  const id = artistIdPrefixed.replace(/^aud:/, '');
  const [userJson, tracksJson] = await Promise.all([
    cached(`auduser:${id}`, 10 * 60_000, () => jget(u(`/users/${id}`), 9000)),
    cached(`audusertracks:${id}`, 10 * 60_000, () => jget(u(`/users/${id}/tracks`, 'limit=16&sort=plays'), 10000)),
  ]);
  const user = dataArr(userJson)[0] ?? userJson?.data;
  const topTracks = dataArr(tracksJson).filter(streamable).map(mapTrack);
  return {
    artist: user ? mapUser(user) : { id: artistIdPrefixed, provider: 'audius', name: topTracks[0]?.artist ?? 'Artist' },
    topTracks: topTracks.length ? topTracks : [],
    albums: [],
  };
}

/* ----------------------------- facade ------------------------------ */

export const audiusProvider: MusicProvider = {
  id: 'audius',
  name: 'Audius',
  attribution:
    'Open catalog & full-length streams by independent artists via the Audius Open Audio Protocol (api.audius.co).',

  searchSongs,
  suggestions: (q, signal) => searchSongs(q, 6, signal),

  async searchAll(query: string, signal?: AbortSignal): Promise<SearchResults> {
    const [songs, albums, artists] = await Promise.allSettled([
      searchSongs(query, 14, signal),
      searchPlaylists(query, 10, signal),
      searchArtists(query, 8, signal),
    ]);
    const songsArr = songs.status === 'fulfilled' ? songs.value : [];
    if (songs.status !== 'fulfilled' && albums.status !== 'fulfilled' && artists.status !== 'fulfilled') {
      if (signal?.aborted) throw new Error('cancelled');
      throw new Error('unavailable');
    }
    return {
      top: songsArr[0],
      songs: songsArr,
      albums: albums.status === 'fulfilled' ? albums.value : [],
      artists: artists.status === 'fulfilled' ? artists.value : [],
    };
  },

  homeFeed: () => cached('aud:home', 5 * 60_000, homeFeed),
  albumDetail,
  artistDetail,

  genreTop: (genreId, limit = 24) => {
    const genre = ITUNES_GENRE_TO_AUDIUS[genreId];
    return cached(`aud:genre:${genreId}`, 5 * 60_000, () => trending(limit, 'week', genre));
  },
  genreAlbums: (_genreId, limit = 14) => cached('aud:genreAlb', 5 * 60_000, () => trendingPlaylists(limit)),
};

const ITUNES_GENRE_TO_AUDIUS: Record<string, string> = {
  '14': 'Pop',
  '18': 'Hip-Hop/Rap',
  '7': 'Electronic',
  '21': 'Rock',
  '15': 'R&B/Soul',
  '17': 'Electronic',
  '11': 'R&B/Soul',
  '6': 'Country',
  '20': 'Alternative',
  '24': 'Reggae',
};
