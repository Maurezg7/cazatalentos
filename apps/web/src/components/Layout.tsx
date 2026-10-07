import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { hasWalletSession, useEntrySignal } from '../lib/entry-signal';

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
  const shouldLoad = walletRequested || pathname !== '/' || hasWalletSession();

  useEffect(() => {
    if (!shouldLoad || WalletStack) return;
    let cancelled = false;
    void import('../providers/WalletStack').then((mod) => {
      if (!cancelled) setWalletStack(() => mod.WalletStack);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, WalletStack]);

  const shell = (holdOutlet = false) => (
    <div className="flex min-h-dvh justify-center bg-paper font-body text-ink dark:bg-night dark:text-cream">
      <div className="relative flex min-h-dvh w-full max-w-[480px] flex-col lg:max-w-none">
        <header className="app-header sticky top-0 z-50 border-b border-ink/10 pt-[env(safe-area-inset-top,0px)] dark:border-cream/10">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <Link to="/" className="flex h-11 items-center" aria-label="Cazatalentos" onClick={() => setMenuOpen(false)}>
              <img src="/logo-light.svg" alt="" className="h-8 w-auto dark:hidden lg:h-9" />
              <img src="/logo.svg" alt="" className="hidden h-8 w-auto dark:block lg:h-9" />
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              <Link to="/explorar" className="text-sm font-semibold tracking-wide uppercase">Explorar</Link>
              <Link to="/como-funciona" className="text-sm font-semibold tracking-wide uppercase">Cómo funciona</Link>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeButton />
              {WalletStack ? (
                <Suspense fallback={<button type="button" disabled aria-busy="true" className={`${enterPill} opacity-70`}>Cargando…</button>}>
                  <ConnectButton />
                </Suspense>
              ) : (
                <button
                  type="button"
                  aria-busy={walletRequested}
                  onClick={openEntry}
                  className={enterPill}
                >
                  {walletRequested ? 'Cargando…' : 'Entrar'}
                </button>
              )}
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink/20 lg:hidden dark:border-cream/20"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <Icon name="x" className="h-5 w-5" /> : <Icon name="list" className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {menuOpen ? (
            <nav className="flex flex-col gap-1 px-4 pb-4 lg:hidden">
              <Link to="/explorar" onClick={() => setMenuOpen(false)} className="flex h-11 items-center text-sm font-semibold uppercase tracking-wide">Explorar</Link>
              <Link to="/como-funciona" onClick={() => setMenuOpen(false)} className="flex h-11 items-center text-sm font-semibold uppercase tracking-wide">Cómo funciona</Link>
            </nav>
          ) : null}
        </header>
        <main className="flex-1 px-4 pb-10 lg:px-8 lg:pb-16 xl:px-12">
          {holdOutlet || (pathname !== '/' && !WalletStack) ? (
            <p className="pt-8 text-center font-mono text-[0.6875rem] uppercase tracking-wider text-outline">
              Cargando…
            </p>
          ) : (
            <Outlet />
          )}
        </main>
        {walletRequested && !WalletStack ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 lg:items-center" role="status">
            <p className="mb-8 rounded-2xl bg-paper px-6 py-4 font-body text-sm font-semibold text-ink shadow-lg dark:bg-night dark:text-cream lg:mb-0">
              Cargando tu entrada…
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!WalletStack) return shell();

  return (
    <WalletStack>
      <Suspense fallback={shell(true)}>
        <EntrySheetProvider>{shell()}</EntrySheetProvider>
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
