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

export async function fetchArtistProfile(id: number): Promise<ArtistProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/artists/${id}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as ArtistProfile;
  } catch {
    return null;
  }
}
