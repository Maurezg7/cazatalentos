import type { AppError } from '@cazatalentos/shared';
import { log } from './logger';

export function reportObservability(error: AppError): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  log.info('sentry_event', {
    requestId: error.requestId,
    code: error.code,
    layer: error.layer,
  });
}
