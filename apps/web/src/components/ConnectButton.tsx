import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { shortAddress } from '../lib/format';

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
      <button
        type="button"
        disabled
        className="rounded-full border border-tierra-100 px-3 py-1.5 text-sm text-tierra-700 opacity-50"
      >
        Entrar
      </button>
    );
  }

  if (!authenticated || !address) {
    return (
      <button
        type="button"
        onClick={() => login()}
        className="rounded-full border border-tierra-700 px-3 py-1.5 text-sm text-tierra-900"
      >
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
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-tierra-100 bg-white px-3 py-1.5 font-mono text-xs text-tierra-900"
      >
        {shortAddress(address)}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-tierra-100 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => {
              void copyAddress();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-tierra-900 hover:bg-tierra-50"
          >
            {copied ? 'Copiado' : 'Copiar dirección'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-tierra-900 hover:bg-tierra-50"
          >
            Salir
          </button>
        </div>
      )}
    </div>
  );
}
