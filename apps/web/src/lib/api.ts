const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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
};

export async function fetchArtistProfile(id: number): Promise<ArtistProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/artists/${id}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as ArtistProfile;
  } catch {
    return null;
  }
}

export async function registerPoolMetadata(payload: {
  poolId: number;
  artistId: number;
  description: string;
}): Promise<PoolDto | null> {
  try {
    const res = await fetch(`${API_BASE}/api/pools/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as PoolDto;
  } catch {
    return null;
  }
}

export async function fetchPool(id: number): Promise<PoolDto | null> {
  try {
    const res = await fetch(`${API_BASE}/api/pools/${id}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as PoolDto;
  } catch {
    return null;
  }
}

export async function fetchArtistPools(artistId: number): Promise<PoolDto[]> {
  try {
    const res = await fetch(`${API_BASE}/api/artists/${artistId}/pools`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    return (await res.json()) as PoolDto[];
  } catch {
    return [];
  }
}
