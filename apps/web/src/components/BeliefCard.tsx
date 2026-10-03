import type { Supporter } from '../lib/contracts';
import { formatMON, formatSignedAt, levelName, padRank } from '../lib/format';

type BeliefCardProps = {
  artistId: bigint;
  artistName: string;
  supporter: Supporter;
  totalSupporters: number;
};

export function BeliefCard({
  artistId,
  artistName,
  supporter,
  totalSupporters,
}: BeliefCardProps) {
  return (
    <div className="space-y-3" data-artist-id={artistId.toString()}>
      <article className="overflow-hidden rounded-xl border border-tierra-100 bg-surface-container-high shadow-sm">
        <div className="bg-ocre-500 px-4 py-1.5">
          <p className="text-center text-xs font-medium uppercase tracking-[0.25em] text-white">
            Cazatalentos
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-4xl font-bold tracking-tight text-tierra-900">
                {padRank(supporter.rank)}
              </p>
              <p className="mt-1 font-mono text-sm text-tierra-700">
                de {totalSupporters.toString().padStart(3, '0')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-serif text-base italic text-tierra-900">
                {levelName(supporter.weight)}
              </p>
              <p className="text-xs text-tierra-700">×{supporter.weight}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-xl text-tierra-900">{artistName}</h3>
            <p className="text-sm text-tierra-700">Desde el {formatSignedAt(supporter.signedAt)}</p>
          </div>

          <div className="border-t border-dashed border-tierra-100" aria-hidden="true" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-tierra-700">Depósito</span>
            <span className="font-medium text-tierra-900">{formatMON(supporter.stake)} MON</span>
          </div>
        </div>
      </article>

      <button
        type="button"
        disabled
        title="Próximamente"
        className="w-full text-center text-sm text-tierra-700 underline decoration-tierra-100 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Compartir
      </button>
    </div>
  );
}
