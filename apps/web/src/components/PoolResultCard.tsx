import { ActionButton } from './ActionButton';

type PoolResultCardProps = {
  poolId: bigint;
  status: number;
  pool: { amount: bigint; supportersAtOpen: number };
  isArtistOwner: boolean;
  isEligibleSupporter: boolean;
  hasClaimed: boolean;
  onClaimReward: () => void;
  onReclaim: () => void;
  claimLoading: boolean;
  reclaimLoading: boolean;
};

export function PoolResultCard({
  status,
  pool,
  isArtistOwner,
  isEligibleSupporter,
  hasClaimed,
  onClaimReward,
  onReclaim,
  claimLoading,
  reclaimLoading,
}: PoolResultCardProps) {
  if (status === 2) {
    return (
      <div className="space-y-3 rounded-lg bg-emerald-500/15 p-4">
        <h2 className="font-serif text-2xl text-tierra-900">¡Hito aprobado!</h2>
        <p className="text-sm text-tierra-900">
          Los {pool.supportersAtOpen} pioneros pueden reclamar su parte del pozo.
        </p>
        {isEligibleSupporter && !hasClaimed ? (
          <ActionButton
            label="Reclamar mi recompensa"
            onClick={onClaimReward}
            loading={claimLoading}
            disabled={claimLoading}
          />
        ) : null}
        {isEligibleSupporter && hasClaimed ? (
          <p className="text-sm text-tierra-900">Ya reclamaste tu parte ✓</p>
        ) : null}
        {!isEligibleSupporter ? (
          <p className="text-xs text-tierra-700">Solo los pioneros elegibles pueden reclamar.</p>
        ) : null}
      </div>
    );
  }

  if (status === 3) {
    return (
      <div className="space-y-3 rounded-lg bg-vino-700/15 p-4">
        <h2 className="font-serif text-2xl text-tierra-900">Hito rechazado por la comunidad</h2>
        <p className="text-sm text-tierra-900">El pozo vuelve al artista.</p>
        {isArtistOwner ? (
          <ActionButton
            label="Recuperar el pozo"
            onClick={onReclaim}
            loading={reclaimLoading}
            disabled={reclaimLoading}
          />
        ) : null}
      </div>
    );
  }

  if (status === 4) {
    return (
      <div className="space-y-3 rounded-lg bg-tierra-100 p-4">
        <h2 className="font-serif text-2xl text-tierra-900">Pozo recuperado por el artista</h2>
        <p className="text-sm text-tierra-900">Este pozo ya está cerrado.</p>
      </div>
    );
  }

  return null;
}
