# Troubleshooting

Every `AppError` code. Symptom is what the user sees (es-AR). Cause/fix are for logs (`hint`). Look at the JSON line with the same `requestId` (header `x-request-id` and body `requestId`).

## TX_USER_REJECTED

- Symptom: “Cancelaste la firma. No se mandó nada.”
- Cause: Wallet/Privy returned 4001 / UserRejectedRequestError.
- Fix: Ask them to sign again. Nothing was broadcast.
- Where: web `tx_failed` log, `useTx` phase `failed`.

## TX_INSUFFICIENT_FUNDS

- Symptom: “No hay suficiente MON para el depósito y el costo de red.”
- Cause: Balance < value + gas.
- Fix: Monad faucet, then retry.
- Where: web `decodeContractError`, artist page faucet hint.

## WRONG_CHAIN

- Symptom: “Estás en otra red. Cambiá a Monad Testnet.”
- Cause: chainId !== 10143.
- Fix: Switch the embedded wallet / wagmi to Monad testnet.
- Where: web `useTx` context.chainId.

## RPC_TIMEOUT

- Symptom: “La red tardó demasiado…”
- Cause: RPC timeout / AbortError.
- Fix: Check `MONAD_RPC_URL` / `VITE_MONAD_RPC_URL`. Retry. Indexer uses backoff.
- Where: web fetch/tx logs; api health `dependencies.rpc`; indexer `withRpcRetry`.

## VALIDATION_FAILED

- Symptom: “Revisá los datos. Algo no cierra.”
- Cause: class-validator / Zod rejected the payload.
- Fix: Read `context.fields` and the DTO.
- Where: api exception filter, `POST /api/pools/register`.

## AUTH_INVALID_SIWE

- Symptom: “No pudimos validar tu sesión.”
- Cause: SIWE nonce/signature mismatch (this app uses Privy, not SIWE).
- Fix: Treat as a stale session; sign in again with email/Google.
- Where: api filter (SIWE-shaped errors / 403 indexer secret in production).

## UPLOAD_INVALID_TYPE

- Symptom: “Ese tipo de archivo no se puede subir.”
- Cause: MIME outside jpeg/png/gif/webp/mp4.
- Fix: Convert the file and retry.
- Where: api filter `invalid mime` / `unsupported media`.

## UPLOAD_TOO_LARGE

- Symptom: “El archivo pesa de más.”
- Cause: Over 8 MiB or a video longer than 10s.
- Fix: Compress or trim.
- Where: api `PayloadTooLargeException`, `FST_REQ_FILE_TOO_LARGE`. Never logged as a raw body.

## DB_UNAVAILABLE

- Symptom: “El registro está en pausa…”
- Cause: Prisma cannot reach Postgres (P1001/P1017/init).
- Fix: Check `DATABASE_URL` and that Postgres is up.
- Where: `GET /api/health` `dependencies.db`, exception filter.

## DB_CONSTRAINT

- Symptom: “Ese dato ya está cargado o no existe.”
- Cause: Prisma P2002 / P2025 or Nest `NotFoundException`.
- Fix: Inspect `context.target` / `context.model`.
- Where: api artists/pools services.

## INDEXER_DECODE_FAILED

- Symptom: “El archivo on-chain no se pudo leer completo.”
- Cause: Event decode missing args.
- Fix: Log `txHash` + `logIndex`, compare ABI, resync that block.
- Where: `IndexerService.decodeFail`.

## INDEXER_LAG

- Symptom: “El archivo va un poco atrasado…”
- Cause: `chainHead - lastProcessedBlock` is high, or head < cursor (reorg).
- Fix: Check eth_getLogs 100-block limit and backoff. Cursor is not rewound on reorg.
- Where: indexer `runChunk` warn line; `GET /api/health` indexer lag.

## RATE_LIMITED

- Symptom: “Vas muy rápido…”
- Cause: Nest Throttler 10 req / 60s.
- Fix: Wait a minute.
- Where: api filter, 429.

## UNKNOWN

- Symptom: “Pasó algo inesperado…”
- Cause: No mapper matched.
- Fix: Follow `requestId` in web and api logs, then the original `cause`.
- Where: both layers.

## CONTRACT_REVERT_ArtistDoesNotExist

- Symptom: “Ese artista no existe.”
- Cause: Artist id missing on-chain.
- Fix: Check the URL id and indexer lag.
- Where: `artistOf` / `signBelief` revert. Tests: `Cazatalentos.t.sol`.

## CONTRACT_REVERT_EmptyMetadataURI

- Symptom: “El nombre del perfil no puede quedar vacío.”
- Cause: `registerArtist` got `""`.
- Fix: Send a non-empty name.
- Where: contract + register modal.

## CONTRACT_REVERT_ArtistOwnerCannotSign

- Symptom: “No podés dejar tu marca en tu propio perfil.”
- Cause: Owner called `signBelief`.
- Fix: Use another account.
- Where: `signBelief`.

## CONTRACT_REVERT_AlreadySigned

- Symptom: “Ya dejaste tu marca en este artista.”
- Cause: `supporterOf.rank > 0`.
- Fix: Do not call `signBelief` twice.
- Where: `signBelief`. Foundry: `vm.expectRevert(abi.encodeWithSelector(AlreadySigned...))`.

## CONTRACT_REVERT_InsufficientStake

- Symptom: “El depósito de respaldo es más chico que el mínimo.”
- Cause: `msg.value < MIN_STAKE`.
- Fix: Send at least 0.001 MON plus gas.
- Where: `signBelief`.

## CONTRACT_REVERT_InvalidParameter

- Symptom: “Hay un dato inválido en la operación.”
- Cause: `InvalidParameter(name)`.
- Fix: Inspect the `name` arg (amount, rank, status, constructor).
- Where: constructor, `openPool`, `reclaimPool`, `weightForRank`.

## CONTRACT_REVERT_NotArtistOwner

- Symptom: “Solo el dueño de este perfil puede hacer eso.”
- Cause: `msg.sender != owner`.
- Fix: Switch to the owner account.
- Where: `openPool`, `claimMilestone`, `reclaimPool`.

## CONTRACT_REVERT_NoSupportersYet

- Symptom: “Todavía no hay pioneros; no se puede abrir un pozo.”
- Cause: `supporterCount == 0`.
- Fix: Wait for a `signBelief`.
- Where: `openPool`.

## CONTRACT_REVERT_InvalidDeadline

- Symptom: “La fecha límite del pozo no entra en la ventana permitida.”
- Cause: deadline not in `(now, now+90d]`.
- Fix: Pick a date inside 90 days.
- Where: `openPool`.

## CONTRACT_REVERT_PoolDoesNotExist

- Symptom: “Ese pozo no existe.”
- Cause: Unknown `poolId`.
- Fix: Check the route id.
- Where: pool writes/views.

## CONTRACT_REVERT_PoolNotOpen

- Symptom: “Este pozo ya no está abierto.”
- Cause: `claimMilestone` while status != Open.
- Fix: Only declare a milestone on an Open pool.
- Where: `claimMilestone`.

## CONTRACT_REVERT_PoolNotClaimed

- Symptom: “Este pozo todavía no está en votación.”
- Cause: vote/finalize while status != Claimed.
- Fix: Wait for the artist to declare the milestone.
- Where: `vote`, `finalize`.

## CONTRACT_REVERT_PoolNotApproved

- Symptom: “Este pozo no está aprobado, no se puede cobrar.”
- Cause: `claimReward` while status != Approved.
- Fix: Wait for an approved finalize.
- Where: `claimReward`.

## CONTRACT_REVERT_NotEligible

- Symptom: “No llegaste a tiempo para participar de este pozo.”
- Cause: rank == 0 or rank > supportersAtOpen.
- Fix: Only pioneers present at open can vote/claim.
- Where: `vote`, `claimReward`.

## CONTRACT_REVERT_AlreadyVoted

- Symptom: “Ya votaste en este pozo.”
- Cause: `hasVoted` is true.
- Fix: One vote per address.
- Where: `vote`.

## CONTRACT_REVERT_AlreadyClaimed

- Symptom: “Ya cobraste tu parte de este pozo.”
- Cause: `hasClaimed` is true.
- Fix: Do not claim twice.
- Where: `claimReward`.

## CONTRACT_REVERT_VotingClosed

- Symptom: “La votación de este pozo ya cerró.”
- Cause: `timestamp >= voteEnd`.
- Fix: Call `finalize` instead of `vote`.
- Where: `vote`.

## CONTRACT_REVERT_VotingStillOpen

- Symptom: “La votación todavía está abierta.”
- Cause: `finalize` before `voteEnd`.
- Fix: Wait, or use the DEV +48h local preview (no tx).
- Where: `finalize`.

## CONTRACT_REVERT_DeadlinePassed

- Symptom: “Se pasó la fecha para declarar el hito.”
- Cause: `claimMilestone` after deadline.
- Fix: Reclaim if still Open and expired.
- Where: `claimMilestone`.

## CONTRACT_REVERT_HasActivePools

- Symptom: “Todavía hay un pozo activo; no se puede retirar el respaldo.”
- Cause: Open/Claimed pools exist.
- Fix: Finalize or reclaim first.
- Where: `withdrawStake`.

## CONTRACT_REVERT_NothingToWithdraw

- Symptom: “No hay un depósito para retirar.”
- Cause: `stake == 0`.
- Fix: They never signed or already withdrew.
- Where: `withdrawStake`.

## CONTRACT_REVERT_TransferFailed

- Symptom: “No se pudo enviar el MON…”
- Cause: Native transfer returned false.
- Fix: Check the recipient can receive ETH; retry.
- Where: `claimReward`, `reclaimPool`, `withdrawStake`.
