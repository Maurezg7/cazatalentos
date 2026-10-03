import type { Address } from 'viem';

export { CAZATALENTOS_ABI } from '@cazatalentos/shared';

export const CAZATALENTOS_ADDRESS = import.meta.env.VITE_CAZATALENTOS_ADDRESS as Address;

export type Supporter = {
  rank: number;
  weight: number;
  signedAt: bigint;
  stake: bigint;
};

export type Artist = {
  owner: Address;
  supporterCount: number;
  metadataURI: string;
  exists: boolean;
};
