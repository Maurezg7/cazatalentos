import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth';
import { z } from 'zod';
import { Icon } from './Icon';
import { useEntrySignal } from '../lib/entry-signal';

const emailSchema = z.string().trim().email('Escribí un email válido.');
const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Ingresá el código de 6 dígitos.');

type EntrySheetContextValue = {
  openEntry: () => void;
};

const EntrySheetContext = createContext<EntrySheetContextValue | null>(null);

export function useEntrySheet(): EntrySheetContextValue {
  const ctx = useContext(EntrySheetContext);
  if (!ctx) {
    throw new Error('useEntrySheet must be used within EntrySheetProvider');
  }
  return ctx;
}

export function EntrySheetProvider({ children }: { children: ReactNode }) {
  const { authenticated } = usePrivy();
  const { pendingEntry, consumePendingEntry, setAuthenticated } = useEntrySignal();
  const [wantOpen, setWantOpen] = useState(false);
  useEffect(() => {
    setAuthenticated(authenticated);
  }, [authenticated, setAuthenticated]);
  useEffect(() => {
    if (authenticated && pendingEntry) consumePendingEntry();
  }, [authenticated, pendingEntry, consumePendingEntry]);
  const open = (wantOpen || Boolean(pendingEntry)) && !authenticated;

  const value = useMemo(
    () => ({
      openEntry: () => setWantOpen(true),
    }),
    [],
  );

  return (
    <EntrySheetContext.Provider value={value}>
      {children}
      {open ? (
        <EntrySheet
          onClose={() => {
            setWantOpen(false);
            if (pendingEntry) consumePendingEntry();
          }}
        />
      ) : null}
    </EntrySheetContext.Provider>
  );
}

function EntrySheet({ onClose }: { onClose: () => void }) {
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();
  const { initOAuth, state: oauthState } = useLoginWithOAuth();
  const [step, setStep] = useState<'entry' | 'code'>('entry');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sending = busy || emailState.status === 'sending-code' || emailState.status === 'submitting-code';
  const googleBusy = oauthState.status === 'loading';

  const resetAndClose = useCallback(() => {
    setStep('entry');
    setEmail('');
    setCode('');
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') resetAndClose();
    }
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [resetAndClose]);

  async function handleGoogle() {
    setError(null);
    try {
      await initOAuth({ provider: 'google' });
    } catch {
      setError('No se pudo entrar con Google. Probá de nuevo.');
    }
  }

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Escribí un email válido.');
      return;
    }
    setBusy(true);
    try {
      await sendCode({ email: parsed.data });
      setEmail(parsed.data);
      setStep('code');
    } catch {
      setError('No se pudo enviar el código. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ingresá el código de 6 dígitos.');
      return;
    }
    setBusy(true);
    try {
      await loginWithCode({ code: parsed.data });
    } catch {
      setError('Ese código no es válido.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError(null);
    setBusy(true);
    try {
      await sendCode({ email });
    } catch {
      setError('No se pudo reenviar el código. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={resetAndClose}
        className="absolute inset-0 bg-black/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-title"
        className="relative z-10 flex w-full max-w-[480px] flex-col rounded-t-[var(--radius-card,16px)] border border-[var(--line)] bg-[var(--panel)] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 text-[var(--text)] shadow-2xl lg:max-w-md lg:rounded-[16px]"
      >
        <div className="flex justify-center pb-4 pt-1 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-[var(--line)]" />
        </div>

        {step === 'entry' ? (
          <>
            <div className="mb-5 flex flex-col gap-1">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                Entrada al registro
              </p>
              <h2 id="entry-title" className="m-0 mt-1 font-display text-4xl uppercase tracking-wide">
                Entrá al registro
              </h2>
              <p className="m-0 text-sm text-[var(--muted)]">Con tu email o Google.</p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={googleBusy || sending}
                className="sun-btn landing-focus flex h-11 w-full items-center justify-center gap-3 px-4 text-sm font-semibold disabled:opacity-50"
              >
                <GoogleMark />
                <span>{googleBusy ? 'Entrando…' : 'Continuar con Google'}</span>
              </button>

              <div className="relative my-1 flex items-center justify-center">
                <div className="h-px w-full bg-[var(--line)]" />
                <span className="absolute bg-[var(--panel)] px-3 text-xs lowercase tracking-wider text-[var(--muted)]">
                  o con email
                </span>
              </div>

              <form className="flex flex-col gap-3" noValidate onSubmit={(event) => void handleSendCode(event)}>
                <input
                  autoComplete="email"
                  inputMode="email"
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  className="landing-focus h-11 w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                />
                <button
                  type="submit"
                  disabled={sending || googleBusy}
                  className="line-btn landing-focus flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-50"
                >
                  <span>{sending ? 'Enviando…' : 'Enviar código'}</span>
                  <Icon name="arrow-right" className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <CodeStep
            email={email}
            code={code}
            error={error}
            sending={sending}
            onCodeChange={setCode}
            onConfirm={(event) => void handleConfirmCode(event)}
            onResend={() => void handleResend()}
            onChangeEmail={() => {
              setStep('entry');
              setCode('');
              setError(null);
            }}
          />
        )}

        {step === 'entry' && error ? (
          <p className="mt-3 text-center text-sm" role="alert">{error}</p>
        ) : null}

        {step === 'entry' ? (
          <>
            <p className="pt-4 text-center text-xs uppercase leading-relaxed tracking-wider text-[var(--muted)]">
              Al entrar se crea tu registro personal.
            </p>
            <div className="flex justify-center pb-1 pt-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="landing-focus px-4 py-1 text-xs uppercase tracking-widest text-[var(--gold)] underline"
              >
                Ahora no
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CodeStep({
  email,
  code,
  error,
  sending,
  onCodeChange,
  onConfirm,
  onResend,
  onChangeEmail,
}: {
  email: string;
  code: string;
  error: string | null;
  sending: boolean;
  onCodeChange: (value: string) => void;
  onConfirm: (event: FormEvent) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    otpRef.current?.focus();
  }, []);

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
          Código de entrada
        </span>
      </div>

      <h2 id="entry-title" className="mb-1 font-display text-4xl uppercase tracking-wide">
        Revisá tu correo
      </h2>

      <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
        Te enviamos un código de 6 dígitos a{' '}
        <span className="mt-1 inline-block select-all rounded-lg bg-[var(--paper)] px-2 py-0.5 text-sm text-[var(--ink)]">
          {email}
        </span>
      </p>

      <form onSubmit={onConfirm}>
        <div className="relative mb-4">
          <input
            ref={otpRef}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-label="Código de 6 dígitos"
            className="absolute inset-0 z-10 cursor-text opacity-0"
          />
          <div className="pointer-events-none grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, index) => {
              const digit = code[index];
              const active = index === code.length;
              return (
                <div
                  key={index}
                  className={`flex h-14 items-center justify-center rounded-[10px] border text-lg font-semibold ${
                    active
                      ? 'border-[var(--gold)] bg-[var(--paper)] text-[var(--ink)]'
                      : 'border-[var(--line)] bg-[var(--page)] text-[var(--text)]'
                  }`}
                >
                  {digit ??
                    (active ? (
                      <span className="inline-block h-0.5 w-2.5 translate-y-2 bg-[var(--gold)]" />
                    ) : null)}
                </div>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="mb-6 text-sm" role="alert">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={sending}
          className="sun-btn landing-focus mb-4 flex h-11 w-full items-center justify-center px-4 text-sm font-semibold disabled:opacity-50"
        >
          {sending ? 'Confirmando…' : 'Confirmar entrada'}
        </button>
      </form>

      <div className="mb-6 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onResend}
          disabled={sending}
          className="landing-focus text-left text-xs tracking-wider text-[var(--gold)] underline disabled:opacity-50"
        >
          Reenviar código
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="landing-focus text-right text-xs text-[var(--muted)] underline"
        >
          Cambiar email
        </button>
      </div>

      <div className="flex justify-center pb-1">
        <button
          type="button"
          onClick={onChangeEmail}
          className="landing-focus text-xs text-[var(--muted)] underline"
        >
          ← Volver atrás
        </button>
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}
