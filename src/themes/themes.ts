/* ------------------------------------------------------------------ */
/*  Theme system — presets are plain data; new themes can be added    */
/*  by appending one object. The App effect applies vars to :root.    */
/* ------------------------------------------------------------------ */

export interface ThemeVars {
  bg: string; bgSoft: string; card: string; elev: string;
  text: string; soft: string; dim: string; border: string;
  accent: string; accent2: string; onAccent: string; shadow: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  scheme: 'dark' | 'light';
  swatch: [string, string];      // preview chips in the UI
  vars: ThemeVars;
}

export const THEMES: ThemePreset[] = [
  {
    id: 'midnight', name: 'Midnight', scheme: 'dark', swatch: ['#7c6cff', '#0b0e18'],
    vars: {
      bg: '#070a12', bgSoft: '#0a0e18', card: '#121627', elev: '#1a1f33',
      text: '#f2f4fb', soft: '#9aa3c7', dim: '#5b6284', border: 'rgba(255,255,255,0.07)',
      accent: '#7c6cff', accent2: '#3fd4ff', onAccent: '#ffffff',
      shadow: '0 24px 70px -28px rgba(0,0,0,0.75)',
    },
  },
  {
    id: 'amoled', name: 'AMOLED', scheme: 'dark', swatch: ['#22e37b', '#000000'],
    vars: {
      bg: '#000000', bgSoft: '#060607', card: '#0f0f12', elev: '#17171b',
      text: '#f5f5f7', soft: '#a1a1ab', dim: '#5f5f6a', border: 'rgba(255,255,255,0.08)',
      accent: '#22e37b', accent2: '#0ac8a8', onAccent: '#04130b',
      shadow: '0 24px 70px -28px rgba(0,0,0,0.9)',
    },
  },
  {
    id: 'ocean', name: 'Ocean', scheme: 'dark', swatch: ['#29b6f6', '#041019'],
    vars: {
      bg: '#041019', bgSoft: '#071825', card: '#0c1f2e', elev: '#123043',
      text: '#eef7fc', soft: '#93bcce', dim: '#59798a', border: 'rgba(140,205,255,0.09)',
      accent: '#29b6f6', accent2: '#2ae0c8', onAccent: '#03212e',
      shadow: '0 24px 70px -28px rgba(0,10,20,0.8)',
    },
  },
  {
    id: 'aurora', name: 'Aurora', scheme: 'dark', swatch: ['#43e8b4', '#7c6cff'],
    vars: {
      bg: '#070912', bgSoft: '#0a0d19', card: '#121629', elev: '#1a2037',
      text: '#effaf5', soft: '#96a8c9', dim: '#5a6a8a', border: 'rgba(255,255,255,0.07)',
      accent: '#43e8b4', accent2: '#7c6cff', onAccent: '#04120d',
      shadow: '0 24px 70px -28px rgba(0,0,0,0.75)',
    },
  },
  {
    id: 'sunset', name: 'Sunset', scheme: 'dark', swatch: ['#ff7a59', '#120a10'],
    vars: {
      bg: '#120a10', bgSoft: '#190f16', card: '#211420', elev: '#2d1b2a',
      text: '#fdf3ee', soft: '#d3a79f', dim: '#8a6560', border: 'rgba(255,170,140,0.10)',
      accent: '#ff7a59', accent2: '#ffb14d', onAccent: '#2b0e06',
      shadow: '0 24px 70px -28px rgba(20,5,10,0.85)',
    },
  },
  {
    id: 'purple', name: 'Purple', scheme: 'dark', swatch: ['#b26bff', '#0d0716'],
    vars: {
      bg: '#0d0716', bgSoft: '#130a1f', card: '#1a1029', elev: '#241738',
      text: '#f5efff', soft: '#b8a3e0', dim: '#75639c', border: 'rgba(200,160,255,0.10)',
      accent: '#b26bff', accent2: '#ff6bd6', onAccent: '#ffffff',
      shadow: '0 24px 70px -28px rgba(10,0,25,0.85)',
    },
  },
  {
    id: 'cyber', name: 'Cyber', scheme: 'dark', swatch: ['#00e5ff', '#ff3df2'],
    vars: {
      bg: '#05070f', bgSoft: '#080c17', card: '#0d1322', elev: '#131c33',
      text: '#eaf9ff', soft: '#8db6cf', dim: '#54718a', border: 'rgba(0,229,255,0.10)',
      accent: '#00e5ff', accent2: '#ff3df2', onAccent: '#02141a',
      shadow: '0 24px 70px -28px rgba(0,5,15,0.85)',
    },
  },
  {
    id: 'forest', name: 'Forest', scheme: 'dark', swatch: ['#4ade80', '#060d09'],
    vars: {
      bg: '#060d09', bgSoft: '#091410', card: '#0f1d16', elev: '#16291f',
      text: '#eefaf1', soft: '#a4c7b1', dim: '#63866f', border: 'rgba(160,255,190,0.09)',
      accent: '#4ade80', accent2: '#a3e635', onAccent: '#06170c',
      shadow: '0 24px 70px -28px rgba(0,8,4,0.85)',
    },
  },
  {
    id: 'minimal', name: 'Minimal', scheme: 'dark', swatch: ['#e8e3d9', '#101012'],
    vars: {
      bg: '#0e0e10', bgSoft: '#131316', card: '#1a1a1e', elev: '#232328',
      text: '#f2f2f4', soft: '#a3a3ad', dim: '#67676f', border: 'rgba(255,255,255,0.08)',
      accent: '#e8e3d9', accent2: '#9fb4c8', onAccent: '#151517',
      shadow: '0 24px 70px -28px rgba(0,0,0,0.85)',
    },
  },
  {
    id: 'light', name: 'Light', scheme: 'light', swatch: ['#6a5cff', '#f4f5fa'],
    vars: {
      bg: '#eef0f7', bgSoft: '#e6e9f3', card: '#ffffff', elev: '#ffffff',
      text: '#171a26', soft: '#585f76', dim: '#9aa0b6', border: 'rgba(23,26,45,0.09)',
      accent: '#6a5cff', accent2: '#0fa8d6', onAccent: '#ffffff',
      shadow: '0 24px 55px -26px rgba(35,40,80,0.28)',
    },
  },
];

export const DEFAULT_THEME = 'midnight';

export function getTheme(id: string): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

/* ---- tiny color helpers used for custom accent + hue shifting ---- */

export function hexToHsl(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const col = ln - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function shiftHue(hex: string, deg: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((h + deg + 360) % 360, s, l);
}

export function withAlpha(hex: string, alpha: number): string {
  const [h, s, l] = hexToHsl(hex);
  return `hsla(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}% / ${alpha})`;
}
