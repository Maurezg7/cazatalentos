import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useAccount,
  usePublicClient,
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

export function useRegisterArtist() {
  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function register(metadataURI: string) {
    return writeContractAsync({
      address: CAZATALENTOS_ADDRESS,
      abi: CAZATALENTOS_ABI,
      functionName: 'registerArtist',
      args: [metadataURI],
    });
  }

  return { register, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRecentRegisteredArtist(owner: Address | undefined) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['recent-registered-artist', owner],
    enabled: Boolean(owner && publicClient),
    staleTime: 15_000,
    queryFn: async (): Promise<bigint | null> => {
      if (!publicClient || !owner) return null;
      const toBlock = await publicClient.getBlockNumber();
      const fromBlock = toBlock > 99n ? toBlock - 99n : 0n;
      const logs = await publicClient.getContractEvents({
        address: CAZATALENTOS_ADDRESS,
        abi: CAZATALENTOS_ABI,
        eventName: 'ArtistRegistered',
        args: { owner },
        fromBlock,
        toBlock,
      });
      const last = logs.at(-1);
      return last?.args.artistId ?? null;
    },
  });
}

export function useOpenPool() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function open(args: {
    artistId: bigint;
    milestoneHash: `0x${string}`;
    deadline: bigint;
    value: bigint;
  }) {
    return writeContractAsync({
      address: CAZATALENTOS_ADDRESS,
      abi: CAZATALENTOS_ABI,
      functionName: 'openPool',
      args: [args.artistId, args.milestoneHash, args.deadline],
      value: args.value,
    });
  }

  return { open, hash, isPending, isConfirming, isSuccess, receipt };
}

export function useClaimMilestone() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claim(poolId: bigint, evidenceURI: string) {
    return writeContractAsync({
      address: CAZATALENTOS_ADDRESS,
      abi: CAZATALENTOS_ABI,
      functionName: 'claimMilestone',
      args: [poolId, evidenceURI],
    });
  }

  return { claim, hash, isPending, isConfirming, isSuccess };
}

const POOL_STATUSES = ['Open', 'Claimed', 'Approved', 'Rejected', 'Reclaimed'] as const;

export type OnChainPool = {
  artistId: bigint;
  amount: bigint;
  milestoneHash: `0x${string}`;
  deadline: bigint;
  voteEnd: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  supportersAtOpen: number;
  totalWeightAtOpen: bigint;
  status: number;
  statusName: (typeof POOL_STATUSES)[number];
  evidenceURI: string;
};

export function usePool(poolId: bigint | undefined) {
  const query = useReadContract({
    address: CAZATALENTOS_ADDRESS,
    abi: CAZATALENTOS_ABI,
    functionName: 'poolOf',
    args: poolId !== undefined ? ([poolId] as const) : undefined,
    query: { enabled: poolId !== undefined },
  });

  const pool: OnChainPool | undefined = query.data
    ? {
        artistId: query.data.artistId,
        amount: query.data.amount,
        milestoneHash: query.data.milestoneHash,
        deadline: query.data.deadline,
        voteEnd: query.data.voteEnd,
        votesFor: query.data.votesFor,
        votesAgainst: query.data.votesAgainst,
        supportersAtOpen: Number(query.data.supportersAtOpen),
        totalWeightAtOpen: query.data.totalWeightAtOpen,
        status: Number(query.data.status),
        statusName: POOL_STATUSES[Number(query.data.status)] ?? 'Open',
        evidenceURI: query.data.evidenceURI,
      }
    : undefined;

  return { ...query, pool };
}

export function useActivePoolsByArtist(artistId: bigint | undefined) {
  return useReadContract({
    address: CAZATALENTOS_ADDRESS,
    abi: CAZATALENTOS_ABI,
    functionName: 'activePoolsByArtist',
    args: artistId !== undefined ? ([artistId] as const) : undefined,
    query: { enabled: artistId !== undefined },
  });
}
