import { Link, Outlet } from 'react-router-dom';
import { ConnectButton } from './ConnectButton';

export function Layout() {
  return (
    <div className="flex min-h-dvh justify-center bg-surface-container-lowest text-on-surface">
      <div className="relative flex w-full min-h-dvh max-w-[480px] flex-col bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <header className="sticky top-0 z-50 bg-surface/80 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className="font-serif text-[1.75rem] font-medium italic leading-none tracking-tight text-on-surface transition-colors hover:text-primary"
              >
                Cazatalentos
              </Link>
              {import.meta.env.DEV ? (
                <span className="rounded-full bg-surface-container-high px-1 py-0.5 font-mono text-[0.6875rem] uppercase leading-none tracking-wider text-tertiary">
                  DEV
                </span>
              ) : null}
            </div>
            <ConnectButton />
          </div>
        </header>
        <main className="flex-1 px-4 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
