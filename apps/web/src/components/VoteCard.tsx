import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useT } from '../i18n/LocaleContext';
import { formatCountdown } from '../lib/format';
import { useVote } from '../lib/hooks';
import { userFacingMessage } from '../lib/observability/decode-contract-error';

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
  const t = useT();
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
  const closed = countdown === t('closed');

  async function onVote(approve: boolean) {
    setError(null);
    reset();
    try {
      const hash = await vote(poolId, approve);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      onVoted?.();
    } catch (error: unknown) {
      setError(userFacingMessage(error, t('voteFailed')));
    }
  }

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded bg-surface-container-high p-4 shadow-md">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="block font-mono text-[0.6875rem] uppercase tracking-widest text-comment">
            {t('voteActiveConsensus')}
          </span>
          <h2 className="mt-0.5 font-serif text-xl font-semibold text-on-surface">{t('votePioneerTitle')}</h2>
        </div>
        <div className="rounded bg-surface-container-lowest px-2.5 py-1 text-right">
          <span className="block font-mono text-[0.6875rem] font-semibold text-primary-container">
            {closed ? t('closed') : countdown}
          </span>
          <span className="block font-mono text-[0.625rem] uppercase text-comment">
            {closed ? t('voteDeadline') : t('voteRemaining')}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <div className="relative h-[6px] w-full rounded-[2px] bg-surface-container-lowest">
          <div
            className="h-full rounded-[2px] bg-primary-container"
            style={{ width: `${Math.min(100, forRatio)}%` }}
          />
          <div
            className="absolute top-[-3px] left-[20%] h-3 w-px bg-comment"
            title={t('voteQuorumLegal')}
          />
        </div>
        <div className="flex items-center justify-between pt-0.5 font-mono text-[0.6875rem] text-comment">
          <span>0%</span>
          <span>{t('voteQuorumLegal')}</span>
          <span className="font-medium text-primary-container">{Math.min(100, Math.round(forRatio))}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded bg-surface-container-lowest p-2 font-mono text-[0.6875rem]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span className="text-on-surface">
            {t('voteFor')}{' '}
            <span className="font-bold text-secondary">
              {pool.votesFor.toString()} {t('voteWeight')}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-comment" />
          <span className="text-comment">
            {t('voteAgainst')}{' '}
            <span className="font-semibold text-on-surface">
              {pool.votesAgainst.toString()} {t('voteWeight')}
            </span>
          </span>
        </div>
      </div>

      {quorumMet ? (
        <div className="flex items-center gap-2 rounded bg-secondary/10 px-3 py-2">
          <span className="font-mono text-[0.6875rem] font-semibold tracking-tight text-secondary">
            {t('voteQuorumReached')}
          </span>
        </div>
      ) : (
        <p className="font-mono text-[0.6875rem] text-comment">
          {t('voteQuorumMissing', { n: missing.toString() })}
        </p>
      )}

      {!closed && eligible && !userHasVoted ? (
        <div className="flex flex-col gap-2.5 pt-1">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-comment">
            {t('voteCastDecision')}
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void onVote(true)}
              disabled={busy}
              className="flex h-11 items-center justify-center rounded bg-primary-container px-3 text-sm font-bold text-surface-container-lowest transition-colors disabled:opacity-40"
            >
              {busy ? '…' : t('voteYes')}
            </button>
            <button
              type="button"
              onClick={() => void onVote(false)}
              disabled={busy}
              className="flex h-11 items-center justify-center rounded px-3 text-sm font-medium text-on-surface shadow-[inset_0_0_0_1px_#e4e3d9] transition-colors disabled:opacity-40"
            >
              {busy ? '…' : t('voteNo')}
            </button>
          </div>
          {userWeight !== undefined ? (
            <p className="font-mono text-[0.6875rem] text-comment">{t('voteYourWeight', { n: userWeight })}</p>
          ) : null}
        </div>
      ) : null}

      {userHasVoted ? (
        <p className="rounded bg-surface-container-lowest p-2.5 text-center font-mono text-[0.6875rem] text-secondary">
          {t('voteAlready')}
        </p>
      ) : null}

      {!eligible ? (
        <div className="rounded bg-surface-container-lowest/70 p-2.5">
          <p className="font-mono text-[0.6875rem] leading-relaxed text-comment">
            {t('voteOnlyEligible', { n: pool.supportersAtOpen })}
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-vino-700">{error}</p> : null}
    </div>
  );
}
