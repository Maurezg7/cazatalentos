import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keccak256, parseEther, parseEventLogs, toBytes } from 'viem';
import { usePublicClient } from 'wagmi';
import { z } from 'zod';
import { useT } from '../i18n/LocaleContext';
import { registerPoolMetadata } from '../lib/api';
import { CAZATALENTOS_ABI } from '../lib/contracts';
import { formatDeadline } from '../lib/format';
import { useOpenPool } from '../lib/hooks';
import { ActionButton } from './ActionButton';
import { Icon } from './Icon';
import { userFacingMessage } from '../lib/observability/decode-contract-error';
import { log } from '../lib/observability/logger';
import { getRequestId } from '../lib/observability/request-id';

const MAX_WINDOW_SECONDS = 90 * 24 * 60 * 60;

type PoolOpeningFormProps = {
  artistId: bigint;
  onSuccess?: (poolId: bigint) => void;
};

export function PoolOpeningForm({ artistId, onSuccess }: PoolOpeningFormProps) {
  const t = useT();
  const publicClient = usePublicClient();
  const { open, isPending, isConfirming } = useOpenPool();
  const [amount, setAmount] = useState('0.1');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadlineInput());
  const [error, setError] = useState<string | null>(null);
  const [createdPoolId, setCreatedPoolId] = useState<bigint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || isPending || isConfirming;
  const deadlineUnix = deadlineToUnix(deadline);
  const summaryDate = deadlineUnix !== undefined ? formatDeadline(deadlineUnix) : '…';

  const openPoolSchema = z.object({
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,18})?$/, t('openPoolAmountInvalid'))
      .refine((value) => Number(value) >= 0.01, t('openPoolAmountMin')),
    description: z
      .string()
      .trim()
      .min(10, t('openPoolDescShort'))
      .max(300, t('openPoolDescLong')),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('openPoolPickDate')),
  });

  async function onSubmit() {
    setError(null);
    const parsed = openPoolSchema.safeParse({ amount, description, deadline });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('openPoolCheckData'));
      return;
    }
    const unix = deadlineToUnix(parsed.data.deadline);
    if (unix === undefined) {
      setError(t('openPoolDateWindow'));
      return;
    }

    setSubmitting(true);
    try {
      const text = parsed.data.description;
      const milestoneHash = keccak256(toBytes(text));
      const hash = await open({
        artistId,
        milestoneHash,
        deadline: unix,
        value: parseEther(parsed.data.amount),
      });
      if (!publicClient) {
        setError(t('openPoolConfirmFail'));
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = parseEventLogs({
        abi: CAZATALENTOS_ABI,
        eventName: 'PoolOpened',
        logs: receipt.logs,
      });
      const poolId = logs[0]?.args.poolId;
      if (poolId === undefined) {
        log.warn('pool_opened_event_missing', { layer: 'web', requestId: getRequestId() });
        setError(t('openPoolMetaFail'));
        return;
      }
      const saved = await registerPoolMetadata({
        poolId: Number(poolId),
        artistId: Number(artistId),
        description: text,
      });
      if (!saved) {
        setError(t('openPoolMetaSoftFail'));
      }
      setCreatedPoolId(poolId);
      onSuccess?.(poolId);
    } catch (error: unknown) {
      setError(userFacingMessage(error, t('openPoolFail')));
    } finally {
      setSubmitting(false);
    }
  }

  if (createdPoolId !== null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#e3e8d8]">{t('openPoolReady')}</p>
        <Link to={`/pool/${createdPoolId.toString()}`} className="text-sm text-ocre-600 underline">
          {t('openPoolView')} <Icon name="arrow-right" className="ml-1 inline h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <label className="block space-y-1 text-sm text-[#e3e8d8]">
        <span>{t('openPoolAmount')}</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setError(null);
          }}
          className="w-full rounded-lg border-2 border-[#43522a] bg-[#14180f] px-3 py-3 text-[#e4e3d9]"
        />
      </label>

      <label className="block space-y-1 text-sm text-[#e3e8d8]">
        <span>{t('openPoolMilestone')}</span>
        <textarea
          value={description}
          maxLength={300}
          rows={4}
          onChange={(event) => {
            setDescription(event.target.value);
            setError(null);
          }}
          className="w-full rounded-lg border-2 border-[#43522a] bg-[#14180f] px-3 py-3 text-[#e4e3d9]"
        />
        <span className="text-xs text-[#9ba888]">
          {description.trim().length < 10
            ? t('openPoolCharsLeft', { n: 10 - description.trim().length })
            : t('openPoolCharsCount', { n: description.trim().length })}
        </span>
      </label>

      <label className="block space-y-1 text-sm text-[#e3e8d8]">
        <span>{t('openPoolDeadline')}</span>
        <input
          type="date"
          min={todayInput()}
          max={maxDeadlineInput()}
          value={deadline}
          onChange={(event) => {
            setDeadline(event.target.value);
            setError(null);
          }}
          className="w-full rounded-lg border-2 border-[#43522a] bg-[#14180f] px-3 py-3 text-[#e4e3d9]"
        />
      </label>

      <p className="rounded-lg border border-[#3b4725] bg-[#181f12] p-3 text-sm text-[#e3e8d8]">
        {t('openPoolSummary', { amount: amount || '…', date: summaryDate })}
      </p>

      {error ? <p className="text-sm text-vino-700">{error}</p> : null}

      <ActionButton label={t('openPoolSubmit')} onClick={() => void onSubmit()} loading={busy} disabled={busy} />
    </form>
  );
}

function todayInput(): string {
  return toDateInput(new Date());
}

function defaultDeadlineInput(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toDateInput(date);
}

function maxDeadlineInput(): string {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return toDateInput(date);
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function deadlineToUnix(value: string): bigint | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  const unix = Math.floor(date.getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  if (unix <= now || unix > now + MAX_WINDOW_SECONDS) return undefined;
  return BigInt(unix);
}
