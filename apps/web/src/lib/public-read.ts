import { createPublicClient, http } from 'viem';
import { CAZATALENTOS_ABI, CAZATALENTOS_ADDRESS } from './contracts';
import { monadTestnet } from './chain';

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(import.meta.env.VITE_MONAD_RPC_URL),
});

export function readTotalArtists(): Promise<bigint> {
  return client.readContract({
    address: CAZATALENTOS_ADDRESS,
    abi: CAZATALENTOS_ABI,
    functionName: 'totalArtists',
  }) as Promise<bigint>;
}
