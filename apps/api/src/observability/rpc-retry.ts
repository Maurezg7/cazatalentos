import { AppError } from '@cazatalentos/shared';
import { currentRequestId } from './request-context';

const DELAYS_MS = [200, 800, 2000];

export async function withRpcRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= DELAYS_MS.length; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const delay = DELAYS_MS[attempt];
      if (delay === undefined) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw AppError.fromCode(
    'RPC_TIMEOUT',
    'indexer',
    { label, attempts: DELAYS_MS.length + 1 },
    lastError,
    currentRequestId(),
  );
}
