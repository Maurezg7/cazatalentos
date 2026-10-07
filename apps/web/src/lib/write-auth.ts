import { contentHash, writeAuthMessage, type WriteAction } from '@cazatalentos/shared';

export async function signedWrite<T extends Record<string, string>>(
  sign: (args: { message: string }) => Promise<`0x${string}`>,
  artistId: number,
  action: WriteAction,
  parts: T,
): Promise<T & { issuedAt: number; signature: `0x${string}` }> {
  const issuedAt = Date.now();
  const signature = await sign({
    message: writeAuthMessage(artistId, action, issuedAt, contentHash(parts)),
  });
  return { ...parts, issuedAt, signature };
}
