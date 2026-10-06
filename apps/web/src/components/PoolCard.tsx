import type { PoolDto } from '../lib/api';
import { Icon } from './Icon';
import { formatDeadline, formatMON, poolStatusLabel, shortHash } from '../lib/format';

const STATUS_INDEX = {
  Open: 0,
  Claimed: 1,
  Approved: 2,
  Rejected: 3,
  Reclaimed: 4,
} as const;

const STATUS_CLASS = {
  Open: 'bg-[#2a2614] text-primary-fixed border-[#52491f]',
  Claimed: 'bg-[#423d14] text-primary-fixed border-[#7d7328]',
  Approved: 'bg-[#1a2113] text-secondary border-[#3e4d25]',
  Rejected: 'bg-vino-700/15 text-vino-700 border-vino-700/40',
  Reclaimed: 'bg-[#192013] text-[#919e7e] border-[#3b4725]',
} as const;

const ZERO_HASH = `0x${'0'.repeat(64)}`;

type PoolCardProps = {
  pool: PoolDto;
  onClick?: () => void;
};

export function PoolCard({ pool, onClick }: PoolCardProps) {
  const pending = pool.amountWei === '0' && pool.milestoneHash === ZERO_HASH;
  const description = pool.milestoneDescription ?? shortHash(pool.milestoneHash);
  const deadline = pending
    ? 'Fecha por confirmar'
    : `Cierre: ${formatDeadline(BigInt(Math.floor(new Date(pool.deadline).getTime() / 1000)))}`;
  const idLabel = String(pool.id).padStart(3, '0');

  return (
    <article
      className="relative flex flex-col gap-3 rounded-xl border-2 border-[#526335] bg-[#192013] p-4 transition-colors hover:border-[#a8e430]"
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider ${STATUS_CLASS[pool.status]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {poolStatusLabel(STATUS_INDEX[pool.status])}
          </span>
          <span className="font-mono text-[11px] text-[#919e7e]">Pozo #{idLabel}</span>
        </div>
        <span className="rounded border border-[#52491f] bg-[#2a2614] px-2 py-0.5 font-mono text-[0.6875rem] font-semibold text-primary-fixed">
          {deadline}
        </span>
      </div>

      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-baseline">
        <p className="font-serif text-xl italic text-[#f4f7ee]">{description}</p>
        <div className="text-left md:text-right">
          <span className="block font-mono text-2xl font-bold tracking-tight text-secondary md:text-3xl">
            {pending ? 'Confirmando…' : `${formatMON(BigInt(pool.amountWei))} MON`}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#869273]">
            En el pozo
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-[#2d371f] pt-3">
        <span className="font-mono text-[0.6875rem] text-[#919e7e]">Abrí el expediente</span>
        <span className="inline-flex items-center gap-1 font-mono text-[0.6875rem] text-secondary">Ver pozo <Icon name="arrow-right" className="h-3 w-3" /></span>
      </div>
    </article>
  );
}
