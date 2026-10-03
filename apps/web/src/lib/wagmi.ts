import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { monadTestnet } from './chain';

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(import.meta.env.VITE_MONAD_RPC_URL),
  },
});
