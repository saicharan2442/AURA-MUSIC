import { useState } from 'react';
import { motion } from 'framer-motion';
import { Disc3, Play, Radio } from 'lucide-react';
import { useAsync } from '../hooks';
import { activeProvider } from '../services/providers';
import { RADIO_TAGS, stationsByTag, topStations } from '../services/radio';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import type { Track } from '../types';
import { cx } from '../utils';
import { Artwork } from '../components/Artwork';
import { AlbumCard, GenreTile, MoodCard, type Mood } from '../components/cards';
import { SongRow } from '../components/SongRow';
import { ErrorState, HScroll, SectionHeader, SkeletonCards, SkeletonRowList } from '../components/ui';

/* ---------------- editorial configuration ---------------- */

export const GENRES = [
  { id: '14', name: 'Pop', h1: 262, h2: 310 },
  { id: '18', name: 'Hip-Hop', h1: 340, h2: 15 },
  { id: '7', name: 'Electronic', h1: 186, h2: 222 },
  { id: '21', name: 'Rock', h1: 8, h2: 38 },
  { id: '15', name: 'R&B / Soul', h1: 284, h2: 332 },
  { id: '17', name: 'Dance', h1: 150, h2: 196 },
  { id: '11', name: 'Jazz', h1: 36, h2: 58 },
  { id: '6', name: 'Country', h1: 96, h2: 140 },
  { id: '20', name: 'Alternative', h1: 212, h2: 250 },
  { id: '24', name: 'Reggae', h1: 120, h2: 82 },
];

export const MOODS: Mood[] = [
  { name: 'Chill', query: 'chill lofi vibes', desc: 'Unwind & breathe', h1: 200, h2: 250 },
  { name: 'Focus', query: 'deep focus ambient', desc: 'Lock in', h1: 220, h2: 190 },
  { name: 'Workout', query: 'workout motivation', desc: 'Push harder', h1: 350, h2: 20 },
  { name: 'Party', query: 'party hits', desc: 'Turn it up', h1: 300, h2: 330 },
  { name: 'Golden Hour', query: 'sunset chill acoustic', desc: 'Warm & mellow', h1: 30, h2: 52 },
  { name: 'Sleep', query: 'sleep ambient instrumental', desc: 'Drift away', h1: 250, h2: 228 },
];

/* ---------------- live radio ---------------- */

function StationCard({ station }: { station: Track }) {
  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const active = current?.id === station.id;
  return (
    <button className="group w-[148px] shrink-0 text-center"
      onClick={() => usePlayer.getState().playContext([station], 0)}>
      <div className={cx('relative mx-auto w-[148px] h-[148px] rounded-full overflow-hidden border card-hover bg-card',
        active ? 'border-[var(--accent)]' : 'border-line')}>
        <Artwork src={station.artworkSmall} seed={station.title} alt={station.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={26} className="fill-white text-white drop-shadow-lg" />
        </div>
        {active && isPlaying && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <span className="eq scale-125"><i /><i /><i /><i /></span>
          </div>
        )}
      </div>
      <p className="mt-3 text-[13px] font-semibold text-main truncate flex items-center justify-center gap-1.5">
        {active && <span className="live-dot" />}
        {station.title}
      </p>
      <p className="text-[11.5px] text-dim mt-0.5 truncate">{station.artist}</p>
    </button>
  );
}

function RadioSection() {
  const [tag, setTag] = useState('');
  const { data, error, reload } = useAsync(
    (signal) => (tag ? stationsByTag(tag, 18, signal) : topStations(18, signal)),
    [tag]
  );
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="display text-main font-semibold text-[20px] leading-tight flex items-center gap-2.5">
            <span className="live-dot" /> Live radio
          </h2>
          <p className="text-dim text-[12.5px] mt-1">Free internet stations worldwide — always on, no login</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {RADIO_TAGS.map((t) => (
            <button key={t.id} className={cx('chip !h-8 !text-[12px]', tag === t.id && 'active')} onClick={() => setTag(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {error && !data ? (
        <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-dim text-[13px] flex items-center gap-2"><Radio size={14} /> {error}</p>
          <button className="btn btn-ghost !h-9" onClick={reload}>Retry</button>
        </div>
      ) : data ? (
        <HScroll>{data.map((s) => <StationCard key={s.id} station={s} />)}</HScroll>
      ) : (
        <SkeletonCards n={8} circle />
      )}
    </motion.section>
  );
}

/* ---------------- page ---------------- */

export default function Discover() {
  const go = useUI((s) => s.go);
  const { data, error, reload } = useAsync(() => activeProvider.homeFeed(), []);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12 space-y-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="display text-main font-bold text-[30px] tracking-tight flex items-center gap-3">
          Discover
          <Disc3 size={22} className="text-acc" />
        </h1>
        <p className="text-dim text-[13px] mt-1">Charts, scenes and moods — updated live from your provider.</p>
      </motion.div>

      {/* charts */}
      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
        <SectionHeader title="Top charts" sub="The most-played songs right now" />
        {data ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
            {data.charts.slice(0, 12).map((t, i) => (
              <SongRow key={t.id} track={t} index={i} context={data.charts} dense />
            ))}
          </div>
        ) : (
          <SkeletonRowList n={12} />
        )}
      </motion.section>

      {/* genres */}
      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
        <SectionHeader title="Genres" sub="Explore by scene" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {GENRES.map((g) => <GenreTile key={g.id} {...g} />)}
        </div>
      </motion.section>

      {/* moods */}
      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
        <SectionHeader title="Moods" sub="Soundtrack the moment" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {MOODS.map((m) => <MoodCard key={m.name} mood={m} />)}
        </div>
      </motion.section>

      {/* live radio */}
      <RadioSection />

      {/* new releases */}
      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
        <SectionHeader title="New & noteworthy" sub="Latest releases across every genre" />
        {data ? <HScroll>{data.newReleases.map((a) => <AlbumCard key={a.id} album={a} />)}</HScroll> : <SkeletonCards n={7} />}
      </motion.section>

      {/* top albums */}
      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
        <SectionHeader title="Albums people love" />
        {data ? <HScroll>{data.topAlbums.map((a) => <AlbumCard key={a.id} album={a} />)}</HScroll> : <SkeletonCards n={7} />}
      </motion.section>

      <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="display text-main font-semibold text-[15px]">Looking for something specific?</p>
          <p className="text-dim text-[12.5px] mt-0.5">Search the full catalog — songs, artists and albums.</p>
        </div>
        <button className="btn btn-accent" onClick={() => go({ id: 'search' })}>Open search</button>
      </div>
    </div>
  );
}
