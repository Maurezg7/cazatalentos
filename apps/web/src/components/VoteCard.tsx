import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatCountdown } from '../lib/format';
import { useVote } from '../lib/hooks';
import { ActionButton } from './ActionButton';

const QUORUM_BPS = 2000n;

type VoteCardProps = {
  poolId: bigint;
  pool: {
    votesFor: bigint;
    votesAgainst: bigint;
    totalWeightAtOpen: bigint;
    supportersAtOpen: number;
    voteEnd: bigint;
  };
  userRank: number | undefined;
  userHasVoted: boolean;
  userWeight: number | undefined;
  nowUnix?: bigint;
  onVoted?: () => void;
};

export function VoteCard({
  poolId,
  pool,
  userRank,
  userHasVoted,
  userWeight,
  nowUnix,
  onVoted,
}: VoteCardProps) {
  const publicClient = usePublicClient();
  const { vote, isPending, isConfirming, reset } = useVote();
  const [error, setError] = useState<string | null>(null);
  const busy = isPending || isConfirming;

  const totalVotes = pool.votesFor + pool.votesAgainst;
  const quorumNeeded =
    pool.totalWeightAtOpen === 0n ? 0n : (pool.totalWeightAtOpen * QUORUM_BPS) / 10_000n;
  const quorumMet = totalVotes >= quorumNeeded;
  const missing = quorumNeeded > totalVotes ? quorumNeeded - totalVotes : 0n;
  const forRatio =
    pool.totalWeightAtOpen === 0n
      ? 0
      : Number((pool.votesFor * 1000n) / pool.totalWeightAtOpen) / 10;

  const eligible = userRank !== undefined && userRank > 0 && userRank <= pool.supportersAtOpen;
  const countdown = formatCountdown(pool.voteEnd, nowUnix);

  async function onVote(approve: boolean) {
    setError(null);
    reset();
    try {
      const hash = await vote(poolId, approve);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      onVoted?.();
    } catch {
      setError('No se pudo registrar tu voto. Probá de nuevo.');
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-tierra-100 bg-white p-4">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-tierra-900">Votación de pioneros</h2>
        <p className="text-sm text-tierra-700">
          {countdown === 'Cerrada' ? 'La votación ya cerró' : `Termina en ${countdown}`}
        </p>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-tierra-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-ocre-500"
          style={{ width: `${Math.min(100, forRatio)}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-tierra-900/50"
          style={{ left: '20%' }}
          aria-hidden
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <p className="text-tierra-900">
          A favor: <span className="font-medium">{pool.votesFor.toString()}</span> (peso)
        </p>
        <p className="text-tierra-900">
          En contra: <span className="font-medium">{pool.votesAgainst.toString()}</span> (peso)
        </p>
      </div>

      {quorumMet ? (
        <p className="text-sm text-emerald-700">Quórum alcanzado ✓</p>
      ) : (
        <p className="text-sm text-tierra-700">Faltan {missing.toString()} de peso para el quórum</p>
      )}

      {countdown === 'Cerrada' ? (
        userHasVoted ? (
          <p className="text-sm text-tierra-900">Ya votaste ✓</p>
        ) : eligible ? null : (
          <p className="text-sm text-tierra-700">
            Solo los {pool.supportersAtOpen} pioneros que estaban antes de abrir el pozo pueden votar.
          </p>
        )
      ) : eligible ? (
        <div className="space-y-3">
          {userHasVoted ? (
            <p className="text-sm text-tierra-900">Ya votaste ✓</p>
          ) : (
            <>
              <ActionButton
                label="Votar a favor"
                onClick={() => void onVote(true)}
                loading={busy}
                disabled={busy}
              />
              <ActionButton
                label="Votar en contra"
                variant="secondary"
                onClick={() => void onVote(false)}
                loading={busy}
                disabled={busy}
              />
              {userWeight !== undefined ? (
                <p className="text-xs text-tierra-700">Tu peso: {userWeight}</p>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-tierra-700">
          Solo los {pool.supportersAtOpen} pioneros que estaban antes de abrir el pozo pueden votar.
        </p>
      )}

      {error ? <p className="text-sm text-vino-700">{error}</p> : null}
    </div>
  );
}
