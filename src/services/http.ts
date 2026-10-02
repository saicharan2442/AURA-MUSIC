import { ProviderError } from './provider';

/* Shared HTTP helpers for provider adapters. */

export async function jget(url: string, timeoutMs = 9000, outer?: AbortSignal): Promise<any> {
  const ctl = new AbortController();
  const t = window.setTimeout(() => ctl.abort(), timeoutMs);
  const onAbort = () => ctl.abort();
  outer?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new ProviderError(`The music service returned ${res.status}`);
    return await res.json();
  } catch (e: any) {
    if (e instanceof ProviderError) throw e;
    if (outer?.aborted) throw new ProviderError('cancelled');
    if (ctl.signal.aborted) throw new ProviderError('The request timed out — check your connection');
    throw new ProviderError('Could not reach the music service');
  } finally {
    window.clearTimeout(t);
    outer?.removeEventListener('abort', onAbort);
  }
}

/* tiny in-memory TTL cache (metadata + artwork only — never audio) */
const memCache = new Map<string, { v: any; exp: number }>();
export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const e = memCache.get(key);
  if (e && e.exp > Date.now()) return Promise.resolve(e.v as T);
  return fn().then((v) => { memCache.set(key, { v, exp: Date.now() + ttlMs }); return v; });
}
