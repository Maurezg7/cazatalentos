import type { QueryClient } from '@tanstack/react-query';
import { API_BASE, fetchArtistPools, fetchArtistProfile } from './api';
import { fetchExplorar } from '../explorar/fetch';
import type { ConsultaExplorar } from '../explorar/tipos';
import { QUERY_STALE_TIME } from './query-persist';

export const HOME_CARTELERA: ConsultaExplorar = {
  q: '',
  ciudades: [],
  generos: [],
  estados: [],
  orden: 'pioneros',
  vista: 'grilla',
  pagina: 1,
};

/** Wake the API (Render cold start) and refresh home cache when online. */
export function warmAppData(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    queryKey: ['home-cartelera'],
    queryFn: () => fetchExplorar(HOME_CARTELERA),
    staleTime: QUERY_STALE_TIME,
  });
  // Fire-and-forget ping so the first user-facing request is warmer.
  void fetch(`${API_BASE}/api/artists?orden=pioneros&pagina=1`, {
    method: 'GET',
    headers: { 'x-request-id': `warm-${Date.now()}` },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => undefined);
}

export function prefetchArtist(queryClient: QueryClient, artistId: number): void {
  if (!Number.isFinite(artistId) || artistId <= 0) return;
  const key = artistId.toString();
  void queryClient.prefetchQuery({
    queryKey: ['artist-profile', key],
    queryFn: () => fetchArtistProfile(artistId),
    staleTime: QUERY_STALE_TIME,
  });
  void queryClient.prefetchQuery({
    queryKey: ['artist-pools', key],
    queryFn: () => fetchArtistPools(artistId),
    staleTime: QUERY_STALE_TIME,
  });
}
