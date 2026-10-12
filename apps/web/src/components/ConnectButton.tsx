import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { fetchOwnedArtist } from '../lib/api';
import { Icon } from './Icon';
import { useEntrySheet } from './EntrySheet';
import { useEntrySignal } from '../lib/entry-signal';
import { shortAddress } from '../lib/format';
import { useSupporter } from '../lib/hooks';

const enterPill =
  'inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl bg-terracotta px-4 font-body text-sm font-bold text-cream transition-colors disabled:opacity-70 dark:bg-terracotta-dark';

export function ConnectButton() {
  const { ready, authenticated, logout } = usePrivy();
  const { openEntry } = useEntrySheet();
  const { loggingIn } = useEntrySignal();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Keep a spinner while Privy boots, OAuth/email runs, or the embedded wallet is still arriving.
  const entering = !ready || loggingIn || (authenticated && !address);
  const owned = useQuery({
    queryKey: ['owned-artist', address],
    queryFn: () => fetchOwnedArtist(address ?? ''),
    enabled: Boolean(authenticated && address),
  });
  const onMauro = useSupporter(authenticated ? 2n : undefined, address);
  const onCopleros = useSupporter(authenticated ? 1n : undefined, address);

  const pioneer =
    onMauro.data && onMauro.data.rank > 0
      ? { artistId: 2, rank: onMauro.data.rank }
      : onCopleros.data && onCopleros.data.rank > 0
        ? { artistId: 1, rank: onCopleros.data.rank }
        : null;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  if (entering) {
    return (
      <button type="button" disabled aria-busy="true" className={enterPill}>
        <span className="loading-mark h-3.5 w-3.5" aria-hidden="true">
          <span className="loading-mark-ring" />
        </span>
        <span>{authenticated ? 'Cargando…' : 'Entrando…'}</span>
      </button>
    );
  }

  if (!authenticated || !address) {
    return (
      <button type="button" onClick={() => openEntry()} className={enterPill}>
        Entrar
      </button>
    );
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const tail = address.slice(-4);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 max-w-[5.75rem] items-center gap-1 rounded-xl bg-surface-container-high px-2 shadow-md transition-transform active:scale-95 sm:max-w-none sm:gap-1.5 sm:rounded-full sm:px-3"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Cuenta ${shortAddress(address)}`}
      >
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
        <span className="truncate font-mono text-[0.625rem] text-primary sm:text-[0.6875rem]">
          <span className="sm:hidden">{tail}</span>
          <span className="hidden sm:inline">{shortAddress(address)}</span>
        </span>
        <Icon name="chevron-down" className={`hidden h-3 w-3 shrink-0 text-outline transition-transform duration-200 sm:inline ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-[80] mt-2 flex w-56 flex-col gap-0.5 rounded-xl border border-ink/10 bg-surface-container-high p-1 shadow-2xl dark:border-cream/10"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void copyAddress();
            }}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs text-on-surface transition-colors hover:bg-surface-container"
          >
            <span>Copiar dirección</span>
            <span className="font-mono text-[10px] text-outline">{tail}</span>
          </button>

          {copied ? (
            <div className="mx-1 my-1 flex items-center gap-1.5 rounded-full bg-secondary/15 px-2.5 py-1">
              <span className="font-mono text-[11px] font-medium tracking-tight text-secondary">
                Dirección copiada
              </span>
            </div>
          ) : null}

          {owned.data?.id ? (
            <Link
              to={`/artist/${owned.data.id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center rounded-lg px-2 py-2 text-xs text-on-surface hover:bg-surface-container"
            >
              Mi perfil de artista
            </Link>
          ) : (
            <Link
              to="/?alta=1"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center rounded-lg px-2 py-2 text-xs text-on-surface hover:bg-surface-container"
            >
              Crear mi perfil de artista
            </Link>
          )}

          {pioneer ? (
            <>
              <div className="mx-1 my-1 h-px bg-surface-container-highest" />
              <Link
                to={`/artist/${pioneer.artistId}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded px-2 py-1.5 font-mono text-[11px] text-tertiary transition-colors hover:bg-surface-container"
              >
                <span>Mi registro de pionero</span>
                <span className="text-[10px] text-outline">
                  #{pioneer.rank.toString().padStart(4, '0')}
                </span>
              </Link>
            </>
          ) : null}

          <div className="mx-1 my-1 h-px bg-surface-container-highest" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="w-full rounded-lg px-2 py-2 text-left text-xs text-vino-700 transition-colors hover:bg-surface-container"
          >
            Salir de la cuenta
          </button>
        </div>
      ) : null}
    </div>
  );
}
