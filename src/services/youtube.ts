import type { Album, SearchResults, Track } from '../types';
import type { AlbumDetail, ArtistDetail, MusicProvider } from './provider';
import { useSettings } from '../store/settings';
import { cached, jget } from './http';

/* ------------------------------------------------------------------ */
/*  YouTube Data API v3 provider                                      */
/*                                                                    */
/*  • Requires an API Key from Google Cloud Console                   */
/*  • Search returns video metadata                                   */
/*  • Streams are bridged through public instances                    */
/* ------------------------------------------------------------------ */

const API = 'https://www.googleapis.com/youtube/v3';

// Helper to get the key and throw if missing
function getKey() {
  const key = (useSettings.getState().youtubeKey || '').trim();
  if (!key) throw new Error('YouTube API key is missing. Please add it in Settings.');
  return key;
}

const u = (path: string, params: string) => `${API}${path}?key=${getKey()}&${params}`;

/* --------------------------- mapping ------------------------------ */

function parseIsoDuration(duration?: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const h = parseInt(match[1]) || 0;
  const m = parseInt(match[2]) || 0;
  const s = parseInt(match[3]) || 0;
  return h * 3600 + m * 60 + s;
}

function mapVideoToTrack(item: any): Track {
  const id = item.id?.videoId || item.id;
  return {
    id: `ytv:${id}`,
    provider: 'youtube',
    title: item.snippet?.title || 'Unknown Title',
    artist: item.snippet?.channelTitle || 'YouTube',
    artistId: item.snippet?.channelId ? `ytc:${item.snippet.channelId}` : undefined,
    artwork: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
    artworkSmall: item.snippet?.thumbnails?.default?.url || '',
    duration: parseIsoDuration(item.contentDetails?.duration),
    streamUrl: `yt:${id}`, // Handled natively by YouTubePlayer
    url: `https://www.youtube.com/watch?v=${id}`,
  };
}

function mapPlaylistToAlbum(item: any): Album {
  const id = item.id?.playlistId || item.id;
  return {
    id: `ytp:${id}`,
    provider: 'youtube',
    title: item.snippet?.title || 'Unknown Playlist',
    artist: item.snippet?.channelTitle || 'YouTube',
    artistId: item.snippet?.channelId ? `ytc:${item.snippet.channelId}` : undefined,
    artwork: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
    url: `https://www.youtube.com/playlist?list=${id}`,
  };
}

/* --------------------------- endpoints ---------------------------- */

async function searchSongs(query: string, limit = 14, signal?: AbortSignal): Promise<Track[]> {
  const json = await jget(u('/search', `part=snippet&type=video&videoCategoryId=10&maxResults=${limit}&q=${encodeURIComponent(query)}`), 9000, signal);
  if (!json?.items?.length) return [];
  
  // Fetch durations in bulk
  const ids = json.items.map((i: any) => i.id.videoId).join(',');
  const details = await jget(u('/videos', `part=snippet,contentDetails&id=${ids}`), 9000, signal);
  return (details?.items || []).map(mapVideoToTrack);
}

async function searchPlaylists(query: string, limit = 10, signal?: AbortSignal): Promise<Album[]> {
  const json = await jget(u('/search', `part=snippet&type=playlist&maxResults=${limit}&q=${encodeURIComponent(query)}`), 9000, signal);
  return (json?.items || []).map(mapPlaylistToAlbum);
}

/* ----------------------------- facade ------------------------------ */

export const youtubeProvider: MusicProvider = {
  id: 'youtube',
  name: 'YouTube',
  attribution: 'Search results and metadata provided by the YouTube Data API v3.',

  searchSongs,
  suggestions: (q, signal) => searchSongs(q, 6, signal),

  async searchAll(query: string, signal?: AbortSignal): Promise<SearchResults> {
    const [songs, albums] = await Promise.allSettled([
      searchSongs(query, 14, signal),
      searchPlaylists(query, 10, signal),
    ]);
    const songsArr = songs.status === 'fulfilled' ? songs.value : [];
    if (songs.status !== 'fulfilled' && albums.status !== 'fulfilled') {
      if (signal?.aborted) throw new Error('cancelled');
      throw new Error('unavailable');
    }
    return {
      top: songsArr[0],
      songs: songsArr,
      albums: albums.status === 'fulfilled' ? albums.value : [],
      artists: [],
    };
  },

  homeFeed: async () => {
    // YouTube Data API has a videos chart endpoint
    const json = await cached('yt:chart', 15 * 60_000, () => jget(u('/videos', 'part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=24'), 9000));
    const tracks = (json?.items || []).map(mapVideoToTrack);
    return {
      charts: tracks,
      artists: [],
      topAlbums: [],
      newReleases: [],
    };
  },

  async albumDetail(idPrefixed: string): Promise<AlbumDetail> {
    const id = idPrefixed.replace(/^ytp:/, '');
    const metaJson = await cached(`ytp:${id}`, 10 * 60_000, () => jget(u('/playlists', `part=snippet&id=${id}`), 9000));
    const meta = metaJson?.items?.[0];

    const itemsJson = await cached(`ytpi:${id}`, 10 * 60_000, () => jget(u('/playlistItems', `part=snippet&maxResults=50&playlistId=${id}`), 9000));
    
    const album = meta ? mapPlaylistToAlbum(meta) : { id: idPrefixed, provider: 'youtube', title: 'Playlist', artist: 'YouTube', artwork: '' };
    
    // Fetch durations for playlist items in bulk
    const itemIds = (itemsJson?.items || []).map((i: any) => i.snippet?.resourceId?.videoId).filter(Boolean).join(',');
    const details = itemIds ? await cached(`ytpidet:${id}`, 10 * 60_000, () => jget(u('/videos', `part=snippet,contentDetails&id=${itemIds}`), 9000)) : { items: [] };

    const tracks: Track[] = (details?.items || []).map((item: any) => {
      const track = mapVideoToTrack(item);
      track.album = album.title;
      track.albumId = album.id;
      return track;
    });

    return { album, tracks };
  },

  async artistDetail(idPrefixed: string): Promise<ArtistDetail> {
    return { artist: { id: idPrefixed, provider: 'youtube', name: 'YouTube Channel' }, topTracks: [], albums: [] };
  },

  genreTop: async () => [],
  genreAlbums: async () => [],
};
