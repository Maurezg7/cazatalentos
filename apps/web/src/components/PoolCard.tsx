import type { PoolDto } from '../lib/api';
import { formatDeadline, formatMON, poolStatusLabel } from '../lib/format';

const STATUS_INDEX = {
  Open: 0,
  Claimed: 1,
  Approved: 2,
  Rejected: 3,
  Reclaimed: 4,
} as const;

const STATUS_CLASS = {
  Open: 'bg-ocre-500/15 text-ocre-600',
  Claimed: 'bg-tierra-100 text-tierra-900',
  Approved: 'bg-ocre-500/15 text-tierra-900',
  Rejected: 'bg-vino-700/10 text-vino-700',
  Reclaimed: 'bg-tierra-100 text-tierra-700',
} as const;

const ZERO_HASH = `0x${'0'.repeat(64)}`;

type PoolCardProps = {
  pool: PoolDto;
  onClick?: () => void;
};

export function PoolCard({ pool, onClick }: PoolCardProps) {
  const pending = pool.amountWei === '0' && pool.milestoneHash === ZERO_HASH;
  const description = pool.milestoneDescription ?? shortHash(pool.milestoneHash);

  return (
    <article
      className="space-y-3 rounded-xl border border-tierra-100 bg-white p-4"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[pool.status]}`}>
          {poolStatusLabel(STATUS_INDEX[pool.status])}
        </span>
        <p className="text-lg font-semibold text-tierra-900">
          {pending ? 'Confirmando…' : `${formatMON(BigInt(pool.amountWei))} MON`}
        </p>
      </div>
      <p className="text-sm text-tierra-900">{description}</p>
      <div className="flex items-center justify-between gap-3 text-xs text-tierra-700">
        <span>{pending ? 'Fecha por confirmar' : formatDeadline(BigInt(Math.floor(new Date(pool.deadline).getTime() / 1000)))}</span>
        <span>
          {pending ? 'Datos en camino' : `${pool.supportersAtOpen} personas elegibles`}
        </span>
      </div>
    </article>
  );
}

function shortHash(hash: string): string {
  if (hash.length < 12) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}
