import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, WifiOff, X, type LucideIcon } from 'lucide-react';
import { cx } from '../utils';
import { useSettings } from '../store/settings';

/* ---------------- animation helpers ---------------- */

export function useAnim() {
  const level = useSettings((s) => s.animations);
  const scale = level === 'full' ? 1 : level === 'reduced' ? 0.4 : 0;
  return { level, scale, duration: (d: number) => d * (scale || 0.0001) };
}

export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;

/* ---------------- section header ---------------- */

export function SectionHeader({ title, sub, action, onAction }: { title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className="display text-main font-semibold text-[20px] leading-tight truncate">{title}</h2>
        {sub && <p className="text-dim text-[12.5px] mt-0.5 truncate">{sub}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="text-soft hover:text-acc text-[12.5px] font-semibold tracking-wide transition-colors shrink-0 pb-0.5">
          {action}
        </button>
      )}
    </div>
  );
}

/* ---------------- horizontal scroller ---------------- */

export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 8);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const by = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className={cx('relative group/hs', className)}>
      <div ref={ref} onScroll={update} className="flex gap-5 overflow-x-auto no-scrollbar hscroll-mask px-1 py-1.5">
        {children}
      </div>
      {canL && (
        <button aria-label="Scroll back" onClick={() => by(-1)}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full glass-strong border border-line flex items-center justify-center text-soft hover:text-main opacity-0 group-hover/hs:opacity-100 transition-opacity shadow-lg">
          <ChevronLeft size={18} />
        </button>
      )}
      {canR && (
        <button aria-label="Scroll forward" onClick={() => by(1)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full glass-strong border border-line flex items-center justify-center text-soft hover:text-main opacity-0 group-hover/hs:opacity-100 transition-opacity shadow-lg">
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

/* ---------------- states ---------------- */

export function EmptyState({ icon: Icon, title, sub, action, onAction }: { icon: LucideIcon; title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 rise">
      <div className="w-16 h-16 rounded-2xl bg-card border border-line flex items-center justify-center text-dim mb-5">
        <Icon size={26} strokeWidth={1.6} />
      </div>
      <h3 className="display text-main font-semibold text-[18px]">{title}</h3>
      {sub && <p className="text-dim text-[13px] mt-1.5 max-w-[380px] leading-relaxed">{sub}</p>}
      {action && onAction && <button className="btn btn-accent mt-6" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={RefreshCw}
      title="Connection interrupted"
      sub={message ?? "We couldn't reach the music service. Check your connection and try again."}
      action={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={WifiOff}
      title="You're offline"
      sub="An internet connection is required for online music streaming. Your library, playlists and settings remain available."
      action={onRetry ? 'Retry connection' : undefined}
      onAction={onRetry}
    />
  );
}

/* ---------------- skeletons ---------------- */

export function SkeletonCard({ circle }: { circle?: boolean }) {
  return (
    <div className="w-[168px] shrink-0">
      <div className={cx('skeleton w-[168px] h-[168px]', circle ? 'rounded-full' : 'rounded-2xl')} />
      <div className="skeleton h-3.5 rounded-md mt-3 w-4/5" />
      <div className="skeleton h-3 rounded-md mt-2 w-3/5" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3.5 px-3 py-2.5">
      <div className="skeleton w-11 h-11 rounded-lg" />
      <div className="flex-1 min-w-0">
        <div className="skeleton h-3.5 rounded-md w-1/2" />
        <div className="skeleton h-3 rounded-md w-1/3 mt-2" />
      </div>
      <div className="skeleton h-3 w-9 rounded-md" />
    </div>
  );
}

export function SkeletonRowList({ n = 8 }: { n?: number }) {
  return (
    <div role="status" aria-label="Loading">
      {Array.from({ length: n }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export function SkeletonCards({ n = 7, circle }: { n?: number; circle?: boolean }) {
  return (
    <div className="flex gap-5 overflow-hidden px-1" role="status" aria-label="Loading">
      {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} circle={circle} />)}
    </div>
  );
}

/* ---------------- form primitives ---------------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (b: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      className={cx('switch', checked && 'on')} onClick={() => onChange(!checked)} />
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-card border border-line gap-1">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={cx(
              'h-8 px-3.5 rounded-lg text-[12.5px] font-semibold flex items-center gap-1.5 transition-all',
              value === o.value ? 'bg-elev text-main shadow-sm' : 'text-soft hover:text-main'
            )}>
            {Icon && <Icon size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingRow({ title, sub, children, first }: { title: string; sub?: ReactNode; children: ReactNode; first?: boolean }) {
  return (
    <div className={cx('flex items-center justify-between gap-6 py-4 border-line', !first && 'border-t')}>
      <div className="min-w-0">
        <div className="text-main text-[14px] font-medium">{title}</div>
        {sub && <div className="text-dim text-[12.5px] mt-0.5 leading-relaxed max-w-[480px]">{sub}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-3">{children}</div>
    </div>
  );
}

export function SliderRow({ title, sub, value, min, max, step = 1, onChange, format, first }: {
  title: string; sub?: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string; first?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <SettingRow title={title} sub={sub} first={first}>
      <span className="text-dim text-[12px] font-semibold w-14 text-right">{format ? format(value) : value}</span>
      <input type="range" aria-label={title} className="slider w-40" min={min} max={max} step={step}
        value={value} style={{ '--val': `${pct}%` } as any}
        onChange={(e) => onChange(Number(e.target.value))} />
    </SettingRow>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="px-2 py-1 rounded-md bg-elev border border-line text-[11px] font-semibold text-soft min-w-[26px] text-center inline-block shadow-sm">
      {children}
    </kbd>
  );
}

/* ---------------- modal shell ---------------- */

export function ModalShell({ title, sub, onClose, children, width = 440 }: {
  title: string; sub?: string; onClose: () => void; children: ReactNode; width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog" aria-modal="true" aria-label={title}
        className="relative w-full glass-strong border border-line rounded-3xl p-6 shadow-2xl"
        style={{ maxWidth: width }}
        initial={{ scale: 0.92, y: 18, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 12, opacity: 0 }}
        transition={spring}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="display text-main font-semibold text-[18px]">{title}</h3>
            {sub && <p className="text-dim text-[12.5px] mt-1">{sub}</p>}
          </div>
          <button className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export { AnimatePresence, motion };
