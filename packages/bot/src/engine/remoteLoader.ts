import { createHash } from 'node:crypto';
import { evaluateDefinition } from './sandbox.js';
import type { SandboxResult } from './sandbox.js';

type CacheEntry = {
  readonly hash: string;
  readonly result: SandboxResult;
  readonly fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export type LoadResult =
  | SandboxResult
  | { readonly ok: false; readonly error: string };

export async function loadRemoteDefinition(
  url: string,
  allowedDomains: ReadonlyArray<string>,
): Promise<LoadResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const trusted = allowedDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

  if (!trusted) {
    return {
      ok: false,
      error: `Domain "${hostname}" is not in this server's trusted list. An admin can add it with /ui-config trust-domain`,
    };
  }

  let text: string;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Nexus-Bot/1.0' },
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} fetching definition` };
    }

    text = await res.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { ok: false, error: `Failed to fetch: ${message}` };
  }

  const hash = createHash('sha256').update(text).digest('hex');

  const cached = cache.get(url);
  if (
    cached !== undefined &&
    cached.hash === hash &&
    Date.now() - cached.fetchedAt < CACHE_TTL_MS
  ) {
    return cached.result;
  }

  const result = evaluateDefinition(text);
  cache.set(url, { hash, result, fetchedAt: Date.now() });
  return result;
}

export function invalidateCache(url: string): void {
  cache.delete(url);
}
