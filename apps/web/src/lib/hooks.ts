import { useEffect, useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { createPublicClient, http, type Address } from 'viem';
import { CAZATALENTOS_ABI, CAZATALENTOS_ADDRESS } from './contracts';
import { monadTestnet } from './chain';

let cachedMinStake: bigint | undefined;
let minStakePromise: Promise<bigint> | undefined;

export async function getMinStake(): Promise<bigint> {
  if (cachedMinStake !== undefined) return cachedMinStake;
  if (!minStakePromise) {
    minStakePromise = (async () => {
      const client = createPublicClient({
        chain: monadTestnet,
        transport: http(import.meta.env.VITE_MONAD_RPC_URL),
      });
      const value = (await client.readContract({
        address: CAZATALENTOS_ADDRESS,
        abi: CAZATALENTOS_ABI,
        functionName: 'MIN_STAKE',
      })) as bigint;
      cachedMinStake = value;
      return value;
    })();
  }
  return minStakePromise;
}

export function useMinStake() {
  const [minStake, setMinStake] = useState<bigint | undefined>(cachedMinStake);

  useEffect(() => {
    let cancelled = false;
    void getMinStake()
      .then((value) => {
        if (!cancelled) setMinStake(value);
      })
      .catch(() => {
        if (!cancelled) setMinStake(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return minStake;
}

export function useArtist(artistId: bigint | undefined) {
  return useReadContract({
    address: CAZATALENTOS_ADDRESS,
    abi: CAZATALENTOS_ABI,
    functionName: 'artistOf',
    args: artistId !== undefined ? ([artistId] as const) : undefined,
    query: { enabled: artistId !== undefined },
  });
}

export function useSupporter(artistId: bigint | undefined, supporter: Address | undefined) {
  return useReadContract({
    address: CAZATALENTOS_ADDRESS,
    abi: CAZATALENTOS_ABI,
    functionName: 'supporterOf',
    args: artistId !== undefined && supporter ? ([artistId, supporter] as const) : undefined,
    query: { enabled: artistId !== undefined && supporter !== undefined },
  });
}

export function useSignBelief() {
  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function sign(artistId: bigint) {
    const minStake = await getMinStake();
    return writeContractAsync({
      address: CAZATALENTOS_ADDRESS,
      abi: CAZATALENTOS_ABI,
      functionName: 'signBelief',
      args: [artistId],
      value: minStake,
    });
  }

  return { sign, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useAccountAddress(): Address | undefined {
  const { address } = useAccount();
  return address;
}
