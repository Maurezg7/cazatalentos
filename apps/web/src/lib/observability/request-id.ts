let currentRequestId: string | undefined;
const txByRequest = new Map<string, string>();

export function createRequestId(): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  currentRequestId = id;
  return id;
}

export function getRequestId(): string | undefined {
  return currentRequestId;
}

export function setRequestId(id: string): void {
  currentRequestId = id;
}

export function attachTxHash(requestId: string, txHash: string): void {
  txByRequest.set(requestId, txHash);
}

export function txHashFor(requestId: string | undefined): string | undefined {
  return requestId ? txByRequest.get(requestId) : undefined;
}
