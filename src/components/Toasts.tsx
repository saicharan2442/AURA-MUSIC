import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useUI } from '../store/ui';
import { Artwork } from './Artwork';

/* In-app toast notifications — also used as "Now Playing" alerts. */

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);

  return (
    <div className="fixed left-4 bottom-[calc(var(--player-h)+14px)] z-[88] flex flex-col gap-2.5 pointer-events-none" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: -26, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -18, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 480, damping: 34 }}
            className="pointer-events-auto w-[320px] glass-strong border border-line rounded-2xl px-3.5 py-3 shadow-2xl flex items-center gap-3"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: t.kind === 'error' ? '#ff5f57' : t.kind === 'success' ? 'var(--accent)' : 'var(--accent2)' }}
            />
            {t.art && <Artwork src={t.art} seed={t.title} alt="" className="w-9 h-9 rounded-lg shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-main truncate leading-tight">{t.title}</p>
              {t.sub && <p className="text-[11.5px] text-dim truncate mt-0.5">{t.sub}</p>}
            </div>
            <button className="icon-btn !w-7 !h-7 shrink-0" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
