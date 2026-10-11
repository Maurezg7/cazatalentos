import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { LoadingState } from './LoadingState';
import { hasWalletSession, useEntrySignal } from '../lib/entry-signal';
import { WalletReadyProvider } from '../lib/wallet-ready';

const ConnectButton = lazy(() => import('./ConnectButton').then((m) => ({ default: m.ConnectButton })));
const EntrySheetProvider = lazy(() =>
  import('./EntrySheet').then((m) => ({ default: m.EntrySheetProvider })),
);

const enterPill =
  'inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl bg-terracotta px-4 font-body text-sm font-bold text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:bg-terracotta-dark dark:focus-visible:outline-cream';

export function Layout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { openEntry, walletRequested } = useEntrySignal();
  const [WalletStack, setWalletStack] = useState<ComponentType<{ children: ReactNode }> | null>(null);
  const needsWalletNow =
    walletRequested || pathname.startsWith('/pool') || hasWalletSession();
  const shouldLoad =
    needsWalletNow ||
    pathname === '/' ||
    pathname.startsWith('/artist') ||
    pathname === '/explorar' ||
    pathname === '/como-funciona';

  useEffect(() => {
    if (!shouldLoad || WalletStack) return;
    let cancelled = false;
    const load = () => {
      void import('../providers/WalletStack').then((mod) => {
        if (!cancelled) setWalletStack(() => mod.WalletStack);
      });
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (needsWalletNow || pathname.startsWith('/artist')) {
      load();
    } else if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(load, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(load, 200);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [shouldLoad, needsWalletNow, pathname, WalletStack]);

  const frame = (
    <div className="flex min-h-dvh justify-center bg-paper font-body text-ink dark:bg-night dark:text-cream">
      <div className="relative flex min-h-dvh w-full min-w-0 max-w-[480px] flex-col md:max-w-none">
        <header className="app-header sticky top-0 z-50 border-b border-ink/10 pt-[env(safe-area-inset-top,0px)] dark:border-cream/10">
          <div className="flex h-16 items-center justify-between gap-2 px-4 md:gap-3 md:px-8">
            <Link to="/" className="flex h-11 min-w-0 items-center" aria-label="Cazatalentos" onClick={() => setMenuOpen(false)}>
              <img src="/logo-light.svg" alt="" className="h-8 w-auto max-w-[9.5rem] object-contain object-left dark:hidden sm:max-w-none md:h-9" />
              <img src="/logo.svg" alt="" className="hidden h-8 w-auto max-w-[9.5rem] object-contain object-left dark:block sm:max-w-none md:h-9" />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link to="/explorar" className="text-sm font-semibold tracking-wide uppercase">Explorar</Link>
              <Link to="/como-funciona" className="text-sm font-semibold tracking-wide uppercase">Cómo funciona</Link>
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeButton />
              {WalletStack ? (
                <Suspense
                  fallback={
                    <button type="button" disabled aria-busy="true" className={`${enterPill} inline-flex items-center gap-2 opacity-70`}>
                      <span className="loading-mark h-3.5 w-3.5" aria-hidden="true">
                        <span className="loading-mark-ring" />
                      </span>
                      <span>Cargando…</span>
                    </button>
                  }
                >
                  <ConnectButton />
                </Suspense>
              ) : (
                <button
                  type="button"
                  aria-busy={walletRequested}
                  onClick={openEntry}
                  className={`${enterPill} inline-flex items-center gap-2`}
                >
                  {walletRequested ? (
                    <>
                      <span className="loading-mark h-3.5 w-3.5" aria-hidden="true">
                        <span className="loading-mark-ring" />
                      </span>
                      <span>Cargando…</span>
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              )}
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/20 md:hidden dark:border-cream/20"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <Icon name="x" className="h-5 w-5" /> : <Icon name="list" className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {menuOpen ? (
            <nav className="flex flex-col gap-1 px-4 pb-4 md:hidden">
              <Link to="/explorar" onClick={() => setMenuOpen(false)} className="flex h-11 items-center text-sm font-semibold uppercase tracking-wide">Explorar</Link>
              <Link to="/como-funciona" onClick={() => setMenuOpen(false)} className="flex h-11 items-center text-sm font-semibold uppercase tracking-wide">Cómo funciona</Link>
            </nav>
          ) : null}
        </header>
        <main className="min-w-0 flex-1 px-4 pb-10 md:px-8 md:pb-16 xl:px-12">
          <Outlet />
        </main>
        {walletRequested && !WalletStack ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 lg:items-center">
            <div className="mb-8 w-full max-w-xs rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-6 py-2 shadow-lg lg:mb-0">
              <LoadingState label="Cargando tu entrada…" size="sm" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!WalletStack) {
    return <WalletReadyProvider ready={false}>{frame}</WalletReadyProvider>;
  }

  return (
    <WalletStack>
      <Suspense fallback={<WalletReadyProvider ready={false}>{frame}</WalletReadyProvider>}>
        <EntrySheetProvider>
          <WalletReadyProvider ready>{frame}</WalletReadyProvider>
        </EntrySheetProvider>
      </Suspense>
    </WalletStack>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A7.5 7.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThemeButton() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={dark ? 'Usar tema claro' : 'Usar tema oscuro'}
      onClick={() => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('ct-theme', next ? 'dark' : 'light');
        setDark(next);
      }}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink/20 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta dark:border-cream/20 dark:text-cream"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
