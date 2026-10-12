import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Persister } from '@tanstack/react-query-persist-client';

/** Keep read models around so a reload / offline return does not blank the UI. */
export const QUERY_GC_TIME = 1000 * 60 * 60 * 24; // 24h
export const QUERY_STALE_TIME = 1000 * 60 * 5; // 5m
export const QUERY_CACHE_KEY = 'ct-query-cache-v2';
export const QUERY_CACHE_MAX_AGE = QUERY_GC_TIME;

const PERSISTED_ROOT_KEYS = new Set([
  'home-cartelera',
  'total-artists',
  'explorar',
  'artist-profile',
  'artist-pools',
  'artist-reels',
  'artist-posts',
  'owned-artist',
  'pool',
]);

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        networkMode: 'offlineFirst',
        retry: 1,
      },
    },
  });
}

export function createAppPersister(): Persister {
  return createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: QUERY_CACHE_KEY,
    throttleTime: 1000,
  });
}

export function shouldPersistQuery(query: { queryKey: readonly unknown[]; state: { status: string } }): boolean {
  if (query.state.status !== 'success') return false;
  const root = query.queryKey[0];
  return typeof root === 'string' && PERSISTED_ROOT_KEYS.has(root);
}
