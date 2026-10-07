import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { fetchOwnedArtist } from '../lib/api';
import { Icon } from './Icon';
import { useEntrySheet } from './EntrySheet';
import { shortAddress } from '../lib/format';
import { useSupporter } from '../lib/hooks';

const enterPill =
  'h-11 min-w-[44px] rounded-full bg-surface-container-high px-4 font-mono text-[0.6875rem] uppercase tracking-wide text-on-surface transition-colors hover:bg-surface-variant';

export function ConnectButton() {
  const { ready, authenticated, logout } = usePrivy();
  const { openEntry } = useEntrySheet();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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

  if (!ready || (authenticated && !address)) {
    return (
      <button type="button" disabled aria-busy="true" className={`${enterPill} opacity-70`}>
        Cargando…
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-1.5 rounded-full bg-surface-container-high px-3 shadow-md transition-transform active:scale-95"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary" />
        <span className="font-mono text-[0.6875rem] text-primary">{shortAddress(address)}</span>
        <Icon name="chevron-down" className={`h-3 w-3 text-outline transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 flex w-56 flex-col gap-0.5 rounded-xl bg-surface-container-high p-1 shadow-2xl"
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
