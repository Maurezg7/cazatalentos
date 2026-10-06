import { sha256, stringToBytes, type Hex } from 'viem';

export type WriteAction = 'profile' | 'post' | 'reel';

export function contentHash(parts: Record<string, string>): Hex {
  const text = Object.keys(parts)
    .sort()
    .map((key) => `${key}\n${parts[key]}`)
    .join('\n');
  return sha256(stringToBytes(text));
}

export function writeAuthMessage(
  artistId: number,
  action: WriteAction,
  issuedAt: number,
  hash: Hex,
): string {
  return `Cazatalentos\nartist:${artistId}\naction:${action}\nissuedAt:${issuedAt}\ncontent:${hash}`;
}
