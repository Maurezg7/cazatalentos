import { formatMON, padRank } from '../lib/format';
import { useT } from '../i18n/LocaleContext';

type PoolResultCardProps = {
  status: number;
  pool: {
    amount: bigint;
    supportersAtOpen: number;
    votesFor: bigint;
    votesAgainst: bigint;
    totalWeightAtOpen: bigint;
  };
  isArtistOwner: boolean;
  isEligibleSupporter: boolean;
  hasClaimed: boolean;
  userRank: number | undefined;
  userWeight: number | undefined;
  onClaimReward: () => void;
  onReclaim: () => void;
  claimLoading: boolean;
  reclaimLoading: boolean;
  preview?: boolean;
};

export function PoolResultCard({
  status,
  pool,
  isArtistOwner,
  isEligibleSupporter,
  hasClaimed,
  userRank,
  userWeight,
  onClaimReward,
  onReclaim,
  claimLoading,
  reclaimLoading,
  preview = false,
}: PoolResultCardProps) {
  const t = useT();
  const totalVotes = pool.votesFor + pool.votesAgainst;
  const favorPct =
    totalVotes === 0n ? 0 : Number((pool.votesFor * 100n) / totalVotes);
  const quorumNeeded =
    pool.totalWeightAtOpen === 0n ? 0n : (pool.totalWeightAtOpen * 2000n) / 10_000n;
  const quorumMet = totalVotes >= quorumNeeded;
  const share =
    userWeight !== undefined && pool.totalWeightAtOpen > 0n
      ? (pool.amount * BigInt(userWeight)) / pool.totalWeightAtOpen
      : null;

  if (status === 2) {
    return (
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-[#222E20] p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1b251a] px-2.5 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase text-secondary">
            {t('consensusRatified')}
          </span>
          <span className="font-mono text-[0.6875rem] text-secondary/80">
            {favorPct}% favorable
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-xl text-on-surface">{t('milestoneApproved')}</h2>
          <p className="text-sm text-[#dcded1]">
            {t('pioneersCanClaim', { n: pool.supportersAtOpen })}
          </p>
        </div>

        {isEligibleSupporter && share !== null && userRank !== undefined ? (
          <div className="flex items-center justify-between rounded-lg bg-[#172016] p-2">
            <div className="flex flex-col">
              <span className="font-mono text-[0.6875rem] text-comment">
                {t('yourShare', { rank: padRank(userRank) })}
              </span>
              <span className="font-mono text-sm text-gold">{formatMON(share)} MON</span>
            </div>
            <span className="rounded bg-[#243321] px-2 py-0.5 font-mono text-[0.6875rem] uppercase text-secondary">
              {hasClaimed ? t('claimed') : t('ready')}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 pt-1">
          {preview ? (
            <p className="text-center font-mono text-[0.6875rem] text-comment">
              Vista previa local: en la red todavía no se cerró.
            </p>
          ) : isEligibleSupporter && !hasClaimed ? (
            <button
              type="button"
              onClick={onClaimReward}
              disabled={claimLoading}
              className="flex w-full items-center justify-center rounded-lg bg-secondary px-4 py-3.5 text-sm font-bold text-surface-container-lowest transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              {claimLoading ? t('claiming') : t('claimReward')}
            </button>
          ) : null}
          {!preview && isEligibleSupporter && hasClaimed ? (
            <p className="text-center font-mono text-[0.6875rem] text-secondary">
              {t('alreadyClaimed')}
            </p>
          ) : null}
          {!preview && !isEligibleSupporter ? (
            <p className="text-center font-mono text-[0.6875rem] text-comment">
              {t('onlyEligible')}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (status === 3) {
    return (
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-[#2E1F24] p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#201519] px-2.5 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase text-pink">
            Hito rechazado
          </span>
          <span className="font-mono text-[0.6875rem] text-pink/80">
            {quorumMet ? `${favorPct}% a favor` : 'Sin quórum favorable'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-xl text-on-surface">Hito rechazado por la comunidad</h2>
          <p className="text-sm text-on-surface-variant">El pozo vuelve al artista.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#201519] p-2">
          <div className="flex flex-col">
            <span className="font-mono text-[0.6875rem] text-comment">Vuelve al artista</span>
            <span className="font-mono text-sm text-gold">{formatMON(pool.amount)} MON</span>
          </div>
          <span className="font-mono text-[0.6875rem] text-comment">
            {isArtistOwner ? 'Disponible' : 'Solo el artista'}
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {preview ? (
            <p className="text-center font-mono text-[0.6875rem] text-comment">
              Vista previa local: en la red todavía no se cerró.
            </p>
          ) : isArtistOwner ? (
            <button
              type="button"
              onClick={onReclaim}
              disabled={reclaimLoading}
              className="flex w-full items-center justify-center rounded-lg bg-pink px-4 py-3.5 text-sm font-bold text-surface-container-lowest transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              {reclaimLoading ? t('reclaiming') : t('reclaimPool')}
            </button>
          ) : (
            <p className="text-center font-mono text-[0.6875rem] text-comment">
              {t('onlyArtistReclaim')}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (status === 4) {
    return (
      <section className="flex flex-col gap-2 rounded-xl bg-surface-container p-4">
        <h2 className="font-serif text-xl italic text-on-surface">{t('poolRecovered')}</h2>
        <p className="text-sm text-on-surface-variant">{t('poolAlreadyClosed')}</p>
      </section>
    );
  }

  return null;
}
