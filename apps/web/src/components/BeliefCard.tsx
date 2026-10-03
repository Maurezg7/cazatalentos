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
  const year = new Date(Number(supporter.signedAt) * 1000).getFullYear();

  return (
    <section className="space-y-1" data-artist-id={artistId.toString()}>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[0.6875rem] uppercase text-outline">Primer testimonio de fe</span>
        <span className="font-mono text-[0.6875rem] text-on-surface-variant">
          {year} · {totalSupporters.toString().padStart(3, '0')} pioneros
        </span>
      </div>

      <article className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-surface-container p-4 shadow-md">
        <div className="flex items-center justify-between pb-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded bg-primary-container px-2 py-0.5 font-mono text-[0.6875rem] uppercase text-on-primary-container">
              Cazatalentos
            </span>
            <span className="font-mono text-[0.6875rem] text-on-surface-variant">Creyente temprano</span>
          </div>
          <span className="rounded bg-surface-container-highest px-2 py-0.5 font-mono text-[0.6875rem] text-secondary">
            {levelName(supporter.weight)} ×{supporter.weight}
          </span>
        </div>

        <Stamp year={year} />

        <div className="relative z-10 py-4">
          <span className="block font-mono text-[0.6875rem] uppercase text-outline">Orden de llegada</span>
          <div className="mt-1 font-mono text-[2rem] leading-none text-primary">{padRank(supporter.rank)}</div>
          <p className="mt-2 font-serif text-xl italic text-on-surface">
            Constancia otorgada a favor de {artistName}
          </p>
        </div>

        <div className="flex items-center justify-between rounded bg-surface-container-low px-2 py-2">
          <span className="font-mono text-[0.6875rem] text-on-surface-variant">
            {formatSignedAt(supporter.signedAt)}
          </span>
          <span className="font-mono text-[0.6875rem] text-secondary">
            {formatMON(supporter.stake)} MON
          </span>
        </div>
      </article>
    </section>
  );
}

function Stamp({ year }: { year: number }) {
  return (
    <div className="pointer-events-none absolute right-3 top-8 opacity-20">
      <svg className="rotate-[-12deg] text-primary" fill="currentColor" height="110" viewBox="0 0 120 120" width="110">
        <circle cx="60" cy="60" fill="none" r="54" stroke="currentColor" strokeDasharray="4 3" strokeWidth="2" />
        <circle cx="60" cy="60" fill="none" r="42" stroke="currentColor" strokeWidth="1" />
        <text
          className="text-[8px] uppercase tracking-widest"
          fill="currentColor"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          x="60"
          y="48"
        >
          Salta
        </text>
        <text
          className="text-[16px] italic font-bold"
          fill="currentColor"
          fontFamily="Newsreader, serif"
          textAnchor="middle"
          x="60"
          y="68"
        >
          {year}
        </text>
        <text
          className="text-[7px] uppercase tracking-wider"
          fill="currentColor"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          x="60"
          y="84"
        >
          Dar fe
        </text>
      </svg>
    </div>
  );
}
