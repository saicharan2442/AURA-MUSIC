import { Heart, MoreHorizontal } from 'lucide-react';
import type { MouseEvent as RMouseEvent } from 'react';
import type { Track } from '../types';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { cx, fmtTime, timeAgo } from '../utils';
import { Artwork } from './Artwork';
import { useTrackMenu } from './ContextMenu';

/* Dense track row used across lists. Click plays; right-click opens menu. */

interface Props {
  track: Track;
  index?: number;
  context?: Track[];
  showAlbum?: boolean;
  showArt?: boolean;
  playedAt?: number;
  menuContext?: 'recent' | 'playlist' | 'queue';
  playlistId?: string;
  qid?: string;
  trailingExtra?: React.ReactNode;
  dense?: boolean;
}

export function SongRow({ track, index, context, showAlbum = false, showArt = true, playedAt, menuContext, playlistId, qid, trailingExtra, dense }: Props) {
  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const fav = useLibrary((s) => s.favorites.some((f) => f.id === track.id));
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const menu = useTrackMenu();

  const active = !!current && (qid ? current.qid === qid : current.id === track.id);

  const play = () => {
    const p = usePlayer.getState();
    if (qid && p.queue.some((q) => q.qid === qid)) { p.playQueueItem(qid); return; }
    const list = context ?? [track];
    const i = Math.max(0, list.findIndex((t) => t.id === track.id));
    p.playContext(list, i);
  };

  const openAtClick = (e: RMouseEvent) => {
    const x = e.clientX ?? window.innerWidth / 2;
    const y = e.clientY ?? 200;
    menu({ ...e, clientX: x, clientY: y } as any, track, { context: menuContext, playlistId, qid });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${track.title} by ${track.artist}`}
      onClick={play}
      onKeyDown={(e) => { if (e.key === 'Enter') play(); }}
      onContextMenu={(e) => menu(e, track, { context: menuContext, playlistId, qid })}
      className={cx(
        'group relative flex items-center gap-3.5 rounded-xl px-3 cursor-pointer select-none transition-colors',
        dense ? 'py-1.5' : 'py-2',
        active ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : 'hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)]'
      )}
    >
      {typeof index === 'number' && (
        <span className="w-[22px] shrink-0 text-center tabular-nums text-[12.5px] text-dim font-medium">
          {active && isPlaying ? (
            <span className="eq scale-[.8] origin-bottom"><i /><i /><i /><i /></span>
          ) : (
            <span className={cx(active && 'text-acc')}>{index + 1}</span>
          )}
        </span>
      )}

      {showArt && (
        <span className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-line">
          <Artwork src={track.artworkSmall || track.artwork} seed={track.title + track.artist} alt="" className="w-full h-full" />
          <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="15" height="15" className="fill-white"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className={cx('block text-[13.5px] font-semibold truncate leading-snug', active ? 'text-acc' : 'text-main')}>
          {track.title}
        </span>
        <span className="block text-[12px] text-dim truncate mt-0.5">{track.artist}</span>
      </span>

      {showAlbum && (
        <span className="hidden lg:block w-[200px] shrink-0 text-[12.5px] text-dim truncate">{track.album}</span>
      )}
      {playedAt != null && (
        <span className="hidden md:block w-[86px] shrink-0 text-[12px] text-dim truncate text-right">{timeAgo(playedAt)}</span>
      )}

      {trailingExtra}

      <button
        aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
        className={cx(
          'icon-btn !w-8 !h-8 shrink-0 transition-opacity',
          fav ? 'text-acc' : 'opacity-0 group-hover:opacity-100 text-dim hover:text-main'
        )}
      >
        <Heart size={15} className={cx(fav && 'fill-current pop')} />
      </button>

      <span className="w-10 shrink-0 text-right text-[12.5px] tabular-nums text-dim">{fmtTime(track.duration)}</span>

      <button
        aria-label="More options"
        onClick={(e) => { e.stopPropagation(); openAtClick(e); }}
        className="icon-btn !w-8 !h-8 shrink-0 opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}
