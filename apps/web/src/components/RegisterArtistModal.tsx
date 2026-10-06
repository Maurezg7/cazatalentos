import { useEffect, useRef, useState } from 'react';
import { parseEventLogs } from 'viem';
import { usePublicClient } from 'wagmi';
import { z } from 'zod';
import { AppError } from '@cazatalentos/shared';
import { CAZATALENTOS_ABI } from '../lib/contracts';
import { useRegisterArtist } from '../lib/hooks';
import { Icon } from './Icon';

const CONFIRM_TIMEOUT_MS = 90_000;

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Escribí tu nombre artístico.').max(60, 'Máximo 60 caracteres.'),
  bio: z.string().trim().max(200, 'Máximo 200 caracteres.'),
});

function messageFromWriteError(error: unknown): string {
  if (error instanceof AppError) return error.userMessage;
  return 'No se pudo crear el perfil. Probá de nuevo en un momento.';
}

type RegisterArtistModalProps = {
  open: boolean;
  onClose: () => void;
  onRegistered: (artistId: bigint | undefined) => void;
};

export function RegisterArtistModal({ open, onClose, onRegistered }: RegisterArtistModalProps) {
  const publicClient = usePublicClient();
  const { register, hash, isSuccess, reset } = useRegisterArtist();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'signing' | 'confirming'>('idle');
  const [cachedOpen, setCachedOpen] = useState(open);
  const aliveRef = useRef(false);
  const deliveredHash = useRef<`0x${string}` | undefined>(undefined);
  const onRegisteredRef = useRef(onRegistered);

  if (open !== cachedOpen) {
    setCachedOpen(open);
    setPhase('idle');
    if (!open) {
      setError(null);
    }
  }

  useEffect(() => {
    onRegisteredRef.current = onRegistered;
  }, [onRegistered]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    aliveRef.current = open;
    if (!open) {
      deliveredHash.current = undefined;
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !hash || !isSuccess || !publicClient) return;
    if (deliveredHash.current === hash) return;
    deliveredHash.current = hash;
    void publicClient.getTransactionReceipt({ hash }).then((receipt) => {
      const logs = parseEventLogs({
        abi: CAZATALENTOS_ABI,
        eventName: 'ArtistRegistered',
        logs: receipt.logs,
      });
      setPhase('idle');
      onRegisteredRef.current(logs[0]?.args.artistId);
    });
  }, [open, hash, isSuccess, publicClient]);

  if (!open) return null;

  const busy = phase !== 'idle';

  function handleClose() {
    aliveRef.current = false;
    setPhase('idle');
    reset();
    onClose();
  }

  async function onSubmit() {
    setError(null);
    reset();
    const parsed = registerSchema.safeParse({ name, bio });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }

    setPhase('signing');
    try {
      const hash = await register(parsed.data.name);
      if (!aliveRef.current) return;
      if (!publicClient) {
        setPhase('idle');
        setError('No pudimos confirmar la creación. Recargá la página en un momento.');
        return;
      }
      setPhase('confirming');
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: CONFIRM_TIMEOUT_MS,
      });
      if (!aliveRef.current) return;
      if (deliveredHash.current === hash) return;
      deliveredHash.current = hash;
      const logs = parseEventLogs({
        abi: CAZATALENTOS_ABI,
        eventName: 'ArtistRegistered',
        logs: receipt.logs,
      });
      setPhase('idle');
      onRegistered(logs[0]?.args.artistId);
    } catch (writeError) {
      if (!aliveRef.current) return;
      setPhase('idle');
      setError(messageFromWriteError(writeError));
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Cerrar" onClick={handleClose} className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-artist-title"
        className="relative z-10 w-full max-w-md space-y-4 rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--text)] shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Alta de artista</p>
            <h2 id="register-artist-title" className="m-0 font-display text-3xl uppercase tracking-wide">
              Crear tu perfil
            </h2>
          </div>
          <button type="button" onClick={handleClose} className="landing-focus inline-flex h-11 w-11 items-center justify-center" aria-label="Cerrar">
            <Icon name="x" />
          </button>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Nombre artístico</span>
          <input
            value={name}
            maxLength={60}
            autoFocus
            placeholder="Tu nombre artístico"
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
            className="landing-focus h-11 w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-3 text-[var(--ink)] disabled:opacity-60"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Bio breve</span>
          <textarea
            value={bio}
            maxLength={200}
            rows={3}
            placeholder="Una línea sobre tu música (opcional)"
            disabled={busy}
            onChange={(event) => setBio(event.target.value)}
            className="landing-focus w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-[var(--ink)] disabled:opacity-60"
          />
          <span className="text-xs text-[var(--muted)]">
            Por ahora solo queda guardado el nombre. La bio se suma después.
          </span>
        </label>

        <p className="rounded-[10px] border border-[var(--line)] bg-[var(--page)] p-3 text-sm">
          {phase === 'signing'
            ? 'Revisá la confirmación para firmar. Si no aparece, cerrá y volvé a intentar.'
            : phase === 'confirming'
              ? 'Esperando que la red confirme la creación…'
              : `Vas a firmar la creación del perfil «${name.trim() || '…'}».`}
        </p>

        {error ? <p className="text-sm" role="alert">{error}</p> : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={busy}
          className="sun-btn landing-focus h-11 w-full px-4 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? 'Firmando…' : 'Crear perfil'}
        </button>
      </div>
    </div>
  );
}
