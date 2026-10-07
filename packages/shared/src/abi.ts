import { parseAbi } from 'viem';

/**
 * Hand-written human-readable ABI. Struct returns use double parens so viem
 * consumes the Solidity offset word. Do not replace with raw `forge inspect`
 * JSON — that reintroduces the metadataURI decode bug.
 *
 * Custom-error signatures match the deployed Monad testnet contract
 * (artistId/poolId first, then address). Do not flip argument order.
 */
export const CAZATALENTOS_ABI_STRINGS = [
  'function registerArtist(string metadataURI) returns (uint256 artistId)',
  'function signBelief(uint256 artistId) payable',
  'function openPool(uint256 artistId, bytes32 milestoneHash, uint64 deadline) payable returns (uint256)',
  'function claimMilestone(uint256 poolId, string evidenceURI)',
  'function vote(uint256 poolId, bool approve)',
  'function finalize(uint256 poolId)',
  'function claimReward(uint256 poolId)',
  'function reclaimPool(uint256 poolId)',
  'function withdrawStake(uint256 artistId)',
  'function artistOf(uint256 artistId) view returns ((address owner, uint32 supporterCount, string metadataURI, bool exists))',
  'function supporterOf(uint256 artistId, address supporter) view returns ((uint32 rank, uint8 weight, uint64 signedAt, uint256 stake))',
  'function totalArtists() view returns (uint256)',
  'function totalPools() view returns (uint256)',
  'function weightForRank(uint32 rank) pure returns (uint8)',
  'function weightSumUpTo(uint32 count) pure returns (uint256)',
  'function MIN_STAKE() view returns (uint256)',
  'function poolOf(uint256 poolId) view returns ((uint256 artistId, uint256 amount, bytes32 milestoneHash, uint64 deadline, uint64 voteEnd, uint256 votesFor, uint256 votesAgainst, uint32 supportersAtOpen, uint256 totalWeightAtOpen, uint8 status, string evidenceURI))',
  'function activePoolsByArtist(uint256 artistId) view returns (uint256)',
  'function hasVoted(uint256 poolId, address supporter) view returns (bool)',
  'function hasClaimed(uint256 poolId, address supporter) view returns (bool)',
  'error ArtistDoesNotExist(uint256 artistId)',
  'error EmptyMetadataURI()',
  'error ArtistOwnerCannotSign(uint256 artistId, address owner)',
  'error AlreadySigned(uint256 artistId, address supporter)',
  'error InsufficientStake(uint256 provided, uint256 required)',
  'error InvalidParameter(string name)',
  'error NotArtistOwner(uint256 artistId, address caller)',
  'error NoSupportersYet(uint256 artistId)',
  'error InvalidDeadline(uint64 deadline, uint64 maxAllowed)',
  'error PoolDoesNotExist(uint256 poolId)',
  'error PoolNotOpen(uint256 poolId, uint8 current)',
  'error PoolNotClaimed(uint256 poolId, uint8 current)',
  'error PoolNotApproved(uint256 poolId, uint8 current)',
  'error NotEligible(uint256 poolId, address caller)',
  'error AlreadyVoted(uint256 poolId, address caller)',
  'error AlreadyClaimed(uint256 poolId, address caller)',
  'error VotingClosed(uint256 poolId, uint64 voteEnd)',
  'error VotingStillOpen(uint256 poolId, uint64 voteEnd)',
  'error DeadlinePassed(uint256 poolId, uint64 deadline)',
  'error HasActivePools(uint256 artistId, uint256 activeCount)',
  'error NothingToWithdraw(uint256 artistId, address supporter)',
  'error TransferFailed(address to, uint256 amount)',
  'event ArtistRegistered(uint256 indexed artistId, address indexed owner, string uri)',
  'event BeliefSigned(uint256 indexed artistId, address indexed supporter, uint32 rank, uint8 weight)',
  'event PoolOpened(uint256 indexed poolId, uint256 indexed artistId, uint256 amount, bytes32 milestoneHash, uint64 deadline)',
  'event MilestoneClaimed(uint256 indexed poolId, string evidenceURI, uint64 voteEnd)',
  'event Voted(uint256 indexed poolId, address indexed supporter, bool approve, uint256 weight)',
  'event PoolFinalized(uint256 indexed poolId, uint8 status)',
  'event RewardClaimed(uint256 indexed poolId, address indexed supporter, uint256 amount)',
  'event PoolReclaimed(uint256 indexed poolId, address indexed artist, uint256 amount)',
  'event StakeWithdrawn(uint256 indexed artistId, address indexed supporter, uint256 amount)',
] as const;

export const CAZATALENTOS_ABI = parseAbi(CAZATALENTOS_ABI_STRINGS);
