export const ERROR_LAYERS = ['web', 'api', 'contract', 'indexer'] as const;
export type ErrorLayer = (typeof ERROR_LAYERS)[number];

export const CONTRACT_ERROR_NAMES = [
  'ArtistDoesNotExist',
  'EmptyMetadataURI',
  'ArtistOwnerCannotSign',
  'AlreadySigned',
  'InsufficientStake',
  'InvalidParameter',
  'NotArtistOwner',
  'NoSupportersYet',
  'InvalidDeadline',
  'PoolDoesNotExist',
  'PoolNotOpen',
  'PoolNotClaimed',
  'PoolNotApproved',
  'NotEligible',
  'AlreadyVoted',
  'AlreadyClaimed',
  'VotingClosed',
  'VotingStillOpen',
  'DeadlinePassed',
  'HasActivePools',
  'NothingToWithdraw',
  'TransferFailed',
] as const;

export type ContractErrorName = (typeof CONTRACT_ERROR_NAMES)[number];

export const CONTRACT_REVERT_CODES = CONTRACT_ERROR_NAMES.map(
  (name) => `CONTRACT_REVERT_${name}` as const,
);

export const ERROR_CODES = [
  'TX_USER_REJECTED',
  'TX_INSUFFICIENT_FUNDS',
  'WRONG_CHAIN',
  'RPC_TIMEOUT',
  'VALIDATION_FAILED',
  'AUTH_INVALID_SIWE',
  'UPLOAD_INVALID_TYPE',
  'UPLOAD_TOO_LARGE',
  'DB_UNAVAILABLE',
  'DB_CONSTRAINT',
  'INDEXER_DECODE_FAILED',
  'INDEXER_LAG',
  'RATE_LIMITED',
  'UNKNOWN',
  ...CONTRACT_REVERT_CODES,
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function contractRevertCode(name: string): ErrorCode {
  const match = CONTRACT_REVERT_CODES.find((code) => code === `CONTRACT_REVERT_${name}`);
  return match ?? 'UNKNOWN';
}

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}
