import { log } from './observability/logger';
import { createRequestId } from './observability/request-id';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function apiGet<T>(path: string, fallback: T): Promise<T> {
  const requestId = createRequestId();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'x-request-id': requestId },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      const body = await readErrorBody(res);
      log.warn('api_get_failed', {
        path,
        status: res.status,
        requestId: body.requestId ?? requestId,
        layer: 'api',
        code: body.code ?? 'UNKNOWN',
        cause: body.message,
      });
      return fallback;
    }
    return (await res.json()) as T;
  } catch (error: unknown) {
    log.warn('api_get_error', {
      path,
      requestId,
      layer: 'api',
      cause: error instanceof Error ? error.name : 'unknown',
    });
    return fallback;
  }
}

export type ArtistProfile = {
  id: number;
  owner: string;
  metadataURI: string;
  supporterCount: number;
  displayName: string;
  photo: string | null;
  bio: string | null;
  links: Record<string, string> | null;
};

export type PoolVoteDto = {
  address: string;
  approve: boolean;
  weight: string;
  votedAt: string;
};

export type PoolDto = {
  id: number;
  artistId: number;
  amountWei: string;
  milestoneHash: string;
  deadline: string;
  voteEnd: string | null;
  supportersAtOpen: number;
  totalWeightAtOpen: string;
  status: 'Open' | 'Claimed' | 'Approved' | 'Rejected' | 'Reclaimed';
  evidenceURI: string | null;
  milestoneDescription: string | null;
  votes?: PoolVoteDto[];
};

async function readErrorBody(
  res: Response,
): Promise<{ code?: string; message?: string; requestId?: string }> {
  try {
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return {};
    const record = json as Record<string, unknown>;
    return {
      code: typeof record.code === 'string' ? record.code : undefined,
      message: typeof record.message === 'string' ? record.message : undefined,
      requestId: typeof record.requestId === 'string' ? record.requestId : undefined,
    };
  } catch {
    return {};
  }
}

export async function fetchArtistProfile(id: number): Promise<ArtistProfile | null> {
  return apiGet<ArtistProfile | null>(`/api/artists/${id}`, null);
}

export async function registerPoolMetadata(payload: {
  poolId: number;
  artistId: number;
  description: string;
}): Promise<PoolDto | null> {
  const requestId = createRequestId();
  try {
    const res = await fetch(`${API_BASE}/api/pools/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': requestId },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      const body = await readErrorBody(res);
      log.warn('api_post_failed', {
        path: '/api/pools/register',
        status: res.status,
        requestId: body.requestId ?? requestId,
        layer: 'api',
        code: body.code ?? 'UNKNOWN',
        cause: body.message,
        hint: 'Check AllExceptionsFilter JSON for this requestId.',
      });
      return null;
    }
    return (await res.json()) as PoolDto;
  } catch (error: unknown) {
    log.warn('api_post_error', {
      path: '/api/pools/register',
      requestId,
      layer: 'api',
      cause: error instanceof Error ? error.name : 'unknown',
    });
    return null;
  }
}

export async function fetchPool(id: number): Promise<PoolDto | null> {
  return apiGet<PoolDto | null>(`/api/pools/${id}`, null);
}

export async function fetchArtistPools(artistId: number): Promise<PoolDto[]> {
  return apiGet<PoolDto[]>(`/api/artists/${artistId}/pools`, []);
}
