import { Link, Outlet } from 'react-router-dom';
import { ConnectButton } from './ConnectButton';
import { EntrySheetProvider } from './EntrySheet';

export function Layout() {
  return (
    <EntrySheetProvider>
    <div className="flex min-h-dvh justify-center bg-surface-container-lowest text-on-surface">
      <div className="relative flex min-h-dvh w-full max-w-[480px] flex-col bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:max-w-none lg:shadow-none">
        <header className="sticky top-0 z-50 bg-surface/80 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-4 lg:h-16 lg:px-8 xl:px-12">
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className="font-serif text-[1.75rem] font-medium italic leading-none tracking-tight text-on-surface transition-colors hover:text-primary lg:text-[2rem]"
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
        <main className="flex-1 px-4 pb-10 lg:px-8 lg:pb-16 xl:px-12">
          <Outlet />
        </main>
      </div>
    </div>
    </EntrySheetProvider>
  );
}
