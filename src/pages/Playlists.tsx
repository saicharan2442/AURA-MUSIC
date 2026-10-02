import { motion, Reorder } from 'framer-motion';
import { GripVertical, ListMusic, Music2, Pencil, Play, Plus, Search, Shuffle, Trash2 } from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { shuffleArray, totalDuration, timeAgo } from '../utils';
import { PlaylistTile } from '../components/cards';
import { SongRow } from '../components/SongRow';
import { EmptyState } from '../components/ui';

/* ======================= grid ======================= */

export default function Playlists() {
  const playlists = useLibrary((s) => s.playlists);
  const openModal = useUI((s) => s.openModal);
  const go = useUI((s) => s.go);

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-soft">Your library</p>
        <h1 className="display text-main font-bold text-[30px] tracking-tight mt-1">Playlists</h1>
        <p className="text-dim text-[13px] mt-1.5">
          {playlists.length ? `${playlists.length} playlist${playlists.length === 1 ? '' : 's'} · stored locally on this device` : 'Handmade collections, kept on this device'}
        </p>
      </motion.div>

      <div className="grid gap-x-5 gap-y-8 mt-9" style={{ gridTemplateColumns: 'repeat(auto-fill, 196px)' }}>
        {/* new playlist tile */}
        <button onClick={() => openModal({ type: 'createPlaylist' })} className="group w-[196px] text-left" aria-label="Create playlist">
          <div className="w-[196px] h-[196px] rounded-[var(--radius)] border-2 border-dashed border-line card-hover flex flex-col items-center justify-center gap-3 text-dim group-hover:text-acc transition-colors">
            <span className="w-12 h-12 rounded-2xl bg-card border border-line flex items-center justify-center">
              <Plus size={20} />
            </span>
            <span className="text-[13px] font-semibold">New playlist</span>
          </div>
        </button>

        {playlists.map((p) => <PlaylistTile key={p.id} playlist={p} />)}
      </div>

      {playlists.length === 0 && (
        <div className="card mt-12 p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="display text-main font-semibold text-[15px]">Find something to collect</p>
            <p className="text-dim text-[12.5px] mt-0.5">Right-click any song and choose “Add to playlist”.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => go({ id: 'search' })}>
            <Search size={14} /> Browse music
          </button>
        </div>
      )}
    </div>
  );
}

/* ======================= detail ======================= */

export function PlaylistPage({ params }: { params: Record<string, any> }) {
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === params.id));
  const openModal = useUI((s) => s.openModal);
  const go = useUI((s) => s.go);

  if (!playlist) {
    return (
      <EmptyState
        icon={ListMusic}
        title="Playlist not found"
        sub="It may have been deleted."
        action="Back to playlists"
        onAction={() => go({ id: 'playlists' })}
      />
    );
  }

  const tracks = playlist.tracks;
  const arts: string[] = [];
  tracks.forEach((t) => { const a = t.artwork; if (a && !arts.includes(a)) arts.push(a); });

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-end gap-6 flex-wrap">
        <div className="w-[176px] h-[176px] rounded-2xl overflow-hidden shadow-2xl border border-line shrink-0 bg-card">
          {arts.length > 0 ? (
            <div className={`w-full h-full grid ${arts.length > 1 ? 'grid-cols-2 grid-rows-2' : ''}`}>
              {[0, 1, 2, 3].map((i) => (
                <img key={i} src={arts[i % arts.length]} alt="" className={`w-full h-full object-cover ${arts.length === 3 && i === 3 ? 'hidden' : ''}`} />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-dim bg-elev">
              <ListMusic size={44} strokeWidth={1.4} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-soft">Playlist</p>
          <h1 className="display text-main font-bold text-[32px] md:text-[40px] leading-[1.05] tracking-tight mt-2 truncate">{playlist.name}</h1>
          <p className="text-soft text-[13px] mt-3">
            {tracks.length} song{tracks.length === 1 ? '' : 's'} · {totalDuration(tracks)} · updated {timeAgo(playlist.updatedAt)}
          </p>
          <div className="flex items-center gap-2.5 mt-6 flex-wrap">
            <button className="btn btn-accent !h-11 !px-6" disabled={!tracks.length}
              onClick={() => usePlayer.getState().playContext(tracks, 0)}>
              <Play size={15} className="fill-current" /> Play
            </button>
            <button className="btn btn-ghost !h-11" disabled={!tracks.length}
              onClick={() => usePlayer.getState().playContext(shuffleArray(tracks), 0)}>
              <Shuffle size={14.5} /> Shuffle
            </button>
            <button className="btn btn-ghost !h-11 !px-4" aria-label="Rename playlist"
              onClick={() => openModal({ type: 'renamePlaylist', payload: { id: playlist.id, name: playlist.name } })}>
              <Pencil size={14.5} />
            </button>
            <button className="btn btn-danger !h-11 !px-4" aria-label="Delete playlist"
              onClick={() => openModal({ type: 'confirmDeletePlaylist', payload: { id: playlist.id, name: playlist.name } })}>
              <Trash2 size={14.5} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-9">
        {tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="This playlist is empty"
            sub="Right-click any song anywhere in Aura and choose “Add to playlist”."
            action="Find music"
            onAction={() => go({ id: 'search' })}
          />
        ) : (
          <>
            <p className="text-[11px] text-dim mb-2 px-3">Drag tracks to reorder · right-click for options</p>
            <Reorder.Group axis="y" values={tracks} onReorder={(items) => useLibrary.getState().reorderPlaylist(playlist.id, items)} className="space-y-0.5">
              {tracks.map((t, i) => (
                <Reorder.Item key={t.id} value={t} className="group/qi" whileDrag={{ scale: 1.015 }}>
                  <div className="flex items-center">
                    <span className="pl-1.5 text-dim cursor-grab active:cursor-grabbing opacity-0 group-hover/qi:opacity-100 transition-opacity">
                      <GripVertical size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <SongRow track={t} index={i} context={tracks} menuContext="playlist" playlistId={playlist.id} dense />
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </>
        )}
      </div>
    </div>
  );
}
