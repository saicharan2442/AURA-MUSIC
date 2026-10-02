import type { Album, Artist, HomeFeed, SearchResults, Track } from '../types';
import type { AlbumDetail, ArtistDetail, MusicProvider } from './provider';
import { ProviderError } from './provider';
import { cached, jget } from './http';
import { useSettings } from '../store/settings';

/* ------------------------------------------------------------------ */
/*  Custom Source — connect Aura to YOUR OWN self-hosted server.      */
/*                                                                    */
/*  Intended for servers that host content they have rights to        */
/*  (personal libraries, Navidrome/Jellyfin bridges, your own         */
/*  catalog). Aura will NEVER implement extraction of third-party     */
/*  protected streams (e.g. YouTube); backends must respect the       */
/*  restrictions of the sources they proxy.                           */
/*                                                                    */
/*  HTTP contract (JSON, cross-origin enabled):                       */
/*    GET {base}/aura/health   → { "name": "My Server" }              */
/*    GET {base}/aura/home     → HomeFeed JSON (Aura shapes)          */
/*    GET {base}/aura/search?q → SearchResults JSON                   */
/*    GET {base}/aura/album?id → { album, tracks }                    */
/*    GET {base}/aura/artist?id → { artist, topTracks, albums }       */
/*  Track/Album/Artist objects use Aura's snake-less models with      */
/*  absolute artwork + streamUrl fields.                              */
/* ------------------------------------------------------------------ */

const ENV_URL: string = (import.meta as any).env?.VITE_AURA_SOURCE ?? '';

export function customSourceUrl(): string {
  const s = useSettings.getState().customSourceUrl.trim();
  return (s || ENV_URL).replace(/\/+$/, '');
}

const base = () => {
  const b = customSourceUrl();
  if (!b) throw new ProviderError('Configure your server URL in Settings → Network & sources');
  return b;
};

const p = <T extends { provider?: string }>(x: T): T => ({ ...x, provider: x.provider || 'custom' });

async function searchSongs(query: string, limit = 28, signal?: AbortSignal): Promise<Track[]> {
  const json = await jget(`${base()}/aura/search?q=${encodeURIComponent(query)}&type=song&limit=${limit}`, 9000, signal);
  const items: Track[] = json?.songs ?? json?.results ?? [];
  return items.map(p);
}

export const customProvider: MusicProvider = {
  id: 'custom',
  name: 'Custom server',
  attribution: 'A user-configured self-hosted content server (Aura Custom Source protocol).',

  searchSongs,
  suggestions: (q, signal) => searchSongs(q, 6, signal),

  async searchAll(query: string, signal?: AbortSignal): Promise<SearchResults> {
    const json = await jget(`${base()}/aura/search?q=${encodeURIComponent(query)}&limit=24`, 9000, signal);
    const songs: Track[] = (json?.songs ?? []).map(p);
    const albums: Album[] = (json?.albums ?? []).map(p);
    const artists: Artist[] = (json?.artists ?? []).map(p);
    return { top: songs[0], songs, albums, artists };
  },

  homeFeed() {
    return cached('cs:home', 5 * 60_000, async (): Promise<HomeFeed> => {
      const json = await jget(`${base()}/aura/home`, 10000);
      const charts: Track[] = (json?.charts ?? []).map(p);
      if (!charts.length) throw new ProviderError('Custom server returned no content');
      return {
        charts,
        artists: (json?.artists ?? []).map(p),
        topAlbums: (json?.topAlbums ?? []).map(p),
        newReleases: (json?.newReleases ?? []).map(p),
      };
    });
  },

  async albumDetail(id: string): Promise<AlbumDetail> {
    const json = await cached(`cs:alb:${id}`, 10 * 60_000, () =>
      jget(`${base()}/aura/album?id=${encodeURIComponent(id)}`, 10000));
    return {
      album: p(json?.album ?? { id, title: 'Album', artist: '', artwork: '' }),
      tracks: (json?.tracks ?? []).map(p),
    };
  },

  async artistDetail(id: string): Promise<ArtistDetail> {
    const json = await cached(`cs:art:${id}`, 10 * 60_000, () =>
      jget(`${base()}/aura/artist?id=${encodeURIComponent(id)}`, 10000));
    return {
      artist: p(json?.artist ?? { id, name: 'Artist' }),
      topTracks: (json?.topTracks ?? []).map(p),
      albums: (json?.albums ?? []).map(p),
    };
  },

  genreTop: async (_genreId, limit = 24) => {
    const feed = await customProvider.homeFeed();
    return feed.charts.slice(0, limit);
  },
  genreAlbums: async (_genreId, limit = 14) => {
    const feed = await customProvider.homeFeed();
    return feed.topAlbums.slice(0, limit);
  },
};
