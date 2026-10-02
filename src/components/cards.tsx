import { useState } from 'react';
import { Disc3, ListMusic, Play, Shuffle } from 'lucide-react';
import type { MouseEvent as RMouseEvent } from 'react';
import type { Album, Artist, LocalPlaylist, Track } from '../types';
import { activeProvider } from '../services/providers';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { cx, shuffleArray, timeAgo } from '../utils';
import { Artwork } from './Artwork';
import { useTrackMenu } from './ContextMenu';

/* ---------------- shared play helper ---------------- */

function usePlayTrack() {
  return (track: Track, context?: Track[]) => {
    const list = context ?? [track];
    const i = Math.max(0, list.findIndex((t) => t.id === track.id));
    usePlayer.getState().playContext(list, i);
  };
}

function Fab({ onClick, label, loading }: { onClick: (e: RMouseEvent) => void; label: string; loading?: boolean }) {
  return (
    <button
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className="play-fab absolute right-2.5 bottom-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 z-10"
    >
      {loading ? <span className="spinner !border-[color-mix(in_srgb,var(--on-accent)_30%,transparent)] !border-t-[var(--on-accent)]" /> : <Play size={18} className="fill-current ml-0.5" />}
    </button>
  );
}

/* ---------------- song card ---------------- */

export function SongCard({ track, context }: { track: Track; context?: Track[] }) {
  const playTrack = usePlayTrack();
  const menu = useTrackMenu();
  return (
    <div className="group w-[168px] shrink-0 cursor-pointer"
      onClick={() => playTrack(track, context)}
      onContextMenu={(e) => menu(e, track)}>
      <div className="relative rounded-[var(--radius)] overflow-hidden border border-line card-hover aspect-square bg-card">
        <Artwork src={track.artwork} seed={track.title + track.artist} alt={track.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Fab label={`Play ${track.title}`} onClick={() => playTrack(track, context)} />
      </div>
      <p className="mt-2.5 text-[13.5px] font-semibold text-main truncate leading-snug">{track.title}</p>
      <p className="text-[12px] text-dim truncate mt-0.5">{track.artist}</p>
    </div>
  );
}

/* ---------------- album card ---------------- */

export function AlbumCard({ album }: { album: Album }) {
  const go = useUI((s) => s.go);
  const toast = useUI((s) => s.toast);
  const [loading, setLoading] = useState(false);

  const open = () => go({ id: 'album', params: { id: album.id, title: album.title, artist: album.artist, artwork: album.artwork } });

  const play = async () => {
    setLoading(true);
    try {
      const d = await activeProvider.albumDetail(album.id);
      if (d.tracks.length) usePlayer.getState().playContext(d.tracks, 0);
      else toast({ title: 'No playable tracks', sub: album.title, kind: 'error' });
    } catch (e: any) {
      toast({ title: 'Could not load album', sub: e?.message, kind: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div className="group w-[168px] shrink-0 cursor-pointer" onClick={open}>
      <div className="relative rounded-[var(--radius)] overflow-hidden border border-line card-hover aspect-square bg-card">
        <Artwork src={album.artwork} seed={album.title} alt={album.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Fab label={`Play ${album.title}`} onClick={play} loading={loading} />
      </div>
      <p className="mt-2.5 text-[13.5px] font-semibold text-main truncate leading-snug">{album.title}</p>
      <p className="text-[12px] text-dim truncate mt-0.5">{[album.artist, album.year].filter(Boolean).join(' · ')}</p>
    </div>
  );
}

/* ---------------- artist card ---------------- */

export function ArtistCard({ artist }: { artist: Artist }) {
  const go = useUI((s) => s.go);
  return (
    <button className="group w-[148px] shrink-0 text-center"
      onClick={() => go({ id: 'artist', params: { id: artist.id, name: artist.name } })}>
      <div className="relative mx-auto w-[148px] h-[148px] rounded-full overflow-hidden border border-line card-hover bg-card">
        <Artwork src={artist.artwork} seed={artist.name} alt={artist.name}
          className={cx('w-full h-full transition-transform duration-500 group-hover:scale-[1.06]')} />
      </div>
      <p className="mt-3 text-[13.5px] font-semibold text-main truncate">{artist.name}</p>
      <p className="text-[11.5px] text-dim mt-0.5">Artist</p>
    </button>
  );
}

/* ---------------- playlist tile (local) ---------------- */

export function PlaylistTile({ playlist, onOpen }: { playlist: LocalPlaylist; onOpen?: () => void }) {
  const go = useUI((s) => s.go);
  const open = onOpen ?? (() => go({ id: 'playlist', params: { id: playlist.id } }));

  const arts: string[] = [];
  playlist.tracks.forEach((t) => {
    const a = t.artworkSmall || t.artwork;
    if (a && !arts.includes(a)) arts.push(a);
  });

  const play = () => { if (playlist.tracks.length) usePlayer.getState().playContext(playlist.tracks, 0); };
  const shufflePlay = () => { if (playlist.tracks.length) { usePlayer.getState().playContext(shuffleArray(playlist.tracks), 0); } };

  return (
    <div className="group w-[196px] shrink-0 cursor-pointer" onClick={open}>
      <div className="relative rounded-[var(--radius)] overflow-hidden border border-line card-hover aspect-square bg-card">
        {arts.length > 0 ? (
          <div className={cx('w-full h-full grid', arts.length > 1 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1')}>
            {[0, 1, 2, 3].map((i) => (
              <Artwork key={i} src={arts[i % arts.length]} seed={playlist.name + i} alt=""
                className={cx('w-full h-full', arts.length === 3 && i === 3 && 'hidden')} />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dim bg-elev">
            <ListMusic size={34} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Fab label={`Play ${playlist.name}`} onClick={play} />
        <button aria-label="Shuffle playlist" onClick={(e) => { e.stopPropagation(); shufflePlay(); }}
          className="absolute left-2.5 bottom-2.5 w-9 h-9 rounded-full glass-strong border border-line hidden group-hover:flex items-center justify-center text-white/90 hover:text-white z-10 transition-all">
          <Shuffle size={14} />
        </button>
      </div>
      <p className="mt-2.5 text-[13.5px] font-semibold text-main truncate leading-snug">{playlist.name}</p>
      <p className="text-[12px] text-dim truncate mt-0.5">
        {playlist.tracks.length} song{playlist.tracks.length === 1 ? '' : 's'} · {timeAgo(playlist.updatedAt)}
      </p>
    </div>
  );
}

/* ---------------- genre tile ---------------- */

export function GenreTile({ id, name, h1, h2 }: { id: string; name: string; h1: number; h2: number }) {
  const go = useUI((s) => s.go);
  return (
    <button
      onClick={() => go({ id: 'genre', params: { id, name, h1 } })}
      className="relative h-[104px] rounded-2xl overflow-hidden text-left p-4 border border-line card-hover group"
      style={{ background: `linear-gradient(135deg, hsl(${h1} 62% 38%), hsl(${h2} 68% 20%))` }}
    >
      <span className="display text-white font-bold text-[17px] drop-shadow-md relative z-10">{name}</span>
      <Disc3 className="absolute -right-4 -bottom-4 text-white/25 rotate-12 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110" size={86} strokeWidth={1.4} />
      <span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </button>
  );
}

/* ---------------- mood / mix tile ---------------- */

export interface Mood { name: string; query: string; desc: string; h1: number; h2: number; }

export function MoodCard({ mood }: { mood: Mood }) {
  const setSearchQuery = useUI((s) => s.setSearchQuery);
  const go = useUI((s) => s.go);
  return (
    <button
      onClick={() => { setSearchQuery(mood.query); go({ id: 'search' }); }}
      className="relative h-[104px] rounded-2xl overflow-hidden text-left p-4 border border-line card-hover group"
      style={{ background: `linear-gradient(135deg, hsl(${mood.h1} 66% 44%), hsl(${mood.h2} 60% 20%))` }}
    >
      <span className="display text-white font-bold text-[17px] drop-shadow-md relative z-10">{mood.name}</span>
      <span className="block text-white/70 text-[11.5px] mt-1 relative z-10 font-medium">{mood.desc}</span>
      <span className="absolute -right-3 -bottom-6 w-20 h-20 rounded-full bg-white/15 blur-xl transition-transform duration-500 group-hover:scale-150" />
    </button>
  );
}

/* ---------------- wide tile (jump back in) ---------------- */

export function WideTile({ track, context }: { track: Track; context?: Track[] }) {
  const playTrack = usePlayTrack();
  const menu = useTrackMenu();
  return (
    <div
      className="group relative flex items-center gap-3.5 rounded-2xl bg-card border border-line card-hover overflow-hidden cursor-pointer pr-3 min-w-0"
      onClick={() => playTrack(track, context)}
      onContextMenu={(e) => menu(e, track)}
    >
      <Artwork src={track.artworkSmall || track.artwork} seed={track.title} alt="" className="w-[64px] h-[64px] shrink-0" />
      <div className="min-w-0 flex-1 py-3">
        <p className="text-[13.5px] font-semibold text-main truncate leading-snug">{track.title}</p>
        <p className="text-[12px] text-dim truncate mt-0.5">{track.artist}</p>
      </div>
      <button aria-label={`Play ${track.title}`}
        onClick={(e) => { e.stopPropagation(); playTrack(track, context); }}
        className="play-fab !w-10 !h-10 static opacity-0 group-hover:opacity-100 shrink-0 mr-1">
        <Play size={15} className="fill-current ml-0.5" />
      </button>
    </div>
  );
}
