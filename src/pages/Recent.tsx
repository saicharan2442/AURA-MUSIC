import { motion } from 'framer-motion';
import { History, Play, Shuffle, Trash2 } from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { shuffleArray } from '../utils';
import { SongRow } from '../components/SongRow';
import { EmptyState } from '../components/ui';

/* Recently played, grouped by day. */

function dayLabel(at: number, now: Date): string {
  const d = new Date(at);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = startOfDay(now) - startOfDay(d);
  if (diff <= 0) return 'Today';
  if (diff <= 86_400_000) return 'Yesterday';
  return 'Earlier';
}

export default function Recent() {
  const recent = useLibrary((s) => s.recent);
  const clearRecent = useLibrary((s) => s.clearRecent);
  const go = useUI((s) => s.go);
  const toast = useUI((s) => s.toast);

  const now = new Date();
  const groups: { label: string; entries: typeof recent }[] = [];
  recent.forEach((r) => {
    const label = dayLabel(r.at, now);
    const g = groups.find((x) => x.label === label);
    if (g) g.entries.push(r);
    else groups.push({ label, entries: [r] });
  });
  const allTracks = recent.map((r) => r.track);

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-soft">Your library</p>
          <h1 className="display text-main font-bold text-[30px] tracking-tight mt-1 flex items-center gap-3">
            Recently played <History size={20} className="text-dim" />
          </h1>
          <p className="text-dim text-[13px] mt-1.5">{recent.length} track{recent.length === 1 ? '' : 's'} in your local history</p>
        </div>
        {recent.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button className="btn btn-accent !h-10" onClick={() => usePlayer.getState().playContext(allTracks, 0)}>
              <Play size={14} className="fill-current" /> Play all
            </button>
            <button className="btn btn-ghost !h-10" onClick={() => usePlayer.getState().playContext(shuffleArray(allTracks), 0)}>
              <Shuffle size={13.5} /> Shuffle
            </button>
            <button className="btn btn-danger !h-10" onClick={() => { clearRecent(); toast({ title: 'History cleared' }); }}>
              <Trash2 size={13.5} /> Clear history
            </button>
          </div>
        )}
      </motion.div>

      <div className="mt-8">
        {recent.length === 0 ? (
          <EmptyState
            icon={History}
            title="No history yet"
            sub="Songs you play will show up here, newest first. History never leaves this device."
            action="Play something"
            onAction={() => go({ id: 'home' })}
          />
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mb-8">
              <p className="px-3 pb-2 text-[10.5px] font-bold tracking-[0.18em] uppercase text-dim border-b border-line mb-1">{g.label}</p>
              {g.entries.map((r) => (
                <SongRow key={r.at + r.track.id} track={r.track} context={g.entries.map((x) => x.track)} playedAt={r.at} menuContext="recent" showAlbum dense />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
