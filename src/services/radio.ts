import type { Track } from '../types';
import { ProviderError } from './provider';
import { jget } from './http';

/* ------------------------------------------------------------------ */
/*  Radio Browser — community directory of free internet radio.       */
/*  Fully anonymous, CORS-friendly, no key. Stations stream live.     */
/* ------------------------------------------------------------------ */

const BASES = [
  'https://de1.api.radio-browser.info/json',
  'https://fi1.api.radio-browser.info/json',
  'https://nl1.api.radio-browser.info/json',
];

async function rget(path: string, signal?: AbortSignal): Promise<any> {
  for (const base of BASES) {
    try {
      return await jget(`${base}${path}`, 8000, signal);
    } catch { /* try the next mirror */ }
  }
  throw new ProviderError('The radio directory is unreachable right now');
}

function mapStation(r: any): Track {
  const tags: string = r.tags ?? '';
  const firstTags = tags.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 2).join(' · ');
  return {
    id: `rad:${r.stationuuid}`,
    provider: 'radio',
    title: r.name?.trim() || 'Radio station',
    artist: [r.country, firstTags || r.codec?.toUpperCase()].filter(Boolean).join(' · ') || 'Live radio',
    artwork: r.favicon || '',
    artworkSmall: r.favicon || '',
    duration: 0,
    streamUrl: r.url_resolved || r.url,
    genre: firstTags,
    url: r.homepage || undefined,
    live: true,
  };
}

const playable = (r: any) => r && (r.url_resolved || r.url) && r.lastcheckok === 1;

export async function topStations(limit = 18, signal?: AbortSignal): Promise<Track[]> {
  const json = await rget(`/stations/topvote/${limit}?hidebroken=true`, signal);
  return (Array.isArray(json) ? json : []).filter(playable).map(mapStation);
}

export async function stationsByTag(tag: string, limit = 18, signal?: AbortSignal): Promise<Track[]> {
  const json = await rget(
    `/stations/search?tag=${encodeURIComponent(tag)}&limit=${limit}&hidebroken=true&order=votes&reverse=true`,
    signal);
  return (Array.isArray(json) ? json : []).filter(playable).map(mapStation);
}

export const RADIO_TAGS = [
  { id: '', label: 'Top stations' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'dance', label: 'Dance' },
  { id: 'classical', label: 'Classical' },
  { id: 'rock', label: 'Rock' },
  { id: 'ambient', label: 'Ambient' },
];
