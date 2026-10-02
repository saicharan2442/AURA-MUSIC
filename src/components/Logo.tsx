export function Logo({ size = 34, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0"
      style={{
        width: size, height: size,
        filter: glow ? 'drop-shadow(0 10px 22px color-mix(in srgb, var(--accent) 50%, transparent))' : undefined,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <defs>
          <linearGradient id="aura-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="1" style={{ stopColor: 'var(--accent2)' }} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#aura-mark)" />
        <g style={{ fill: 'var(--bg)' }}>
          <rect x="6.5" y="12" width="4" height="9" rx="2" />
          <rect x="14" y="6.5" width="4" height="19" rx="2" />
          <rect x="21.5" y="10" width="4" height="13" rx="2" />
        </g>
      </svg>
    </span>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`display font-bold uppercase text-main ${className}`} style={{ letterSpacing: '0.26em', fontSize: 13 }}>
      Aura
    </span>
  );
}
