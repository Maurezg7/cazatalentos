import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type RequestStore = {
  requestId: string;
};

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function currentRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function resolveRequestId(header: string | string[] | undefined): string {
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim().slice(0, 80);
  }
  if (Array.isArray(header) && header[0] && header[0].trim().length > 0) {
    return header[0].trim().slice(0, 80);
  }
  return randomUUID();
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return requestContext.run({ requestId }, fn);
}
