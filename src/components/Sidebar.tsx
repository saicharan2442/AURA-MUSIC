import { Compass, Heart, History, Home, ListMusic, PanelLeft, Plus, Search, Settings, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import type { PageId } from '../types';
import { cx } from '../utils';
import { Logo, Wordmark } from './Logo';
import { Artwork } from './Artwork';

/* ---------------- nav item ---------------- */

function NavItem({ icon: Icon, label, active, collapsed, badge, onClick }: {
  icon: LucideIcon; label: string; active?: boolean; collapsed?: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'group/nav relative flex items-center gap-3 w-full rounded-xl font-semibold text-[13.5px] transition-all duration-200',
        collapsed ? 'justify-center h-11' : 'h-11 px-3.5',
        active ? 'text-main bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]' : 'text-soft hover:text-main hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)]'
      )}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-full bg-[var(--accent)]" style={{ left: collapsed ? 'auto' : 0, right: collapsed ? -9 : 'auto' }} />}
      <Icon size={18} strokeWidth={active ? 2.4 : 2} className={cx('shrink-0', active && 'text-acc')} />
      {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="text-[10.5px] font-bold text-dim tabular-nums">{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  );
}

/* ---------------- sidebar ---------------- */

export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  const page = useUI((s) => s.page);
  const go = useUI((s) => s.go);
  const openModal = useUI((s) => s.openModal);
  const favorites = useLibrary((s) => s.favorites);
  const playlists = useLibrary((s) => s.playlists);
  const recent = useLibrary((s) => s.recent);
  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const setNpOpen = useUI((s) => s.setNpOpen);

  const nav = (id: PageId, params?: Record<string, any>) => () => go({ id, params });

  return (
    <aside
      className="relative flex flex-col shrink-0 h-full border-r border-line bg-soft transition-[width] duration-300 z-30"
      style={{ width: collapsed ? 78 : 264, transitionTimingFunction: 'var(--ease-out)' }}
      aria-label="Primary navigation"
    >
      {/* brand */}
      <div className={cx('flex items-center gap-3 pt-5 pb-4', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Logo size={32} glow />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <Wordmark />
            <p className="text-[10px] text-dim tracking-[0.14em] uppercase mt-0.5">Music</p>
          </div>
        )}
        <button className={cx('icon-btn !w-8 !h-8', collapsed && 'absolute -right-4 top-6 glass-strong border border-line shadow-lg z-40')} onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <PanelLeft size={15} className={cx('transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className={cx('flex flex-col gap-1', collapsed ? 'px-3 items-center' : 'px-3')}>
        <NavItem icon={Home} label="Home" collapsed={collapsed} active={page.id === 'home'} onClick={nav('home')} />
        <NavItem icon={Compass} label="Discover" collapsed={collapsed} active={page.id === 'discover' || page.id === 'genre'} onClick={nav('discover')} />
        <NavItem icon={Search} label="Search" collapsed={collapsed} active={page.id === 'search'} onClick={nav('search')} />
      </nav>

      {!collapsed && <p className="px-6 mt-7 mb-2 text-[10.5px] font-bold tracking-[0.18em] uppercase text-dim">Your Library</p>}
      {collapsed && <div className="mx-auto my-4 w-7 h-px bg-[var(--border)]" />}

      <nav className={cx('flex flex-col gap-1', collapsed ? 'px-3 items-center' : 'px-3')}>
        <NavItem icon={Heart} label="Favorites" collapsed={collapsed} badge={favorites.length} active={page.id === 'favorites'} onClick={nav('favorites')} />
        <NavItem icon={ListMusic} label="Playlists" collapsed={collapsed} badge={playlists.length} active={page.id === 'playlists' || page.id === 'playlist' || page.id === 'library'} onClick={nav('playlists')} />
        <NavItem icon={History} label="Recently Played" collapsed={collapsed} badge={recent.length || undefined} active={page.id === 'recent'} onClick={nav('recent')} />
      </nav>

      {/* user playlists quick list */}
      {!collapsed && playlists.length > 0 && (
        <div className="mt-5 px-3 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-dim">Playlists</span>
            <button className="icon-btn !w-6 !h-6" onClick={() => openModal({ type: 'createPlaylist' })} aria-label="Create playlist">
              <Plus size={13} />
            </button>
          </div>
          <div className="overflow-y-auto scroll-slim flex-1 -mx-1 px-1 pb-2 space-y-0.5 mask-fade-b">
            {playlists.slice(0, 8).map((p) => (
              <button key={p.id} onClick={nav('playlist', { id: p.id })}
                className={cx(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-colors',
                  page.id === 'playlist' && page.params?.id === p.id ? 'text-main bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : 'text-soft hover:text-main hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)]'
                )}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 70%, var(--accent2))' }} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* now playing mini card */}
      {current && !collapsed && (
        <button onClick={() => setNpOpen(true)}
          className="mx-3 mb-3 flex items-center gap-3 p-2.5 rounded-2xl bg-card border border-line card-hover text-left group/npc relative overflow-hidden">
          <span className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'linear-gradient(120deg, color-mix(in srgb, var(--accent) 16%, transparent), transparent 65%)' }} />
          <Artwork src={current.artworkSmall || current.artwork} seed={current.title} alt="" className="w-10 h-10 rounded-lg relative" />
          <span className="min-w-0 flex-1 relative">
            <span className="block text-[12.5px] font-semibold text-main truncate">{current.title}</span>
            <span className="block text-[11px] text-dim truncate">{current.artist}</span>
          </span>
          {isPlaying ? <span className="eq relative mr-1"><i /><i /><i /><i /></span> : null}
        </button>
      )}

      {/* footer */}
      <div className={cx('pb-5 pt-2 flex flex-col gap-1 border-t border-line', collapsed ? 'px-3 items-center pt-4' : 'px-3 mt-2')}>
        <NavItem icon={Settings} label="Settings" collapsed={collapsed} active={page.id === 'settings'} onClick={nav('settings')} />
        <NavItem icon={Info} label="About" collapsed={collapsed} active={page.id === 'about'} onClick={nav('about')} />
      </div>
    </aside>
  );
}
