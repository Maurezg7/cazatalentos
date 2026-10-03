/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_CAZATALENTOS_ADDRESS: `0x${string}`;
  readonly VITE_MONAD_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
