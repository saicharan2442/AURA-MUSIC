import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, Play, Search as SearchIcon, Trash2, X } from 'lucide-react';
import { useDebounce, useAsync } from '../hooks';
import { activeProvider } from '../services/providers';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import type { Track } from '../types';
import { cx } from '../utils';
import { Artwork } from '../components/Artwork';
import { AlbumCard, ArtistCard, GenreTile, SongCard } from '../components/cards';
import { SongRow } from '../components/SongRow';
import { EmptyState, ErrorState, SectionHeader, SkeletonCards, SkeletonRowList, HScroll } from '../components/ui';
import { GENRES } from './Discover';

type Filter = 'all' | 'songs' | 'albums' | 'artists';

export default function Search() {
  const query = useUI((s) => s.searchQuery);
  const setQuery = useUI((s) => s.setSearchQuery);
  const debounced = useDebounce(query, 320);
  const [filter, setFilter] = useState<Filter>('all');

  const { data, error, loading, reload } = useAsync(
    (signal) => (debounced.trim() ? activeProvider.searchAll(debounced.trim(), signal) : Promise.resolve(null)),
    [debounced]
  );

  const hasResults = !!data && (data.songs.length > 0 || data.albums.length > 0 || data.artists.length > 0);

  return (
    <div className="max-w-[1480px] mx-auto px-5 md:px-9 pt-7 pb-12">
      {!debounced.trim() ? (
        <BrowseEmpty />
      ) : loading && !data ? (
        <div className="space-y-10">
          <div className="skeleton h-8 w-64 rounded-lg" />
          <SkeletonRowList n={8} />
          <SkeletonCards n={6} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !hasResults ? (
        <EmptyState
          icon={SearchIcon}
          title={`No results for “${debounced.trim()}”`}
          sub="Check the spelling, or try a different artist, album or song name."
          action="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {(['all', 'songs', 'albums', 'artists'] as Filter[]).map((f) => (
              <button key={f} className={cx('chip capitalize', filter === f && 'active')} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
            <span className="text-[12px] text-dim ml-2">
              Results for “<span className="text-soft font-semibold">{debounced.trim()}</span>”
            </span>
          </div>

          {/* -------- top result + songs -------- */}
          {(filter === 'all' || filter === 'songs') && data!.songs.length > 0 && (
            <>
              {filter === 'all' && data!.top && (
                <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 mb-10">
                  <TopResult track={data!.top} context={data!.songs} />
                  <div>
                    <SectionHeader title="Songs" />
                    {data!.songs.slice(0, 4).map((t, i) => (
                      <SongRow key={t.id} track={t} context={data!.songs} index={i} dense />
                    ))}
                  </div>
                </div>
              )}
              {filter === 'all' ? (
                <div className="mb-10">
                  <SectionHeader title="More songs" action="All songs" onAction={() => setFilter('songs')} />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
                    {data!.songs.slice(4, 12).map((t) => (
                      <SongRow key={t.id} track={t} context={data!.songs} showAlbum dense />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
                  {data!.songs.map((t, i) => (
                    <SongRow key={t.id} track={t} context={data!.songs} index={i} showAlbum dense />
                  ))}
                </div>
              )}
            </>
          )}

          {/* -------- artists -------- */}
          {(filter === 'all' || filter === 'artists') && data!.artists.length > 0 && (
            <div className="mb-10">
              <SectionHeader title="Artists" />
              {filter === 'artists' ? (
                <div className="grid gap-x-5 gap-y-7" style={{ gridTemplateColumns: 'repeat(auto-fill, 148px)' }}>
                  {data!.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
                </div>
              ) : (
                <HScroll>{data!.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}</HScroll>
              )}
            </div>
          )}

          {/* -------- albums -------- */}
          {(filter === 'all' || filter === 'albums') && data!.albums.length > 0 && (
            <div>
              <SectionHeader title="Albums" />
              {filter === 'albums' ? (
                <div className="grid gap-x-5 gap-y-7" style={{ gridTemplateColumns: 'repeat(auto-fill, 168px)' }}>
                  {data!.albums.map((a) => <AlbumCard key={a.id} album={a} />)}
                </div>
              ) : (
                <HScroll>{data!.albums.map((a) => <AlbumCard key={a.id} album={a} />)}</HScroll>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ---------------- top result ---------------- */

function TopResult({ track, context }: { track: Track; context: Track[] }) {
  return (
    <div>
      <SectionHeader title="Top result" />
      <div className="group relative rounded-3xl bg-card border border-line card-hover p-6 cursor-pointer"
        onClick={() => usePlayer.getState().playContext(context, 0)}>
        <Artwork src={track.artwork} seed={track.title} alt="" className="w-[104px] h-[104px] rounded-2xl shadow-xl" />
        <p className="display text-main font-bold text-[23px] leading-tight mt-5 truncate">{track.title}</p>
        <p className="text-dim text-[13px] mt-1.5 flex items-center gap-2">
          <span className="chip !h-6 !px-2.5 !text-[10.5px] uppercase tracking-wider">Song</span>
          <span className="truncate">{track.artist}{track.album ? ` · ${track.album}` : ''}</span>
        </p>
        <button aria-label={`Play ${track.title}`}
          onClick={(e) => { e.stopPropagation(); usePlayer.getState().playContext(context, 0); }}
          className="play-fab w-[52px] h-[52px] absolute right-6 bottom-6 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
          <Play size={19} className="fill-current ml-0.5" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- empty / browse state ---------------- */

function BrowseEmpty() {
  const history = useLibrary((s) => s.searchHistory);
  const clearSearch = useLibrary((s) => s.clearSearch);
  const setQuery = useUI((s) => s.setSearchQuery);
  const { data } = useAsync(() => activeProvider.homeFeed(), []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-11">
      {history.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="display text-main font-semibold text-[17px] flex items-center gap-2">
              <History size={15} className="text-dim" /> Recent searches
            </h2>
            <button className="text-[12px] font-semibold text-dim hover:text-main flex items-center gap-1.5 transition-colors" onClick={clearSearch}>
              <Trash2 size={12} /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button key={h} className="chip group" onClick={() => setQuery(h)}>
                <History size={12} className="text-dim" />
                {h}
                <X size={11} className="opacity-0 group-hover:opacity-100 -mr-1 transition-opacity" onClick={(e) => { e.stopPropagation(); useLibrary.setState((s) => ({ searchHistory: s.searchHistory.filter((x) => x !== h) })); }} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Trending now" sub="What everyone is searching for" />
        {data ? (
          <HScroll>{data.charts.slice(0, 10).map((t) => <SongCard key={t.id} track={t} context={data.charts} />)}</HScroll>
        ) : (
          <SkeletonCards n={7} />
        )}
      </section>

      <section>
        <SectionHeader title="Browse genres" sub="Jump straight into a scene" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {GENRES.map((g) => <GenreTile key={g.id} {...g} />)}
        </div>
      </section>
    </motion.div>
  );
}
