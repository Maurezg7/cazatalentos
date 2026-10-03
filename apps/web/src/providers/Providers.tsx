import { type ReactNode, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { monadTestnet } from '../lib/chain';
import { wagmiConfig } from '../lib/wagmi';

export function Providers({ children }: { children: ReactNode }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;
  if (!appId) {
    throw new Error(
      'Falta VITE_PRIVY_APP_ID. Copiá el App ID (no el Client ID ni el App Secret) desde Privy Dashboard → App settings → Basics → API keys a apps/web/.env y reiniciá el dev server.',
    );
  }

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        },
        supportedChains: [monadTestnet],
        defaultChain: monadTestnet,
        appearance: {
          theme: 'light',
          accentColor: '#c8892f',
          logo: undefined,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
