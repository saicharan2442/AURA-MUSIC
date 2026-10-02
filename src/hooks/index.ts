import { useCallback, useEffect, useRef, useState } from 'react';
import { getPalette, type Palette } from '../utils';

/* ---------------- debounce ---------------- */

export function useDebounce<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ---------------- async data loader ---------------- */

interface AsyncState<T> { data: T | null; error: string | null; loading: boolean; }

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[]): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const ctl = new AbortController();
    setState((s) => ({ data: s.data, error: null, loading: true }));
    fnRef.current(ctl.signal)
      .then((data) => { if (!ctl.signal.aborted) setState({ data, error: null, loading: false }); })
      .catch((e: any) => { if (!ctl.signal.aborted) setState({ data: null, error: e?.message ?? 'Something went wrong', loading: false }); });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

/* ---------------- dynamic artwork palette ---------------- */

export function usePalette(artwork: string | undefined, seed: string): Palette | null {
  const [pal, setPal] = useState<Palette | null>(null);
  useEffect(() => {
    let live = true;
    setPal(null);
    getPalette(artwork, seed).then((p) => { if (live) setPal(p); });
    return () => { live = false; };
  }, [artwork, seed]);
  return pal;
}

/* ---------------- online status ---------------- */

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/* ---------------- viewport size ---------------- */

export function useIsNarrow(breakpoint = 900): boolean {
  const [narrow, setNarrow] = useState<boolean>(window.innerWidth < breakpoint);
  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, [breakpoint]);
  return narrow;
}
