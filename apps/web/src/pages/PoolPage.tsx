import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAccount, useBlock, usePublicClient } from 'wagmi';
import { fetchPool } from '../lib/api';
import { CAZATALENTOS_ABI, CAZATALENTOS_ADDRESS } from '../lib/contracts';
import { ActionButton } from '../components/ActionButton';
import { DeclareMilestoneForm } from '../components/DeclareMilestoneForm';
import { DevTimeTravel, readSimulatedOffset, TIME_TRAVEL_EVENT } from '../components/DevTimeTravel';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PoolResultCard } from '../components/PoolResultCard';
import { VoteCard } from '../components/VoteCard';
import { formatDeadline, formatMON, poolStatusColor, poolStatusLabel, shortHash } from '../lib/format';
import {
  useArtist,
  useClaimReward,
  useFinalize,
  useHasClaimed,
  useHasVoted,
  usePool,
  useReclaimPool,
  useSupporter,
} from '../lib/hooks';
import { isVotingStillOpenError } from '../lib/write-error';

function parsePoolId(raw: string | undefined): bigint | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  try {
    const value = BigInt(raw);
    return value > 0n ? value : undefined;
  } catch {
    return undefined;
  }
}

export function PoolPage() {
  const { id } = useParams<{ id: string }>();
  const poolId = parsePoolId(id);
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: block } = useBlock();
  const chain = usePool(poolId);
  const artistId = chain.pool?.artistId;
  const artistQuery = useArtist(artistId);
  const supporterQuery = useSupporter(artistId, address);
  const hasVotedQuery = useHasVoted(poolId, address);
  const hasClaimedQuery = useHasClaimed(poolId, address);
  const { finalize, isPending: finalizePending, isConfirming: finalizeConfirming, reset: resetFinalize } =
    useFinalize();
  const { claim, isPending: claimPending, isConfirming: claimConfirming, reset: resetClaim } = useClaimReward();
  const { reclaim, isPending: reclaimPending, isConfirming: reclaimConfirming, reset: resetReclaim } =
    useReclaimPool();
  const [simOffset, setSimOffset] = useState(() => readSimulatedOffset());
  const [actionError, setActionError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['pool', id],
    queryFn: () => fetchPool(Number(poolId)),
    enabled: poolId !== undefined,
  });

  useEffect(() => {
    function onTravel() {
      setSimOffset(readSimulatedOffset());
      setActionError(null);
    }
    window.addEventListener(TIME_TRAVEL_EVENT, onTravel);
    return () => {
      window.removeEventListener(TIME_TRAVEL_EVENT, onTravel);
    };
  }, []);

  if (poolId === undefined) {
    return (
      <ErrorState
        title="Ese pozo no existe."
        message="El link tiene que terminar con un número de pozo válido."
      />
    );
  }

  if (chain.isLoading) {
    return <LoadingState label="Buscando el pozo…" />;
  }

  const resolvedPoolId = poolId;

  if (chain.isError || !chain.pool) {
    return (
      <ErrorState
        title="No encontramos ese pozo"
        message="Puede que el link esté mal o que todavía no esté confirmado."
        onRetry={() => {
          void chain.refetch();
        }}
      />
    );
  }

  const pool = chain.pool;
  const artist = artistQuery.data;
  const supporter = supporterQuery.data;
  const isOwner = Boolean(
    address && artist?.exists && address.toLowerCase() === artist.owner.toLowerCase(),
  );
  const userRank = supporter && supporter.rank > 0 ? supporter.rank : undefined;
  const isEligibleSupporter = Boolean(
    userRank !== undefined && userRank <= pool.supportersAtOpen,
  );
  const blockTimestamp = block?.timestamp;
  const effectiveNow = blockTimestamp !== undefined ? blockTimestamp + simOffset : undefined;
  const deadlinePassed = effectiveNow !== undefined && effectiveNow > pool.deadline;
  const canDeclare = pool.status === 0 && isOwner && !deadlinePassed && effectiveNow !== undefined;
  const canReclaimExpiredOpen = pool.status === 0 && isOwner && deadlinePassed && simOffset === 0n;
  const voteClosed = effectiveNow !== undefined && effectiveNow >= pool.voteEnd;
  const preview = previewFinalize(pool);
  const description = profileQuery.data?.milestoneDescription;
  const finalizeBusy = finalizePending || finalizeConfirming;
  const claimBusy = claimPending || claimConfirming;
  const reclaimBusy = reclaimPending || reclaimConfirming;
  const isSettled = pool.status === 2 || pool.status === 3 || pool.status === 4;
  const previewSettled = pool.status === 1 && voteClosed && simOffset > 0n;
  const showSettledLayout = isSettled || previewSettled;
  const settledStatus = isSettled ? pool.status : preview.status;
  const deadlineYear = new Date(Number(pool.deadline) * 1000).getFullYear();
  const pioneerChip =
    pool.supportersAtOpen === 1 ? '1 pionero' : `${pool.supportersAtOpen} pioneros`;

  async function refresh() {
    void chain.refetch();
    void hasVotedQuery.refetch();
    void hasClaimedQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: ['pool', id] });
  }

  async function handleFinalize() {
    if (simOffset > 0n) {
      return;
    }
    setActionError(null);
    resetFinalize();
    const stillOpenMessage =
      'Todavía no se puede cerrar: la ventana de votación sigue abierta en la red.';
    try {
      if (publicClient && address) {
        try {
          await publicClient.simulateContract({
            address: CAZATALENTOS_ADDRESS,
            abi: CAZATALENTOS_ABI,
            functionName: 'finalize',
            args: [resolvedPoolId],
            account: address,
          });
        } catch (simulateError) {
          setActionError(
            isVotingStillOpenError(simulateError)
              ? stillOpenMessage
              : 'No se pudo cerrar la votación. Probá de nuevo.',
          );
          return;
        }
      }
      const hash = await finalize(resolvedPoolId);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refresh();
    } catch (error) {
      if (isVotingStillOpenError(error)) {
        setActionError(stillOpenMessage);
        return;
      }
      setActionError('No se pudo cerrar la votación. Probá de nuevo.');
    }
  }

  async function handleClaimReward() {
    setActionError(null);
    resetClaim();
    try {
      const hash = await claim(resolvedPoolId);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refresh();
    } catch {
      setActionError('No se pudo reclamar. Probá de nuevo en un momento.');
    }
  }

  async function handleReclaim() {
    setActionError(null);
    resetReclaim();
    try {
      const hash = await reclaim(resolvedPoolId);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refresh();
    } catch {
      setActionError('No se pudo recuperar el pozo. Probá de nuevo en un momento.');
    }
  }

  return (
    <section className="flex flex-col gap-6 pb-6 pt-3 lg:gap-8 lg:pb-10 lg:pt-6">
      <h1 className="font-serif text-xl italic text-on-surface lg:text-2xl">Detalle del pozo</h1>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
      <div className="flex flex-col gap-6 lg:col-span-5">
      {showSettledLayout ? (
        <SettledPoolHeader
          poolId={poolId}
          status={settledStatus}
          year={deadlineYear}
          description={
            description ?? (profileQuery.isLoading ? 'Buscando la descripción…' : 'Sin descripción')
          }
          amount={pool.amount}
          pioneerChip={pioneerChip}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[0.6875rem] tracking-tight text-comment">
              Registro #{poolId.toString().padStart(4, '0')}
            </span>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider ${poolStatusColor(pool.status)}`}
            >
              {poolStatusLabel(pool.status)}
            </span>
          </div>
          <div className="font-mono text-[2.25rem] font-bold leading-none tracking-tight text-gold lg:text-5xl">
            {formatMON(pool.amount)} MON
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-comment">
              Pozo de recompensa
            </p>
            <span className="rounded bg-surface-container px-2 py-1 font-mono text-[0.6875rem] text-on-surface-variant">
              {pioneerChip}
            </span>
          </div>
          <h2 className="pt-1 font-serif text-[1.75rem] italic leading-tight text-on-surface lg:text-4xl">
            {description ?? (profileQuery.isLoading ? 'Buscando la descripción…' : 'Sin descripción')}
          </h2>
          <p className="font-mono text-[0.6875rem] text-comment">
            Cierre: {formatDeadline(pool.deadline)}
          </p>
          {pool.evidenceURI ? (
            <a
              href={pool.evidenceURI}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[0.6875rem] text-tertiary hover:underline"
            >
              Ver evidencia →
            </a>
          ) : null}
        </div>
      )}

      {pool.status === 0 ? (
        canDeclare ? (
          <DeclareMilestoneForm
            poolId={poolId}
            onSuccess={() => {
              void refresh();
            }}
          />
        ) : canReclaimExpiredOpen ? (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">
              Se pasó la fecha límite y no se declaró el hito. Podés recuperar el pozo.
            </p>
            <ActionButton
              label="Recuperar el pozo"
              onClick={() => void handleReclaim()}
              loading={reclaimBusy}
              disabled={reclaimBusy}
            />
          </div>
        ) : deadlinePassed && isOwner && simOffset > 0n ? (
          <p className="text-sm text-on-surface-variant">
            Vista previa local: si se pasara la fecha límite, podrías recuperar el pozo. En la red
            todavía no venció.
          </p>
        ) : deadlinePassed ? (
          <p className="text-sm text-on-surface-variant">
            Se pasó la fecha límite y no se declaró el hito.
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Este pozo sigue abierto. Todavía no se declaró el hito.
          </p>
        )
      ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:col-span-7">
      {pool.status === 1 && !previewSettled ? (
        <div className="space-y-4">
          <VoteCard
            poolId={poolId}
            pool={{
              votesFor: pool.votesFor,
              votesAgainst: pool.votesAgainst,
              totalWeightAtOpen: pool.totalWeightAtOpen,
              supportersAtOpen: pool.supportersAtOpen,
              voteEnd: pool.voteEnd,
            }}
            userRank={userRank}
            userHasVoted={Boolean(hasVotedQuery.data)}
            userWeight={supporter && supporter.rank > 0 ? supporter.weight : undefined}
            nowUnix={effectiveNow}
            onVoted={() => {
              void refresh();
            }}
          />
          {voteClosed ? (
            <ActionButton
              label="Finalizar votación"
              onClick={() => void handleFinalize()}
              loading={finalizeBusy}
              disabled={finalizeBusy}
            />
          ) : (
            <div className="flex items-center justify-between rounded bg-surface-container-lowest p-3">
              <span className="font-mono text-xs text-on-surface-variant">
                El cierre definitivo se habilitará al expirar el plazo.
              </span>
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-comment">
                En curso
              </span>
            </div>
          )}
        </div>
      ) : null}

      {showSettledLayout ? (
        <>
          <PoolResultCard
            status={settledStatus}
            pool={{
              amount: pool.amount,
              supportersAtOpen: pool.supportersAtOpen,
              votesFor: pool.votesFor,
              votesAgainst: pool.votesAgainst,
              totalWeightAtOpen: pool.totalWeightAtOpen,
            }}
            isArtistOwner={isOwner}
            isEligibleSupporter={isEligibleSupporter}
            hasClaimed={Boolean(hasClaimedQuery.data)}
            userRank={userRank}
            userWeight={supporter && supporter.rank > 0 ? supporter.weight : undefined}
            onClaimReward={() => void handleClaimReward()}
            onReclaim={() => void handleReclaim()}
            claimLoading={claimBusy}
            reclaimLoading={reclaimBusy}
            preview={previewSettled}
          />
          <div className="flex flex-col gap-2 rounded-xl bg-surface-container p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.6875rem] uppercase text-comment">
                Huella del hito
              </span>
              <span className="font-mono text-[0.6875rem] text-tertiary">En cadena</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[0.6875rem] text-on-surface-variant">
              <span>Hash</span>
              <span className="text-on-surface">{shortHash(pool.milestoneHash)}</span>
            </div>
            {previewSettled ? (
              <p className="font-mono text-[0.6875rem] text-comment">
                Cierre real: {formatDeadline(pool.voteEnd)}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {actionError ? <p className="text-sm text-vino-700">{actionError}</p> : null}
      </div>
      </div>

      <Link
        to={`/artist/${pool.artistId.toString()}`}
        className="inline-flex items-center justify-center gap-1.5 py-2 font-mono text-sm text-tertiary hover:underline lg:justify-start"
      >
        ← Volver al artista
      </Link>

      <DevTimeTravel />
    </section>
  );
}

function previewFinalize(pool: {
  votesFor: bigint;
  votesAgainst: bigint;
  totalWeightAtOpen: bigint;
}): { status: 2 | 3; reason: 'quorum' | 'majority' | null } {
  const totalVotes = pool.votesFor + pool.votesAgainst;
  const quorumNeeded =
    pool.totalWeightAtOpen === 0n ? 0n : (pool.totalWeightAtOpen * 2000n) / 10_000n;
  const quorumMet = totalVotes >= quorumNeeded;
  const majorityMet = totalVotes > 0n && pool.votesFor * 10_000n > totalVotes * 5000n;
  if (quorumMet && majorityMet) return { status: 2, reason: null };
  return { status: 3, reason: quorumMet ? 'majority' : 'quorum' };
}

function SettledPoolHeader({
  poolId,
  status,
  year,
  description,
  amount,
  pioneerChip,
}: {
  poolId: bigint;
  status: number;
  year: number;
  description: string;
  amount: bigint;
  pioneerChip: string;
}) {
  const approved = status === 2;
  const rejected = status === 3;
  const pill = approved
    ? 'bg-[#1e2a1a] text-secondary'
    : rejected
      ? 'bg-[#201519] text-pink'
      : 'bg-surface-container-high text-comment';
  const dot = approved ? 'bg-secondary' : rejected ? 'bg-pink' : 'bg-comment';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[0.6875rem] uppercase text-comment">
            Registro #{poolId.toString().padStart(4, '0')}
          </span>
          <span className="h-1 w-1 rounded-full bg-comment" />
          <span className="font-mono text-[0.6875rem] uppercase text-comment">
            Salta, {year}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-wider">
            {poolStatusLabel(status)}
          </span>
        </span>
      </div>

      <div className="relative flex flex-col gap-2 overflow-hidden rounded-xl bg-surface-container-low p-4 shadow-md">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-comment">
            Pozo de reconocimiento
          </span>
          <h2 className="font-serif text-[1.75rem] italic leading-tight text-on-surface lg:text-4xl">
            {description}
          </h2>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-gold">{formatMON(amount)} MON</span>
            <span className="font-mono text-[0.6875rem] text-comment">resguardo total</span>
          </div>
          <span className="rounded bg-surface-container px-2 py-1 font-mono text-[0.6875rem] text-on-surface-variant">
            {pioneerChip}
          </span>
        </div>
      </div>
    </div>
  );
}
