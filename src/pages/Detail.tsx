import { motion } from 'framer-motion';
import { ListPlus, Music2, Play, Shuffle } from 'lucide-react';
import { useAsync, usePalette } from '../hooks';
import { activeProvider } from '../services/providers';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { hslToHex, withAlpha } from '../themes/themes';
import type { Track } from '../types';
import { shuffleArray, totalDuration } from '../utils';
import { Artwork } from '../components/Artwork';
import { AlbumCard } from '../components/cards';
import { SongRow } from '../components/SongRow';
import { ErrorState, HScroll, SkeletonCards, SkeletonRowList } from '../components/ui';

/* Shared header shell with an artwork-reactive gradient wash. */

function HeroWash({ artwork, seed, children }: { artwork?: string; seed: string; children: React.ReactNode }) {
  const palette = usePalette(artwork, seed);
  const a = palette?.a ?? 'var(--accent)';
  const b = palette?.b ?? 'var(--accent2)';
  return (
    <div
      className="relative -mx-5 md:-mx-9 -mt-7 px-5 md:px-9 pt-9 pb-7 mb-2 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${typeof a === 'string' && a.startsWith('#') ? withAlpha(a, 0.34) : 'color-mix(in srgb, var(--accent) 24%, transparent)'} 0%, color-mix(in srgb, var(--bg) 42%, transparent) 62%, var(--bg) 100%), radial-gradient(700px 300px at 85% 0%, ${typeof b === 'string' && b.startsWith('#') ? withAlpha(b, 0.22) : 'transparent'}, transparent 70%)`,
      }}
    >
      {children}
    </div>
  );
}

function ActionRow({ tracks, onSaveAll }: { tracks?: Track[]; onSaveAll?: () => void }) {
  const play = () => tracks?.length && usePlayer.getState().playContext(tracks, 0);
  const shuffle = () => tracks?.length && usePlayer.getState().playContext(shuffleArray(tracks), 0);
  return (
    <div className="flex items-center gap-3 mt-6 flex-wrap">
      <button className="btn btn-accent !h-11 !px-6" onClick={play} disabled={!tracks?.length}>
        <Play size={15} className="fill-current" /> Play
      </button>
      <button className="btn btn-ghost !h-11" onClick={shuffle} disabled={!tracks?.length}>
        <Shuffle size={14.5} /> Shuffle
      </button>
      {onSaveAll && (
        <button className="btn btn-ghost !h-11" onClick={onSaveAll}>
          <ListPlus size={14.5} /> Save to library
        </button>
      )}
    </div>
  );
}

/* ======================= ALBUM ======================= */

export function AlbumPage({ params }: { params: Record<string, any> }) {
  const { data, error, loading, reload } = useAsync(() => activeProvider.albumDetail(params.id), [params.id]);
  const toast = useUI((s) => s.toast);

  const album = data?.album;
  const artwork = album?.artwork || params.artwork;

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <HeroWash artwork={artwork} seed={params.title ?? 'album'}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-end gap-6">
          {artwork ? (
            <Artwork src={artwork} seed={params.title} alt="" eager className="w-[180px] h-[180px] rounded-2xl shadow-2xl border border-line shrink-0" />
          ) : (
            <div className="skeleton w-[180px] h-[180px] rounded-2xl shrink-0" />
          )}
          <div className="min-w-0 pb-1">
            <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-soft">Album</p>
            <h1 className="display text-main font-bold text-[30px] md:text-[38px] leading-[1.05] tracking-tight mt-2 line-clamp-2">
              {album?.title ?? params.title}
            </h1>
            <p className="text-soft text-[13.5px] mt-3">
              <span className="text-main font-semibold">{album?.artist ?? params.artist}</span>
              {[album?.year ?? params.year, data ? `${data.tracks.length} songs` : null, data ? totalDuration(data.tracks) : null]
                .filter(Boolean).map((x) => ` · ${x}`).join('')}
            </p>
            <ActionRow tracks={data?.tracks} onSaveAll={() => {
              if (!data?.tracks.length) return;
              useLibrary.getState().createPlaylist(`${album?.title ?? params.title} — ${album?.artist ?? ''}`.replace(/ — $/, ''), data.tracks);
              toast({ title: 'Album saved as playlist', sub: `${data.tracks.length} tracks added to your library`, kind: 'success' });
            }} />
          </div>
        </motion.div>
      </HeroWash>

      {loading && !data ? <SkeletonRowList n={8} /> :
        error && !data ? <ErrorState message={error} onRetry={reload} /> :
        <div className="mt-4">
          {data!.tracks.map((t, i) => (
            <SongRow key={t.id} track={t} index={i} context={data!.tracks} showArt={i === 0 || data!.tracks[i - 1].artwork !== t.artwork} dense />
          ))}
          {data!.tracks.length === 0 && (
            <div className="flex flex-col items-center py-14 text-center">
              <Music2 size={22} className="text-dim" />
              <p className="text-dim text-[13px] mt-3">This album has no playable previews right now.</p>
            </div>
          )}
        </div>}
    </div>
  );
}

/* ======================= ARTIST ======================= */

export function ArtistPage({ params }: { params: Record<string, any> }) {
  const { data, error, loading, reload } = useAsync(() => activeProvider.artistDetail(params.id), [params.id]);
  const artist = data?.artist;

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <HeroWash artwork={artist?.artwork} seed={params.name ?? 'artist'}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-end gap-6">
          {artist?.artwork ? (
            <Artwork src={artist.artwork} seed={artist.name} alt="" eager className="w-[168px] h-[168px] rounded-full shadow-2xl border border-line shrink-0" />
          ) : (
            <div className="skeleton w-[168px] h-[168px] rounded-full shrink-0" />
          )}
          <div className="min-w-0 pb-1">
            <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-soft">Artist</p>
            <h1 className="display text-main font-bold text-[32px] md:text-[42px] leading-[1.05] tracking-tight mt-2 truncate">
              {artist?.name ?? params.name}
            </h1>
            <p className="text-soft text-[13px] mt-3">
              {data ? `${data.topTracks.length} top tracks · ${data.albums.length} albums` : 'Loading catalog…'}
            </p>
            <ActionRow tracks={data?.topTracks} />
          </div>
        </motion.div>
      </HeroWash>

      {loading && !data ? <SkeletonRowList n={8} /> :
        error && !data ? <ErrorState message={error} onRetry={reload} /> :
        <>
          {data!.topTracks.length > 0 && (
            <div className="mt-4 mb-10">
              <h2 className="display text-main font-semibold text-[19px] mb-3">Top songs</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
                {data!.topTracks.slice(0, 10).map((t, i) => (
                  <SongRow key={t.id} track={t} index={i} context={data!.topTracks} dense />
                ))}
              </div>
            </div>
          )}
          {data!.albums.length > 0 && (
            <div>
              <h2 className="display text-main font-semibold text-[19px] mb-3">Albums</h2>
              <HScroll>{data!.albums.map((a) => <AlbumCard key={a.id} album={a} />)}</HScroll>
            </div>
          )}
        </>}
    </div>
  );
}

/* ======================= GENRE ======================= */

export function GenrePage({ params }: { params: Record<string, any> }) {
  const { data, error, loading, reload } = useAsync(async () => {
    const [tracks, albums] = await Promise.allSettled([
      activeProvider.genreTop(params.id, 24),
      activeProvider.genreAlbums(params.id, 14),
    ]);
    return {
      tracks: tracks.status === 'fulfilled' ? tracks.value : [],
      albums: albums.status === 'fulfilled' ? albums.value : [],
    };
  }, [params.id]);

  const h1 = params.h1 ?? 260;
  const failed = (data && data.tracks.length === 0 && data.albums.length === 0) || (!!error && !data);

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      <div
        className="relative -mx-5 md:-mx-9 -mt-7 px-5 md:px-9 pt-12 pb-9 mb-4 overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${hslToHex(h1, 58, 34)}, ${hslToHex((h1 + 50) % 360, 62, 16)} 55%, var(--bg) 120%)` }}
      >
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10.5px] font-bold tracking-[0.24em] uppercase text-white/60">Genre</p>
          <h1 className="display text-white font-bold text-[42px] tracking-tight mt-2 drop-shadow">{params.name}</h1>
          <ActionRow tracks={data?.tracks} />
        </motion.div>
      </div>

      {loading && !data ? <SkeletonRowList n={10} /> :
        failed ? <ErrorState message="This genre is unavailable right now." onRetry={reload} /> :
        <>
          {data!.tracks.length > 0 && (
            <div className="mb-10">
              <h2 className="display text-main font-semibold text-[19px] mb-3">Most played</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
                {data!.tracks.map((t, i) => (
                  <SongRow key={t.id} track={t} index={i} context={data!.tracks} showAlbum dense />
                ))}
              </div>
            </div>
          )}
          {data!.albums.length > 0 ? (
            <div>
              <h2 className="display text-main font-semibold text-[19px] mb-3">Big albums</h2>
              <HScroll>{data!.albums.map((a) => <AlbumCard key={a.id} album={a} />)}</HScroll>
            </div>
          ) : <SkeletonCards n={6} />}
        </>}
    </div>
  );
}
