# Aura Music

**A modern, lightweight music streaming client for Windows — premium UI, real online music, zero backend.**

Aura is a 2026-generation desktop music experience: live charts, instant search, local playlists, a full theming engine, and a beautiful artwork-reactive player — all powered by permitted public provider interfaces, with no database, no accounts, and no tracking.

---

## Features

- **Home** — time-aware greeting, featured trending track, "jump back in", live charts, new releases, trending artists, instant "Made for you" mixes
- **Discover** — top charts, 10 genre scenes, mood tiles, new & noteworthy albums
- **Search** — debounced instant results with categorized sections (top result, songs, artists, albums), filters, recent searches with clear
- **Player** — play/pause, prev/next, seek, volume, mute, shuffle, repeat (off/all/one), playback speed, crossfade, volume normalization, next-track preloading
- **Full Now Playing** — artwork-reactive blurred ambient background, reflection, big transport, up-next peek
- **Mini Player** — the whole app collapses into a floating ambient mini player (in the Windows build this is an always-on-top compact window)
- **Queue** — now playing + reorderable up-next (drag & drop), play next, add to queue, remove, clear, save queue as playlist
- **Playlists** — create / rename / delete / reorder (drag & drop) / play / shuffle, local collage covers
- **Favorites** — heart animation, sorting, play all, shuffle
- **Recently Played** — grouped by day, clear, play all
- **Context menus** — right-click any song: play, play next, add to queue, add to playlist, favorite, go to artist/album, copy link
- **Theming** — 10 built-in themes (Midnight, AMOLED, Ocean, Aurora, Sunset, Purple, Cyber, Forest, Minimal, Light), custom accent color, corner radius, blur, card transparency, glass toggle, dynamic album colors, animation intensity (full/reduced/off)
- **Light / Dark / System** modes with a properly designed light theme
- **Keyboard shortcuts** — Space, Ctrl+←/→, Ctrl+↑/↓ volume, Ctrl+F, Ctrl+L, Ctrl+Q, Ctrl+M, Esc
- **Media keys** — hardware play/pause/skip via the Media Session API
- **Notifications** — in-app or native (with permission), shown on track change
- **Offline & error states** — offline banner, skeleton loaders everywhere, friendly retry panels; the app never crashes on a failed request
- **Local persistence** — favorites, playlists, history, queue, settings and theme in `localStorage` (no external database)
- **Accessibility** — keyboard navigable, visible focus rings, ARIA labels, reduced-motion support

## Music providers & legal notes

Aura uses a **multi-provider architecture with automatic failover** (`src/services/providers.ts`) — if one source is unreachable, playback and discovery move to the next without breaking the app. A provider preference (Auto / iTunes / Audius / Jamendo / Custom) is available in **Settings → Network & sources**.

Shipped adapters:

- **Apple iTunes** — public, key-less interfaces: the iTunes Search API (metadata + official 30-second preview streams) and Apple Music public charts RSS.
- **Audius (Open Audio Protocol)** — free, open catalog from independent artists: **full-length streams, search, trending, playlists — no login, no API key** (anonymous `app_name` identification only).
- **Jamendo** *(optional)* — large full-length open catalog (CC / Art Libre). Paste a free public client ID from dev.jamendo.com in **Settings → Network & sources**; it is designed for client-side use and never bundled.
- **Radio Browser** *(Discover → Live Radio)* — anonymous community directory of free internet radio stations, live streams included.
- **Custom Source** *(optional)* — connect your own self-hosted server (e.g. your personal catalog or a Navidrome/Jellyfin bridge). Set the URL in Settings or via `VITE_AURA_SOURCE`. The server implements a tiny JSON contract:

  ```
  GET {base}/aura/health     → { "name": "My Server" }
  GET {base}/aura/home       → { charts, artists, topAlbums, newReleases }
  GET {base}/aura/search?q=  → { songs, albums, artists }
  GET {base}/aura/album?id=  → { album, tracks }
  GET {base}/aura/artist?id= → { artist, topTracks, albums }
  ```

  Tracks carry absolute `artwork` / `streamUrl` fields. The server must host content it has rights to — Aura will never implement extraction of third-party protected streams.

We do **not** bypass authentication, DRM, rate limits or any technical restriction; audio is streamed, never downloaded; artwork/metadata are cached only in-memory with short TTLs.

**About YouTube:** YouTube's official interfaces require an API key for search (Data API v3) and an account for streaming — there is no *permitted* keyless search/stream API. Scrapers and proxy services (e.g. Invidious/Piped) bypass YouTube's access controls and violate its terms, so Aura deliberately does not use them. Audius is the closest fully-permitted no-login alternative. Should Google offer a permitted pathway, the provider interface (`src/services/provider.ts`) is ready for a `YouTubeProvider` adapter.

## Tech stack

React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand (persist) · Framer Motion · Lucide · Vite

## Project structure

```
src/
├── components/      # sidebar, player, queue, now playing, cards, context menu…
├── pages/           # Home, Search, Discover, Library, Favorites, Playlists, Recent,
│                    # Settings, About, Detail (album/artist/genre)
├── services/        # MusicProvider interface, iTunes + Audius adapters,
│                    # failover facade (providers.ts), http helpers
├── store/           # player, library, settings, ui (zustand stores)
├── themes/          # theme presets + color math
├── hooks/           # useAsync, useDebounce, usePalette, useOnline…
└── utils/           # formatting, palettes, placeholder art, storage helpers
```

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build → dist/
```

## Windows packaging (`.exe` / installer / portable)

The frontend is Tauri-ready. To produce `AuraMusic.exe`, `AuraMusic-Setup.exe` (NSIS/MSI) or a portable build:

```bash
npm install -D @tauri-apps/cli@latest
npm run build                       # produces dist/
npx tauri init --app-name AuraMusic \
  --window-title "Aura Music" \
  --dist-dir ../dist --dev-path http://localhost:5173
npx tauri build                     # → src-tauri/target/release/AuraMusic.exe + installers
```

Recommended `tauri.conf.json` notes: bundle identifier `com.aura.music`, enable the **NSIS** or **MSI** targets for the installer, and map Aura's tray/notification features to Tauri's `tray-icon` and `notification` plugins. Media keys already work through the WebView's Media Session support; the web app bundle is a single HTML file, so the Tauri binary stays tiny.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `Ctrl + → / ←` | Next / previous |
| `Ctrl + ↑ / ↓` | Volume up / down |
| `Ctrl + F` | Focus search |
| `Ctrl + L` | Favorite current track |
| `Ctrl + Q` | Toggle queue |
| `Ctrl + M` | Mute |
| `Esc` | Close panels & dialogs |

## Privacy

All user data (favorites, playlists, history, settings) stays in local storage on the device. Only metadata & artwork are fetched from the network; audio is streamed from the provider's CDN and never written to disk.

## License

MIT. Artwork, metadata and audio previews remain the property of their respective rights holders and are used through permitted provider interfaces.

> **Aura Music** is a placeholder brand. It is an original design and is not affiliated with Apple, Spotify, or any other streaming service.
# Aura-Music
