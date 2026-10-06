import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type EntrySignal = {
  openEntry: () => void;
  walletRequested: boolean;
  pendingEntry: boolean;
  authenticated: boolean;
  consumePendingEntry: () => void;
  setAuthenticated: (value: boolean) => void;
};

const EntrySignalContext = createContext<EntrySignal | null>(null);

export function EntrySignalProvider({ children }: { children: ReactNode }) {
  const [walletRequested, setWalletRequested] = useState(false);
  const [pendingEntry, setPendingEntry] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const value = useMemo<EntrySignal>(
    () => ({
      walletRequested,
      pendingEntry,
      authenticated,
      openEntry: () => {
        setWalletRequested(true);
        setPendingEntry(true);
      },
      consumePendingEntry: () => setPendingEntry(false),
      setAuthenticated,
    }),
    [authenticated, pendingEntry, walletRequested],
  );

  return <EntrySignalContext.Provider value={value}>{children}</EntrySignalContext.Provider>;
}

export function useEntrySignal(): EntrySignal {
  const value = useContext(EntrySignalContext);
  if (!value) throw new Error('useEntrySignal must be used within EntrySignalProvider');
  return value;
}

export function hasWalletSession(): boolean {
  try {
    return Object.keys(localStorage).some((key) => key.toLowerCase().includes('privy'));
  } catch {
    return false;
  }
}
