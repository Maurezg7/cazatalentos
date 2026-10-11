import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../lib/observability/toast';
import { EntrySignalProvider } from '../lib/entry-signal';
import { warmAppData } from '../lib/prefetch';
import { MotionProvider } from '../effects/MotionProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    warmAppData(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <EntrySignalProvider>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </EntrySignalProvider>
    </QueryClientProvider>
  );
}
