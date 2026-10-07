import { CONTRACT_ERROR_NAMES, type ErrorCode } from './codes';

export type ErrorCopy = {
  userMessage: string;
  hint: string;
};

const CONTRACT_COPY: Record<(typeof CONTRACT_ERROR_NAMES)[number], ErrorCopy> = {
  ArtistDoesNotExist: {
    userMessage: 'Ese artista no existe.',
    hint: 'layer=contract. Artist id is missing on-chain. Check the URL id and indexer lag; do not send 0.',
  },
  EmptyMetadataURI: {
    userMessage: 'El nombre del perfil no puede quedar vacío.',
    hint: 'layer=contract. registerArtist received an empty metadataURI. Send a non-empty name string.',
  },
  ArtistOwnerCannotSign: {
    userMessage: 'No podés dejar tu marca en tu propio perfil.',
    hint: 'layer=contract. Owner called signBelief on their artist. Use a different account.',
  },
  AlreadySigned: {
    userMessage: 'Ya dejaste tu marca en este artista.',
    hint: 'layer=contract. supporterOf.rank > 0. Do not call signBelief twice for the same artist.',
  },
  InsufficientStake: {
    userMessage: 'El depósito de respaldo es más chico que el mínimo.',
    hint: 'layer=contract. msg.value < MIN_STAKE (0.001 MON). Send at least MIN_STAKE plus gas.',
  },
  InvalidParameter: {
    userMessage: 'Hay un dato inválido en la operación.',
    hint: 'layer=contract. InvalidParameter(name). Inspect the name arg (amount, rank, status, constructor).',
  },
  NotArtistOwner: {
    userMessage: 'Solo el dueño de este perfil puede hacer eso.',
    hint: 'layer=contract. msg.sender is not artists[id].owner. Switch to the owner account.',
  },
  NoSupportersYet: {
    userMessage: 'Todavía no hay pioneros; no se puede abrir un pozo.',
    hint: 'layer=contract. openPool requires supporterCount > 0. Wait for a signBelief first.',
  },
  InvalidDeadline: {
    userMessage: 'La fecha límite del pozo no entra en la ventana permitida.',
    hint: 'layer=contract. deadline must be > now and <= now + MAX_POOL_DURATION (90d).',
  },
  PoolDoesNotExist: {
    userMessage: 'Ese pozo no existe.',
    hint: 'layer=contract. poolId was never opened. Check the route id.',
  },
  PoolNotOpen: {
    userMessage: 'Este pozo ya no está abierto.',
    hint: 'layer=contract. claimMilestone only works while status == Open.',
  },
  PoolNotClaimed: {
    userMessage: 'Este pozo todavía no está en votación.',
    hint: 'layer=contract. vote/finalize need status == Claimed.',
  },
  PoolNotApproved: {
    userMessage: 'Este pozo no está aprobado, no se puede cobrar.',
    hint: 'layer=contract. claimReward needs status == Approved.',
  },
  NotEligible: {
    userMessage: 'No llegaste a tiempo para participar de este pozo.',
    hint: 'layer=contract. rank == 0 or rank > supportersAtOpen. Only pioneers at open can vote/claim.',
  },
  AlreadyVoted: {
    userMessage: 'Ya votaste en este pozo.',
    hint: 'layer=contract. hasVoted[pool][caller] is true. One vote per address.',
  },
  AlreadyClaimed: {
    userMessage: 'Ya cobraste tu parte de este pozo.',
    hint: 'layer=contract. hasClaimed[pool][caller] is true.',
  },
  VotingClosed: {
    userMessage: 'La votación de este pozo ya cerró.',
    hint: 'layer=contract. block.timestamp >= voteEnd. Wait for finalize instead of voting.',
  },
  VotingStillOpen: {
    userMessage: 'La votación todavía está abierta.',
    hint: 'layer=contract. finalize before voteEnd. Wait or use the local +48h preview in DEV.',
  },
  DeadlinePassed: {
    userMessage: 'Se pasó la fecha para declarar el hito.',
    hint: 'layer=contract. claimMilestone after deadline. Reclaim if still Open and expired.',
  },
  HasActivePools: {
    userMessage: 'Todavía hay un pozo activo; no se puede retirar el respaldo.',
    hint: 'layer=contract. withdrawStake blocked while Open/Claimed pools exist. Finalize or reclaim first.',
  },
  NothingToWithdraw: {
    userMessage: 'No hay un depósito para retirar.',
    hint: 'layer=contract. supporter.stake == 0. They never signed or already withdrew.',
  },
  TransferFailed: {
    userMessage: 'No se pudo enviar el MON. Probá de nuevo en un momento.',
    hint: 'layer=contract. Native transfer returned false. Check recipient can receive ETH and gas.',
  },
};

export const ERROR_DICTIONARY: Record<ErrorCode, ErrorCopy> = {
  TX_USER_REJECTED: {
    userMessage: 'Cancelaste la firma. No se mandó nada.',
    hint: 'layer=web. Wallet/Privy returned 4001 / UserRejectedRequestError. Ask the user to sign again.',
  },
  TX_INSUFFICIENT_FUNDS: {
    userMessage: 'No hay suficiente MON para el depósito y el costo de red.',
    hint: 'layer=web. Balance < value + gas. Use the Monad faucet, then retry.',
  },
  WRONG_CHAIN: {
    userMessage: 'Estás en otra red. Cambiá a Monad Testnet.',
    hint: 'layer=web. Connected chainId !== 10143. Switch the embedded wallet / wagmi chain.',
  },
  RPC_TIMEOUT: {
    userMessage: 'La red tardó demasiado. Probá de nuevo en un momento.',
    hint: 'layer=web|api. RPC timeout/AbortError. Check MONAD_RPC_URL / VITE_MONAD_RPC_URL and retry with backoff.',
  },
  VALIDATION_FAILED: {
    userMessage: 'Revisá los datos. Algo no cierra.',
    hint: 'layer=api. class-validator / Zod rejected the payload. Read context.fields and the DTO rules.',
  },
  AUTH_INVALID_SIWE: {
    userMessage: 'No pudimos validar tu sesión.',
    hint: 'layer=api. SIWE nonce/signature mismatch. This app uses Privy, not SIWE; treat as stale session.',
  },
  UPLOAD_INVALID_TYPE: {
    userMessage: 'Ese tipo de archivo no se puede subir.',
    hint: 'layer=api. MIME not in the allow-list (image/jpeg, image/png, image/gif, image/webp, video/mp4).',
  },
  UPLOAD_TOO_LARGE: {
    userMessage: 'El archivo pesa de más.',
    hint: 'layer=api. Size exceeds 8 MiB (photo/GIF) or the 10s video cap. Compress or trim, then retry.',
  },
  DB_UNAVAILABLE: {
    userMessage: 'El registro está en pausa. Probá en un rato.',
    hint: 'layer=api. Prisma cannot reach Postgres (P1001/P1017). Check DATABASE_URL and that Postgres is up.',
  },
  DB_CONSTRAINT: {
    userMessage: 'Ese dato ya está cargado o no existe.',
    hint: 'layer=api. Prisma P2002 (unique) or P2025 (not found). Inspect context.target / context.model.',
  },
  INDEXER_DECODE_FAILED: {
    userMessage: 'El archivo on-chain no se pudo leer completo.',
    hint: 'layer=indexer. Event decode failed. Log txHash + logIndex, compare ABI, then resync that block.',
  },
  INDEXER_LAG: {
    userMessage: 'El archivo va un poco atrasado. En un rato se actualiza.',
    hint: 'layer=indexer. chainHead - lastProcessedBlock is high. Check RPC eth_getLogs limits and backoff.',
  },
  RATE_LIMITED: {
    userMessage: 'Vas muy rápido. Esperá un minuto y probá de nuevo.',
    hint: 'layer=api. Nest Throttler (10 req / 60s). Wait or raise the limit for the route.',
  },
  UNKNOWN: {
    userMessage: 'Pasó algo inesperado. Probá de nuevo en un momento.',
    hint: 'layer=unknown. No mapper matched. Inspect requestId in API/web logs and the original cause.',
  },
  CONTRACT_REVERT_ArtistDoesNotExist: CONTRACT_COPY.ArtistDoesNotExist,
  CONTRACT_REVERT_EmptyMetadataURI: CONTRACT_COPY.EmptyMetadataURI,
  CONTRACT_REVERT_ArtistOwnerCannotSign: CONTRACT_COPY.ArtistOwnerCannotSign,
  CONTRACT_REVERT_AlreadySigned: CONTRACT_COPY.AlreadySigned,
  CONTRACT_REVERT_InsufficientStake: CONTRACT_COPY.InsufficientStake,
  CONTRACT_REVERT_InvalidParameter: CONTRACT_COPY.InvalidParameter,
  CONTRACT_REVERT_NotArtistOwner: CONTRACT_COPY.NotArtistOwner,
  CONTRACT_REVERT_NoSupportersYet: CONTRACT_COPY.NoSupportersYet,
  CONTRACT_REVERT_InvalidDeadline: CONTRACT_COPY.InvalidDeadline,
  CONTRACT_REVERT_PoolDoesNotExist: CONTRACT_COPY.PoolDoesNotExist,
  CONTRACT_REVERT_PoolNotOpen: CONTRACT_COPY.PoolNotOpen,
  CONTRACT_REVERT_PoolNotClaimed: CONTRACT_COPY.PoolNotClaimed,
  CONTRACT_REVERT_PoolNotApproved: CONTRACT_COPY.PoolNotApproved,
  CONTRACT_REVERT_NotEligible: CONTRACT_COPY.NotEligible,
  CONTRACT_REVERT_AlreadyVoted: CONTRACT_COPY.AlreadyVoted,
  CONTRACT_REVERT_AlreadyClaimed: CONTRACT_COPY.AlreadyClaimed,
  CONTRACT_REVERT_VotingClosed: CONTRACT_COPY.VotingClosed,
  CONTRACT_REVERT_VotingStillOpen: CONTRACT_COPY.VotingStillOpen,
  CONTRACT_REVERT_DeadlinePassed: CONTRACT_COPY.DeadlinePassed,
  CONTRACT_REVERT_HasActivePools: CONTRACT_COPY.HasActivePools,
  CONTRACT_REVERT_NothingToWithdraw: CONTRACT_COPY.NothingToWithdraw,
  CONTRACT_REVERT_TransferFailed: CONTRACT_COPY.TransferFailed,
};

export function lookupError(code: ErrorCode): ErrorCopy {
  return ERROR_DICTIONARY[code];
}
