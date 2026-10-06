import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), ...(process.env.ANALYZE === '1' ? [visualizer({ filename: 'dist/stats.html', gzipSize: true })] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@cazatalentos/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    modulePreload: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/entry-[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['@privy-io/react-auth', '@privy-io/wagmi'],
  },
  server: {
    port: 5173,
    // Listen on IPv4 + IPv6 so both http://localhost:5173 and http://127.0.0.1:5173 work
    // (Privy allowed origins must match the exact host you open in the browser).
    host: true,
    warmup: {
      clientFiles: ['./src/main.tsx', './src/providers/Providers.tsx'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
  },
});
