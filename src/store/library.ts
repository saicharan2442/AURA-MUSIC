import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalPlaylist, RecentEntry, Track } from '../types';
import { uid } from '../utils';

/* ------------------------------------------------------------------ */
/*  Local library: favorites, playlists, history, search history.     */
/*  Everything lives in localStorage — zero external database.        */
/* ------------------------------------------------------------------ */

const MAX_RECENT = 80;
const MAX_SEARCH = 12;

interface LibraryState {
  favorites: Track[];
  playlists: LocalPlaylist[];
  recent: RecentEntry[];
  searchHistory: string[];

  isFavorite: (id: string) => boolean;
  toggleFavorite: (t: Track) => boolean; // returns new state

  createPlaylist: (name: string, tracks?: Track[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, t: Track) => boolean;
  removeFromPlaylist: (id: string, trackId: string) => void;
  reorderPlaylist: (id: string, tracks: Track[]) => void;

  addRecent: (t: Track) => void;
  removeRecent: (id: string) => void;
  clearRecent: () => void;

  addSearch: (q: string) => void;
  clearSearch: () => void;

  clearAll: () => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      playlists: [],
      recent: [],
      searchHistory: [],

      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      toggleFavorite: (t) => {
        const fav = get().favorites.some((f) => f.id === t.id);
        set((s) => ({
          favorites: fav ? s.favorites.filter((f) => f.id !== t.id) : [t, ...s.favorites],
        }));
        return !fav;
      },

      createPlaylist: (name, tracks = []) => {
        const id = uid('pl');
        set((s) => ({
          playlists: [
            { id, name: name.trim() || 'Untitled playlist', tracks, createdAt: Date.now(), updatedAt: Date.now() },
            ...s.playlists,
          ],
        }));
        return id;
      },

      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p)),
        })),

      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      addToPlaylist: (id, t) => {
        let added = false;
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== id) return p;
            if (p.tracks.some((x) => x.id === t.id)) return p;
            added = true;
            return { ...p, tracks: [...p.tracks, t], updatedAt: Date.now() };
          }),
        }));
        return added;
      },

      removeFromPlaylist: (id, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId), updatedAt: Date.now() } : p),
        })),

      reorderPlaylist: (id, tracks) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, tracks, updatedAt: Date.now() } : p)),
        })),

      addRecent: (t) =>
        set((s) => ({
          recent: [{ track: t, at: Date.now() }, ...s.recent.filter((r) => r.track.id !== t.id)].slice(0, MAX_RECENT),
        })),

      removeRecent: (id) => set((s) => ({ recent: s.recent.filter((r) => r.track.id !== id) })),
      clearRecent: () => set({ recent: [] }),

      addSearch: (q) => {
        const v = q.trim();
        if (!v) return;
        set((s) => ({ searchHistory: [v, ...s.searchHistory.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, MAX_SEARCH) }));
      },
      clearSearch: () => set({ searchHistory: [] }),

      clearAll: () => set({ favorites: [], playlists: [], recent: [], searchHistory: [] }),
    }),
    { name: 'aura-library-v1' }
  )
);
