import { type ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { monadTestnet } from '../lib/chain';
import { wagmiConfig } from '../lib/wagmi';

export function WalletStack({ children }: { children: ReactNode }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;
  if (!appId) {
    throw new Error(
      'Falta VITE_PRIVY_APP_ID. Copiá el App ID desde Privy Dashboard a apps/web/.env y reiniciá el servidor.',
    );
  }

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
          theme: 'dark',
          accentColor: '#fd971f',
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </PrivyProvider>
  );
}
