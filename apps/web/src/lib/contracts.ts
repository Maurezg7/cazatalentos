import { parseAbi, type Address } from 'viem';

export const CAZATALENTOS_ADDRESS = import.meta.env.VITE_CAZATALENTOS_ADDRESS as Address;

/**
 * Hand-written ABI with explicit tuple syntax for struct returns.
 *
 * The forge-exported JSON uses `type: "tuple"` for struct returns, but viem
 * fails to decode structs with dynamic members (string metadataURI) when the
 * ABI declares them as a flat tuple. Solidity emits a leading offset word
 * before the tuple, and viem only consumes it correctly when the return
 * signature uses double parens `((...))`.
 *
 * Do NOT replace this with the JSON import from forge inspect; it will
 * reintroduce the decoding bug.
 */
export const CAZATALENTOS_ABI = parseAbi([
  // ---- Writes ----
  'function registerArtist(string metadataURI) returns (uint256 artistId)',
  'function signBelief(uint256 artistId) payable',
  'function openPool(uint256 artistId, bytes32 milestoneHash, uint64 deadline) payable returns (uint256)',
  'function claimMilestone(uint256 poolId, string evidenceURI)',

  // ---- Struct-returning views (double parens are mandatory) ----
  'function artistOf(uint256 artistId) view returns ((address owner, uint32 supporterCount, string metadataURI, bool exists))',
  'function supporterOf(uint256 artistId, address supporter) view returns ((uint32 rank, uint8 weight, uint64 signedAt, uint256 stake))',

  // ---- Simple views ----
  'function totalArtists() view returns (uint256)',
  'function weightForRank(uint32 rank) pure returns (uint8)',
  'function MIN_STAKE() view returns (uint256)',
  'function poolOf(uint256 poolId) view returns ((uint256 artistId, uint256 amount, bytes32 milestoneHash, uint64 deadline, uint64 voteEnd, uint256 votesFor, uint256 votesAgainst, uint32 supportersAtOpen, uint256 totalWeightAtOpen, uint8 status, string evidenceURI))',
  'function activePoolsByArtist(uint256 artistId) view returns (uint256)',

  // ---- Events ----
  'event ArtistRegistered(uint256 indexed artistId, address indexed owner, string uri)',
  'event BeliefSigned(uint256 indexed artistId, address indexed supporter, uint32 rank, uint8 weight)',
  'event PoolOpened(uint256 indexed poolId, uint256 indexed artistId, uint256 amount, bytes32 milestoneHash, uint64 deadline)',
  'event MilestoneClaimed(uint256 indexed poolId, string evidenceURI, uint64 voteEnd)',
]);

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
