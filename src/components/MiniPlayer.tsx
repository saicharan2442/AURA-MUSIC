import { motion } from 'framer-motion';
import { ListMusic, Maximize2, Pause, Play, SkipForward } from 'lucide-react';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { usePalette } from '../hooks';
import { Artwork } from './Artwork';
import { ProgressBar } from './PlayerBar';
import { Logo } from './Logo';

/* Mini mode: the whole app collapses into a floating ambient player. */

export function MiniMode() {
  const setMiniMode = useUI((s) => s.setMiniMode);
  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const palette = usePalette(current?.artwork, current?.title ?? 'aura');

  const a = palette?.a ?? 'var(--accent)';
  const b = palette?.b ?? 'var(--accent2)';
  const player = usePlayer.getState();

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden grain flex items-center justify-center">
      <div className="absolute inset-0 bg-base" />
      <div className="absolute inset-[-15%] blur-[120px] opacity-60 transition-all duration-1000"
        style={{ background: `radial-gradient(50% 45% at 30% 30%, ${a}4d, transparent 70%), radial-gradient(46% 42% at 72% 72%, ${b}40, transparent 72%)` }} />

      {/* watermark */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.07] pointer-events-none select-none">
        <Logo size={180} />
        <span className="display font-bold uppercase tracking-[0.5em] text-[26px] mt-6 text-main">Aura</span>
      </div>

      <motion.div
        initial={{ y: 26, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-[380px] max-w-[92vw] glass-strong border border-line rounded-3xl shadow-2xl p-4"
        role="dialog"
        aria-label="Mini player"
      >
        {current ? (
          <>
            <div className="flex items-center gap-3.5">
              <Artwork src={current.artworkSmall || current.artwork} seed={current.title} alt="" className="w-[58px] h-[58px] rounded-2xl border border-line shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-main truncate leading-snug">{current.title}</p>
                <p className="text-[12px] text-dim truncate mt-0.5">{current.artist}</p>
              </div>
              {isPlaying && <span className="eq shrink-0 mr-1"><i /><i /><i /><i /></span>}
            </div>
            <div className="mt-3">
              <ProgressBar value={position} max={duration || current.duration || 0} onSeek={(v) => player.seek(v)} className="w-full" />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1">
                <button className="play-fab !w-10 !h-10" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={() => player.toggle()}>
                  {isPlaying ? <Pause size={15} className="fill-current" /> : <Play size={15} className="fill-current ml-0.5" />}
                </button>
                <button className="icon-btn" aria-label="Next" onClick={() => player.next()}>
                  <SkipForward size={17} className="fill-current" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button className="icon-btn" aria-label="Queue" onClick={() => { setMiniMode(false); useUI.getState().setQueueOpen(true); }}>
                  <ListMusic size={16} />
                </button>
                <button className="icon-btn" aria-label="Expand" title="Back to Aura" onClick={() => setMiniMode(false)}>
                  <Maximize2 size={15.5} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-6">
            <Logo size={44} glow />
            <p className="display text-main font-semibold text-[15px] mt-4">Aura is in mini mode</p>
            <p className="text-dim text-[12.5px] mt-1">Start playing something to see it here.</p>
            <button className="btn btn-accent mt-5" onClick={() => setMiniMode(false)}>
              <Maximize2 size={14} /> Back to Aura
            </button>
          </div>
        )}
      </motion.div>

      <p className="absolute bottom-5 text-[11px] text-dim tracking-wide">
        Mini mode · in the Windows build this is a compact always-on-top window
      </p>
    </div>
  );
}
