import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Shuffle } from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { shuffleArray, totalDuration } from '../utils';
import { SongRow } from '../components/SongRow';
import { EmptyState, Segmented } from '../components/ui';

type Sort = 'recent' | 'title' | 'artist' | 'long';

export default function Favorites() {
  const favorites = useLibrary((s) => s.favorites);
  const go = useUI((s) => s.go);
  const [sort, setSort] = useState<Sort>('recent');

  const sorted = [...favorites].sort((a, b) => {
    switch (sort) {
      case 'title': return a.title.localeCompare(b.title);
      case 'artist': return a.artist.localeCompare(b.artist);
      case 'long': return (b.duration || 0) - (a.duration || 0);
      default: return 0; // favorites are stored newest-first
    }
  });

  const playAll = () => sorted.length && usePlayer.getState().playContext(sorted, 0);
  const shuffleAll = () => sorted.length && usePlayer.getState().playContext(shuffleArray(sorted), 0);

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-[92px] h-[92px] rounded-3xl flex items-center justify-center shadow-2xl shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>
            <Heart size={38} className="fill-white text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-soft">Collection</p>
            <h1 className="display text-main font-bold text-[34px] tracking-tight mt-1">Favorites</h1>
            <p className="text-dim text-[13px] mt-1.5">
              {favorites.length} song{favorites.length === 1 ? '' : 's'}{favorites.length > 0 && ` · ${totalDuration(favorites)}`}
            </p>
          </div>
          {favorites.length > 0 && (
            <div className="flex items-center gap-2.5">
              <button className="btn btn-accent !h-11 !px-6" onClick={playAll}>
                <Play size={15} className="fill-current" /> Play all
              </button>
              <button className="btn btn-ghost !h-11" onClick={shuffleAll}>
                <Shuffle size={14.5} /> Shuffle
              </button>
            </div>
          )}
        </div>

        {favorites.length > 0 && (
          <div className="mt-7 flex items-center justify-between gap-4 flex-wrap">
            <Segmented<Sort>
              options={[
                { value: 'recent', label: 'Recently added' },
                { value: 'title', label: 'Title' },
                { value: 'artist', label: 'Artist' },
                { value: 'long', label: 'Longest' },
              ]}
              value={sort}
              onChange={setSort}
            />
          </div>
        )}
      </motion.div>

      <div className="mt-6">
        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing here yet"
            sub="Tap the heart on any song and it will land here — synced to this device, instantly playable."
            action="Discover music"
            onAction={() => go({ id: 'discover' })}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            {sorted.map((t, i) => (
              <SongRow key={t.id} track={t} index={i} context={sorted} showAlbum dense />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
