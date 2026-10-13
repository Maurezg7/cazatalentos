import { type ReactNode, useState } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ToastProvider } from '../lib/observability/toast';
import { EntrySignalProvider } from '../lib/entry-signal';
import { warmAppData } from '../lib/prefetch';
import {
  createAppPersister,
  createAppQueryClient,
  QUERY_CACHE_MAX_AGE,
  shouldPersistQuery,
} from '../lib/query-persist';
import { MotionProvider } from '../effects/MotionProvider';
import { LocaleProvider } from '../i18n/LocaleContext';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());
  const [persister] = useState(() => createAppPersister());
  const [cacheReady, setCacheReady] = useState(false);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: QUERY_CACHE_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistQuery,
        },
      }}
      onSuccess={() => {
        setCacheReady(true);
        warmAppData(queryClient);
      }}
      onError={() => {
        setCacheReady(true);
        warmAppData(queryClient);
      }}
    >
      <LocaleProvider>
        <EntrySignalProvider>
          <MotionProvider>
            <ToastProvider>{cacheReady ? children : null}</ToastProvider>
          </MotionProvider>
        </EntrySignalProvider>
      </LocaleProvider>
    </PersistQueryClientProvider>
  );
}
