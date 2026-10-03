import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { shortAddress } from '../lib/format';

const pill =
  'h-11 min-w-[44px] rounded-full bg-surface-container-high px-4 font-mono text-[0.6875rem] uppercase tracking-wide text-on-surface transition-colors hover:bg-surface-variant';

export function ConnectButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  if (!ready) {
    return (
      <button type="button" disabled className={`${pill} opacity-50`}>
        Entrar
      </button>
    );
  }

  if (!authenticated || !address) {
    return (
      <button type="button" onClick={() => login()} className={pill}>
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

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className={pill}>
        {shortAddress(address)}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high shadow-sm">
          <button
            type="button"
            onClick={() => {
              void copyAddress();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-variant"
          >
            {copied ? 'Copiado' : 'Copiar dirección'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-variant"
          >
            Salir
          </button>
        </div>
      )}
    </div>
  );
}
