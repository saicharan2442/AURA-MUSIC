import { motion } from 'framer-motion';
import { Clock, Heart, History, ListMusic, TrendingUp } from 'lucide-react';
import { useLibrary } from '../store/library';
import { useUI } from '../store/ui';
import { totalDuration } from '../utils';
import { PlaylistTile } from '../components/cards';
import { SongRow } from '../components/SongRow';
import { SectionHeader } from '../components/ui';
import { cx } from '../utils';

/* Library overview: stats, quick links, playlist tiles, recent preview. */

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card card-hover p-5 flex items-center gap-4">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="display text-main font-bold text-[21px] leading-none">{value}</p>
        <p className="text-dim text-[12px] mt-1.5">{label}</p>
      </div>
    </div>
  );
}

export default function Library() {
  const favorites = useLibrary((s) => s.favorites);
  const playlists = useLibrary((s) => s.playlists);
  const recent = useLibrary((s) => s.recent);
  const go = useUI((s) => s.go);
  const openModal = useUI((s) => s.openModal);

  const recentTracks = recent.slice(0, 5).map((r) => r.track);
  const listened = totalDuration(recent.map((r) => r.track));

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12 space-y-11">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="display text-main font-bold text-[30px] tracking-tight">Library</h1>
        <p className="text-dim text-[13px] mt-1.5">Everything you own, saved locally — favorites, playlists and history.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={Heart} label="Favorite songs" value={String(favorites.length)} />
        <Stat icon={ListMusic} label="Playlists" value={String(playlists.length)} />
        <Stat icon={History} label="Tracks in history" value={String(recent.length)} />
        <Stat icon={Clock} label="Listening logged" value={listened} />
      </div>

      <div>
        <SectionHeader title="Collections" action="New playlist" onAction={() => openModal({ type: 'createPlaylist' })} />
        <div className="grid gap-x-5 gap-y-8" style={{ gridTemplateColumns: 'repeat(auto-fill, 196px)' }}>
          {/* favorites tile */}
          <button className="group w-[196px] text-left" onClick={() => go({ id: 'favorites' })}>
            <div className={cx('w-[196px] h-[196px] rounded-[var(--radius)] border border-line card-hover overflow-hidden flex items-end p-4 relative')}
              style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 55%, #0000), color-mix(in srgb, var(--accent2) 38%, var(--card)))' }}>
              <Heart size={56} className="absolute top-5 left-5 fill-white/90 text-white/90 drop-shadow-lg" />
              <div className="relative">
                <p className="display text-white font-bold text-[19px] drop-shadow">Favorites</p>
                <p className="text-white/80 text-[12px] font-medium">{favorites.length} songs</p>
              </div>
            </div>
          </button>

          {/* history tile */}
          <button className="group w-[196px] text-left" onClick={() => go({ id: 'recent' })}>
            <div className="w-[196px] h-[196px] rounded-[var(--radius)] card card-hover overflow-hidden flex items-end p-4 relative">
              <History size={52} className="absolute top-5 left-5 text-acc" />
              <TrendingUp size={84} className="absolute -right-4 -top-6 text-[color-mix(in_srgb,var(--accent)_12%,transparent)]" />
              <div className="relative">
                <p className="display text-main font-bold text-[19px]">Recently played</p>
                <p className="text-dim text-[12px] font-medium">{recent.length} tracks</p>
              </div>
            </div>
          </button>

          {playlists.slice(0, 6).map((p) => <PlaylistTile key={p.id} playlist={p} />)}
        </div>
      </div>

      {recentTracks.length > 0 && (
        <div>
          <SectionHeader title="In rotation" action="Full history" onAction={() => go({ id: 'recent' })} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
            {recentTracks.map((t, i) => (
              <SongRow key={t.id} track={t} index={i} context={recentTracks} showAlbum dense />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
