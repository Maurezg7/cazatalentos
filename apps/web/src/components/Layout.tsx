import { Link, Outlet } from 'react-router-dom';
import { ConnectButton } from './ConnectButton';

export function Layout() {
  return (
    <div className="flex min-h-dvh justify-center bg-tierra-50 text-tierra-900">
      <div className="flex w-full max-w-[480px] flex-col">
        <header className="flex items-center justify-between px-5 pb-4 pt-6">
          <Link to="/" className="inline-block">
            <h1 className="font-serif text-2xl tracking-tight text-tierra-900">Cazatalentos</h1>
          </Link>
          <ConnectButton />
        </header>
        <main className="flex-1 px-5 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
