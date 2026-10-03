import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { z } from 'zod';
import { useClaimMilestone } from '../lib/hooks';
import { ActionButton } from './ActionButton';

const evidenceSchema = z.object({
  evidenceURI: z.string().trim().url('Pegá un link válido.'),
});

type DeclareMilestoneFormProps = {
  poolId: bigint;
  onSuccess?: () => void;
};

export function DeclareMilestoneForm({ poolId, onSuccess }: DeclareMilestoneFormProps) {
  const publicClient = usePublicClient();
  const { claim, isPending, isConfirming } = useClaimMilestone();
  const [evidenceURI, setEvidenceURI] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || isPending || isConfirming;

  async function onSubmit() {
    setError(null);
    const parsed = evidenceSchema.safeParse({ evidenceURI });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Pegá un link válido.');
      return;
    }

    setSubmitting(true);
    try {
      const hash = await claim(poolId, parsed.data.evidenceURI);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setDone(true);
      onSuccess?.();
    } catch {
      setError('No se pudo declarar el hito. Probá de nuevo en un momento.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="text-sm text-tierra-900">Listo. La votación arranca ahora y dura 48 horas.</p>;
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <label className="block space-y-1 text-sm text-tierra-900">
        <span>Link a la evidencia</span>
        <input
          type="url"
          value={evidenceURI}
          placeholder="https://"
          onChange={(event) => setEvidenceURI(event.target.value)}
          className="w-full rounded-lg border border-tierra-100 px-3 py-3"
        />
        <span className="text-xs text-tierra-700">Un tweet, un video o una nota alcanzan.</span>
      </label>

      <p className="rounded-lg bg-tierra-50 p-3 text-sm text-tierra-900">
        Vas a declarar el hito con este link: {evidenceURI.trim() || '…'}. Empieza una votación de 48 horas.
      </p>

      {error ? <p className="text-sm text-vino-700">{error}</p> : null}

      <ActionButton
        label="Declarar hito cumplido"
        onClick={() => void onSubmit()}
        loading={busy}
        disabled={busy}
      />
    </form>
  );
}
