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
import { formatCountdown, formatDeadline, formatMON, poolStatusColor, poolStatusLabel } from '../lib/format';
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
    <section className="space-y-6 pt-4">
      <header className="space-y-2">
        <p className="text-sm text-tierra-700">Pozo de recompensa</p>
        <h1 className="font-serif text-3xl text-tierra-900">
          <span className={`inline-block rounded-full px-3 py-1 text-xl ${poolStatusColor(pool.status)}`}>
            {poolStatusLabel(pool.status)}
          </span>
        </h1>
      </header>

      <p className="font-serif text-4xl text-tierra-900">{formatMON(pool.amount)} MON</p>

      <p className="text-base text-tierra-900">
        {description ?? (profileQuery.isLoading ? 'Buscando la descripción…' : 'Sin descripción')}
      </p>

      <p className="text-sm text-tierra-700">Fecha límite: {formatDeadline(pool.deadline)}</p>

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
            <p className="text-sm text-tierra-700">
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
          <p className="text-sm text-tierra-700">
            Vista previa local: si se pasara la fecha límite, podrías recuperar el pozo. En la red
            todavía no venció.
          </p>
        ) : deadlinePassed ? (
          <p className="text-sm text-tierra-700">Se pasó la fecha límite y no se declaró el hito.</p>
        ) : (
          <p className="text-sm text-tierra-700">Este pozo sigue abierto. Todavía no se declaró el hito.</p>
        )
      ) : null}

      {pool.status === 1 ? (
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
          {voteClosed && simOffset > 0n ? (
            <div className="space-y-2 rounded-lg bg-tierra-50 p-4 text-sm text-tierra-900">
              <p className="font-medium">Vista previa local</p>
              <p>
                En la red la votación sigue abierta. Si se cerrara ahora, el resultado sería:{' '}
                <span className="font-medium">{preview.status === 2 ? 'aprobado' : 'rechazado'}</span>
                {preview.reason === 'quorum'
                  ? ' (no se llegó al quórum).'
                  : preview.reason === 'majority'
                    ? ' (no hubo mayoría a favor).'
                    : '.'}
              </p>
              <p className="text-tierra-700">
                Para cerrarla de verdad hay que esperar al {formatDeadline(pool.voteEnd)}
              </p>
            </div>
          ) : voteClosed ? (
            <ActionButton
              label="Finalizar votación"
              onClick={() => void handleFinalize()}
              loading={finalizeBusy}
              disabled={finalizeBusy}
            />
          ) : (
            <p className="text-sm text-tierra-700">
              La votación se cierra en {formatCountdown(pool.voteEnd, effectiveNow)}.
            </p>
          )}
        </div>
      ) : null}

      {pool.status === 2 || pool.status === 3 || pool.status === 4 ? (
        <PoolResultCard
          poolId={poolId}
          status={pool.status}
          pool={{ amount: pool.amount, supportersAtOpen: pool.supportersAtOpen }}
          isArtistOwner={isOwner}
          isEligibleSupporter={isEligibleSupporter}
          hasClaimed={Boolean(hasClaimedQuery.data)}
          onClaimReward={() => void handleClaimReward()}
          onReclaim={() => void handleReclaim()}
          claimLoading={claimBusy}
          reclaimLoading={reclaimBusy}
        />
      ) : null}

      {actionError ? <p className="text-sm text-vino-700">{actionError}</p> : null}

      <Link to={`/artist/${pool.artistId.toString()}`} className="inline-block text-sm text-ocre-600 underline">
        Volver al artista
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
