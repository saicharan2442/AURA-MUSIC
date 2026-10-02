import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown, Heart, ListMusic, ListPlus, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Video
} from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { usePalette } from '../hooks';
import { clamp, cx, fmtTime } from '../utils';
import { Artwork } from './Artwork';
import { ProgressBar } from './PlayerBar';

/* Full-screen Now Playing with artwork-reactive ambient background. */

export function NowPlaying() {
  const open = useUI((s) => s.npOpen);
  return <AnimatePresence>{open && <NowPlayingInner key="np" />}</AnimatePresence>;
}

function NowPlayingInner() {
  const setOpen = useUI((s) => s.setNpOpen);
  const setQueueOpen = useUI((s) => s.setQueueOpen);
  const go = useUI((s) => s.go);
  const openModal = useUI((s) => s.openModal);
  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const fav = useLibrary((s) => (current ? s.favorites.some((f) => f.id === current.id) : false));
  const next = usePlayer((s) => s.peekNext());

  const palette = usePalette(current?.artwork, current?.title ?? 'aura');
  const player = usePlayer.getState();

  useEffect(() => {
    if (!current) setOpen(false);
  }, [current, setOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setOpen]);

  if (!current) return null;

  const dur = duration || current.duration || 0;
  const a = palette?.a ?? 'var(--accent)';
  const b = palette?.b ?? 'var(--accent2)';
  const artSize = clamp(Math.round(window.innerHeight * 0.34), 200, 380);

  return (
    <motion.div
      className="fixed inset-0 z-[80] overflow-hidden grain"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 190, damping: 26 }}
      role="dialog"
      aria-label="Now playing"
    >
      {/* ambient background */}
      <div className="absolute inset-0 bg-base" />
      <div className="absolute inset-[-10%] blur-[100px] opacity-70 transition-all duration-1000"
        style={{
          background: `radial-gradient(48% 44% at 24% 18%, ${a}59, transparent 70%), radial-gradient(52% 48% at 78% 84%, ${b}4d, transparent 72%), radial-gradient(38% 34% at 62% 10%, ${b}26, transparent 70%)`,
        }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg) 18%, transparent), color-mix(in srgb, var(--bg) 72%, transparent) 78%)' }} />

      <div className="relative h-full flex flex-col max-w-[620px] mx-auto px-6">
        {/* header */}
        <div className="flex items-center justify-between pt-5 pb-2 shrink-0">
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close now playing">
            <ChevronDown size={20} />
          </button>
          <div className="text-center min-w-0">
            <p className="text-[10.5px] font-bold tracking-[0.24em] uppercase text-dim">Now playing</p>
            {current.album && <p className="text-[11.5px] text-soft truncate mt-0.5 max-w-[320px]">{current.album}</p>}
          </div>
          <button className="icon-btn" onClick={() => setQueueOpen(true)} aria-label="Open queue">
            <ListMusic size={17} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col items-center justify-center gap-5 py-3">
          {/* artwork + reflection */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.06 }}
            className="relative shrink-0"
            style={{ width: artSize }}
          >
            <Artwork
              src={current.artwork} seed={current.title + current.artist} alt={current.title} eager
              className="w-full aspect-square rounded-[26px] border border-line object-cover"
            />
            <span className="absolute inset-0 rounded-[26px] pointer-events-none"
              style={{ boxShadow: `0 44px 90px -28px ${a}66, 0 24px 60px -30px rgba(0,0,0,.65)` }} />
            <span aria-hidden className="block w-full aspect-square rounded-[26px] mt-2 opacity-25 pointer-events-none overflow-hidden"
              style={{ transform: 'scaleY(-1)', maskImage: 'linear-gradient(to bottom, transparent 58%, black)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 58%, black)' }}>
              <Artwork src={current.artwork} seed={current.title} alt="" className="w-full aspect-square rounded-[26px] object-cover" />
            </span>
          </motion.div>

          {/* titles */}
          <div className="text-center w-full px-2 -mt-1">
            <h1 className="display text-main font-bold text-[25px] leading-tight truncate">{current.title}</h1>
            <button
              className="text-soft hover:text-acc text-[15px] font-medium mt-1 transition-colors"
              onClick={() => { if (current.artistId) { setOpen(false); go({ id: 'artist', params: { id: current.artistId, name: current.artist } }); } }}
            >
              {current.artist}
            </button>
          </div>

          {/* seek */}
          <div className="w-full px-1">
            {current.live ? (
              <>
                <div className="live-strip w-full" aria-hidden />
                <div className="flex justify-center mt-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#ff8580]">
                    <span className="live-dot !w-1.5 !h-1.5" /> LIVE RADIO
                  </span>
                </div>
              </>
            ) : (
              <>
                <ProgressBar value={position} max={dur} onSeek={(v) => player.seek(v)} className="w-full" />
                <div className="flex justify-between mt-0.5">
                  <span className="text-[11px] tabular-nums text-dim">{fmtTime(position)}</span>
                  <span className="text-[11px] tabular-nums text-dim">-{fmtTime(Math.max(0, dur - position))}</span>
                </div>
              </>
            )}
          </div>

          {/* controls */}
          <div className="flex items-center gap-3">
            <button className={cx('icon-btn', shuffle && 'active')} aria-label="Shuffle" aria-pressed={shuffle}
              onClick={() => player.toggleShuffle()}>
              <Shuffle size={17} />
            </button>
            <button className="icon-btn !w-12 !h-12" aria-label="Previous" onClick={() => player.prev()}>
              <SkipBack size={23} className="fill-current" />
            </button>
            <button className="play-fab !w-[68px] !h-[68px] mx-2" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={() => player.toggle()}>
              {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
            </button>
            <button className="icon-btn !w-12 !h-12" aria-label="Next" onClick={() => player.next()}>
              <SkipForward size={23} className="fill-current" />
            </button>
            <button className={cx('icon-btn', repeat !== 'off' && 'active')} aria-label="Repeat" aria-pressed={repeat !== 'off'}
              onClick={() => player.cycleRepeat()}>
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={17} />}
            </button>
          </div>

          {/* utilities */}
          <div className="flex items-center gap-2 pb-2">
            <button
              className={cx('chip', fav && 'active')}
              onClick={() => useLibrary.getState().toggleFavorite(current)}
            >
              <Heart size={13.5} className={cx(fav && 'fill-current')} />
              {fav ? 'Favorited' : 'Favorite'}
            </button>
            <button className="chip" onClick={() => openModal({ type: 'addToPlaylist', payload: { track: current } })}>
              <ListPlus size={13.5} />
              Playlist
            </button>
            {current.provider === 'youtube' && (
              <button className={cx('chip', useUI.getState().videoMode && 'active')} onClick={() => useUI.getState().setVideoMode(!useUI.getState().videoMode)}>
                <Video size={13.5} />
                Video
              </button>
            )}
          </div>

          {/* up next peek */}
          {next && (
            <button
              onClick={() => setQueueOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl glass border border-line card-hover text-left mb-4"
            >
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-dim shrink-0 w-[64px]">Up next</span>
              <Artwork src={next.artworkSmall || next.artwork} seed={next.title} alt="" className="w-9 h-9 rounded-lg shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold text-main truncate">{next.title}</span>
                <span className="block text-[11px] text-dim truncate">{next.artist}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
