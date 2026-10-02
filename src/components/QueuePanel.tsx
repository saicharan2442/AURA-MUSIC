import { useEffect } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { GripVertical, ListMusic, Plus, Trash2, X } from 'lucide-react';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { useLibrary } from '../store/library';
import { cx } from '../utils';
import { SongRow } from './SongRow';
import { spring } from './ui';

/* Slide-over queue: now playing, reorderable up-next, save & clear. */

export function QueuePanel() {
  const open = useUI((s) => s.queueOpen);
  const setOpen = useUI((s) => s.setQueueOpen);
  const current = usePlayer((s) => s.current());
  const queue = usePlayer((s) => s.queue);
  const order = usePlayer((s) => s.order);
  const pos = usePlayer((s) => s.pos);
  const shuffle = usePlayer((s) => s.shuffle);

  const upNext = (() => {
    const byId = new Map(queue.map((q) => [q.qid, q]));
    return order.slice(pos + 1).map((id) => byId.get(id)).filter(Boolean);
  })() as typeof queue;

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen]);

  const saveAsPlaylist = () => {
    const tracks = usePlayer.getState().snapshotTracks();
    if (!tracks.length) return;
    useLibrary.getState().createPlaylist(`Queue · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, tracks);
    useUI.getState().toast({ title: 'Queue saved as playlist', sub: `${tracks.length} tracks`, kind: 'success' });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="complementary"
          aria-label="Play queue"
          className="fixed z-[62] glass-strong border border-line rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          style={{ right: 12, top: 72, bottom: 'calc(var(--player-h) + 12px)', width: 388, maxWidth: 'calc(100vw - 24px)' }}
          initial={{ x: 430, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 430, opacity: 0 }}
          transition={spring}
        >
          {/* header */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-line">
            <ListMusic size={16} className="text-acc" />
            <h2 className="display font-semibold text-[16px] text-main flex-1">Queue</h2>
            <button className="icon-btn !w-8 !h-8" title="Save queue as playlist" aria-label="Save queue as playlist"
              onClick={saveAsPlaylist} disabled={!queue.length}>
              <Plus size={15} />
            </button>
            <button className="icon-btn !w-8 !h-8" title="Clear queue" aria-label="Clear queue"
              onClick={() => { usePlayer.getState().clearQueue(); useUI.getState().toast({ title: 'Queue cleared' }); }}
              disabled={queue.length <= 1}>
              <Trash2 size={14.5} />
            </button>
            <button className="icon-btn !w-8 !h-8" aria-label="Close queue" onClick={() => setOpen(false)}>
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scroll-slim p-2.5">
            {current ? (
              <>
                <p className="px-3 pt-2 pb-1 text-[10.5px] font-bold tracking-[0.16em] uppercase text-dim">Now playing</p>
                <SongRow track={current} qid={current.qid} menuContext="queue" dense />
                <div className="flex items-center gap-2 px-3 pt-4 pb-1">
                  <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-dim flex-1">
                    Up next {upNext.length > 0 && `· ${upNext.length}`}
                  </p>
                  {shuffle && <span className="text-[10px] font-semibold text-acc bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 rounded-full">Shuffled</span>}
                </div>
                {upNext.length === 0 && (
                  <p className="px-3 py-6 text-center text-[12.5px] text-dim">
                    Nothing up next — add tracks from any list.
                  </p>
                )}
                <Reorder.Group
                  axis="y"
                  values={upNext}
                  onReorder={(items) => usePlayer.getState().reorderUpNext(items.map((i) => i.qid))}
                  className="space-y-0.5"
                >
                  {upNext.map((item) => (
                    <Reorder.Item key={item.qid} value={item} className="group/qi relative rounded-xl" whileDrag={{ scale: 1.02 }}>
                      <div className="flex items-center">
                        <span className={cx('pl-1.5 pr-0 text-dim cursor-grab active:cursor-grabbing opacity-0 group-hover/qi:opacity-100 transition-opacity')}>
                          <GripVertical size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <SongRow track={item} qid={item.qid} menuContext="queue" dense />
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-16 px-6">
                <div className="w-14 h-14 rounded-2xl bg-card border border-line flex items-center justify-center text-dim mb-4">
                  <ListMusic size={22} strokeWidth={1.6} />
                </div>
                <p className="display text-main font-semibold text-[15px]">Your queue is empty</p>
                <p className="text-dim text-[12.5px] mt-1.5 leading-relaxed">Play a track, or right-click any song and choose “Play next”.</p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
