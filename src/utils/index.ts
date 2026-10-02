import { hslToHex, hexToHsl } from '../themes/themes';
import type { Track } from '../types';

/* ---------------- misc ---------------- */

export const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ');

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- formatting ---------------- */

export function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${n}`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function totalDuration(tracks: Track[]): string {
  const s = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ---------------- placeholder art (generative, offline-safe) ------ */

export function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function artFor(seed: string): string {
  const h = hashSeed(seed || 'aura');
  const h1 = h % 360;
  const h2 = (h1 + 46) % 360;
  const c1 = hslToHex(h1, 62, 42);
  const c2 = hslToHex(h2, 72, 26);
  const bars = [0, 1, 2, 3, 4]
    .map((i) => {
      const bh = 34 + ((h >> (i * 3)) % 52);
      const x = 26 + i * 20;
      return `<rect x="${x}" y="${108 - bh / 2}" width="11" height="${bh}" rx="5.5" fill="rgba(255,255,255,0.85)"/>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><circle cx="130" cy="26" r="52" fill="rgba(255,255,255,0.08)"/><circle cx="14" cy="140" r="46" fill="rgba(0,0,0,0.14)"/>${bars}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ---------------- dynamic palette from artwork --------------------- */

export interface Palette { a: string; b: string; }

const paletteCache = new Map<string, Promise<Palette>>();

function paletteFromSeed(seed: string): Palette {
  const h = hashSeed(seed || 'aura') % 360;
  return { a: hslToHex(h, 72, 56), b: hslToHex((h + 44) % 360, 78, 52) };
}

async function extractPalette(url: string): Promise<Palette> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  const proxy = `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=48&h=48&fit=cover&output=png`;
  await new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('palette timeout')), 4200);
    img.onload = () => { window.clearTimeout(t); resolve(); };
    img.onerror = () => { window.clearTimeout(t); reject(new Error('palette load failed')); };
    img.src = proxy;
  });
  const cv = document.createElement('canvas');
  cv.width = cv.height = 48;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no ctx');
  ctx.drawImage(img, 0, 0, 48, 48);
  const data = ctx.getImageData(0, 0, 48, 48).data;
  let hAcc = 0, sAcc = 0, lAcc = 0, wAcc = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (l < 0.12 || l > 0.88) continue;
    let s = 0;
    if (max !== min) s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    const w = 0.35 + s;
    let h = 0;
    const d = max - min;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    hAcc += h * w; sAcc += s * w; lAcc += l * w; wAcc += w;
  }
  if (wAcc === 0) throw new Error('flat');
  const h = hAcc / wAcc, s = Math.max(0.42, sAcc / wAcc), l = lAcc / wAcc;
  return { a: hslToHex(h, s * 100, Math.min(62, Math.max(44, l * 100))), b: hslToHex((h + 42) % 360, s * 100, 50) };
}

/** Dominant two-color palette for artwork. Falls back to a seeded palette. */
export function getPalette(artwork: string | undefined, seed: string): Promise<Palette> {
  const key = artwork || `seed:${seed}`;
  const hit = paletteCache.get(key);
  if (hit) return hit;
  const p = artwork
    ? extractPalette(artwork).catch(() => paletteFromSeed(seed))
    : Promise.resolve(paletteFromSeed(seed));
  paletteCache.set(key, p);
  return p;
}

/** Relative luminance helper for readable text decisions. */
export function isDark(hex: string): boolean {
  const [, , l] = hexToHsl(hex);
  return l < 55;
}

export function storageSize(keys: string[]): string {
  let total = 0;
  keys.forEach((k) => { const v = localStorage.getItem(k); if (v) total += v.length * 2; });
  if (total > 1024 * 1024) return `${(total / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(total / 1024)} KB`;
}
