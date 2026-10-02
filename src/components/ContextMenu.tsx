import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CornerDownRight, Copy, Disc3, Heart, ListMusic, ListPlus, Play, Trash2, User, X, type LucideIcon,
} from 'lucide-react';
import type { MouseEvent as RMouseEvent } from 'react';
import type { Track } from '../types';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI, type MenuState } from '../store/ui';
import { clamp } from '../utils';

/* ---------------- hook for triggering menus ---------------- */

export function useTrackMenu() {
  const openMenu = useUI((s) => s.openMenu);
  return useCallback((e: RMouseEvent | MouseEvent, track: Track, opts?: Partial<MenuState>) => {
    e.preventDefault();
    e.stopPropagation();
    const x = clamp(e.clientX, 8, window.innerWidth - 252);
    const y = clamp(e.clientY, 8, window.innerHeight - 340);
    openMenu({ x, y, track, ...opts });
  }, [openMenu]);
}

/* ---------------- menu ---------------- */

function Item({ icon: Icon, label, danger, onClick }: { icon: LucideIcon; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 h-[38px] rounded-xl text-[13px] font-medium transition-colors text-left
        ${danger ? 'text-[#ff8580] hover:bg-[#ff5f5722]' : 'text-soft hover:text-main hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]'}`}
    >
      <Icon size={15.5} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

const Divider = () => <div className="my-1.5 h-px bg-[var(--border)] mx-2" />;

export function ContextMenu() {
  const menu = useUI((s) => s.menu);
  const closeMenu = useUI((s) => s.closeMenu);

  useEffect(() => {
    if (!menu) return;
    const close = () => closeMenu();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', key);
    };
  }, [menu, closeMenu]);

  const run = (fn: () => void) => () => { fn(); closeMenu(); };

  const content = (m: MenuState) => {
    const { track } = m;
    const player = usePlayer.getState();
    const lib = useLibrary.getState();
    const ui = useUI.getState();
    const fav = lib.isFavorite(track.id);

    const items: React.ReactNode[] = [
      <Item key="play" icon={Play} label="Play" onClick={run(() => player.playTrack(track))} />,
      <Item key="pn" icon={CornerDownRight} label="Play next" onClick={run(() => { player.playNext(track); ui.toast({ title: 'Will play next', sub: track.title, art: track.artworkSmall || track.artwork }); })} />,
      <Item key="aq" icon={ListPlus} label="Add to queue" onClick={run(() => { player.enqueue(track); ui.toast({ title: 'Added to queue', sub: track.title, art: track.artworkSmall || track.artwork }); })} />,
      <Divider key="d1" />,
      <Item key="ap" icon={ListMusic} label="Add to playlist" onClick={run(() => ui.openModal({ type: 'addToPlaylist', payload: { track } }))} />,
      <Item key="fav" icon={Heart} label={fav ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={run(() => { const on = lib.toggleFavorite(track); ui.toast({ title: on ? 'Added to Favorites' : 'Removed from Favorites', sub: track.title, art: track.artworkSmall || track.artwork, kind: on ? 'success' : 'info' }); })} />,
      <Divider key="d2" />,
    ];

    if (track.artistId) items.push(
      <Item key="ga" icon={User} label="Go to artist" onClick={run(() => ui.go({ id: 'artist', params: { id: track.artistId, name: track.artist } }))} />);
    if (track.albumId && track.album) items.push(
      <Item key="gal" icon={Disc3} label="Go to album" onClick={run(() => ui.go({ id: 'album', params: { id: track.albumId, title: track.album, artist: track.artist, artwork: track.artwork } }))} />);
    if (track.url) items.push(
      <Item key="cl" icon={Copy} label="Copy link" onClick={run(() => { navigator.clipboard?.writeText(track.url!).catch(() => {}); ui.toast({ title: 'Link copied', sub: track.title, kind: 'success' }); })} />);

    if (m.context === 'recent') items.push(<Divider key="d3" />,
      <Item key="rh" icon={Trash2} danger label="Remove from history" onClick={run(() => lib.removeRecent(track.id))} />);
    if (m.context === 'queue' && m.qid) items.push(<Divider key="d4" />,
      <Item key="rq" icon={X} danger label="Remove from queue" onClick={run(() => player.removeFromQueue(m.qid!))} />);
    if (m.context === 'playlist' && m.playlistId) items.push(<Divider key="d5" />,
      <Item key="rp" icon={Trash2} danger label="Remove from playlist" onClick={run(() => lib.removeFromPlaylist(m.playlistId!, track.id))} />);

    return items;
  };

  return (
    <AnimatePresence>
      {menu && (
        <div className="fixed inset-0 z-[85]">
          <div className="absolute inset-0" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.09 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 32 }}
            style={{ left: menu.x, top: menu.y, transformOrigin: 'top left' }}
            className="absolute w-60 glass-strong border border-line rounded-2xl p-1.5 shadow-2xl"
            role="menu"
          >
            <div className="px-3.5 pt-2 pb-1.5">
              <p className="text-[12px] font-semibold text-main truncate">{menu.track.title}</p>
              <p className="text-[11px] text-dim truncate">{menu.track.artist}</p>
            </div>
            <Divider />
            {content(menu)}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
