import {
  AppError,
  contractRevertCode,
  type ErrorCode,
  type ErrorLayer,
} from '@cazatalentos/shared';
import {
  BaseError,
  ContractFunctionRevertedError,
  TimeoutError,
  UserRejectedRequestError,
} from 'viem';

const MONAD_CHAIN_ID = 10143;

export function userFacingMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) return error.userMessage;
  return fallback;
}

export function decodeContractError(
  error: unknown,
  requestId?: string,
  extra?: Record<string, unknown>,
): AppError {
  if (error instanceof AppError) {
    return requestId && !error.requestId
      ? AppError.fromCode(error.code, error.layer, { ...error.context, ...extra }, error.cause, requestId)
      : error;
  }

  const text = flattenErrorText(error);

  if (isUserRejected(error, text)) {
    return AppError.fromCode('TX_USER_REJECTED', 'web', extra, error, requestId);
  }
  if (isInsufficientFunds(text)) {
    return AppError.fromCode('TX_INSUFFICIENT_FUNDS', 'web', extra, error, requestId);
  }
  if (isWrongChain(error, text)) {
    return AppError.fromCode('WRONG_CHAIN', 'web', extra, error, requestId);
  }
  if (isRpcTimeout(error, text)) {
    return AppError.fromCode('RPC_TIMEOUT', 'web', extra, error, requestId);
  }

  const reverted = walkRevert(error);
  if (reverted) {
    const code = contractRevertCode(reverted.errorName) as ErrorCode;
    return AppError.fromCode(
      code === 'UNKNOWN' ? 'UNKNOWN' : code,
      'contract',
      { errorName: reverted.errorName, args: serializeArgs(reverted.args), ...extra },
      error,
      requestId,
    );
  }

  return AppError.fromCode('UNKNOWN', layerFromText(text), extra, error, requestId);
}

function walkRevert(error: unknown): { errorName: string; args: readonly unknown[] } | undefined {
  if (error instanceof BaseError) {
    const reverted = error.walk((err) => err instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError && reverted.data?.errorName) {
      return { errorName: reverted.data.errorName, args: reverted.data.args ?? [] };
    }
  }
  if (error && typeof error === 'object' && 'walk' in error && typeof error.walk === 'function') {
    try {
      const found = (error as BaseError).walk((err) => err instanceof ContractFunctionRevertedError);
      if (found instanceof ContractFunctionRevertedError && found.data?.errorName) {
        return { errorName: found.data.errorName, args: found.data.args ?? [] };
      }
    } catch {
      // ignore walk failures on non-viem objects
    }
  }
  const text = flattenErrorText(error);
  const named = /reverted with the following reason:\s*(\w+)/i.exec(text);
  if (named?.[1]) return { errorName: named[1], args: [] };
  if (error && typeof error === 'object' && 'cause' in error) {
    return walkRevert((error as { cause: unknown }).cause);
  }
  return undefined;
}

function isUserRejected(error: unknown, text: string): boolean {
  if (error instanceof UserRejectedRequestError) return true;
  if (error instanceof BaseError) {
    const found = error.walk((err) => err instanceof UserRejectedRequestError);
    if (found) return true;
  }
  return (
    text.includes('user rejected') ||
    text.includes('rejected the request') ||
    text.includes('denied') ||
    text.includes('4001')
  );
}

function isInsufficientFunds(text: string): boolean {
  return (
    text.includes('insufficient funds') ||
    text.includes('exceeds the balance') ||
    text.includes('insufficient balance')
  );
}

function isWrongChain(error: unknown, text: string): boolean {
  if (error && typeof error === 'object' && 'chainId' in error) {
    const chainId = Number((error as { chainId?: unknown }).chainId);
    if (Number.isFinite(chainId) && chainId !== MONAD_CHAIN_ID) return true;
  }
  return (
    text.includes('chain mismatch') ||
    text.includes('wrong chain') ||
    text.includes('unsupported chain') ||
    text.includes('does not match the target chain')
  );
}

function isRpcTimeout(error: unknown, text: string): boolean {
  if (error instanceof TimeoutError) return true;
  return text.includes('timeout') || text.includes('timed out') || text.includes('aborted');
}

function flattenErrorText(error: unknown): string {
  const parts: string[] = [];
  if (error instanceof Error) parts.push(error.message, error.name);
  if (error && typeof error === 'object') {
    if ('shortMessage' in error && typeof error.shortMessage === 'string') parts.push(error.shortMessage);
    if ('details' in error && typeof error.details === 'string') parts.push(error.details);
    if ('code' in error) parts.push(String(error.code));
  }
  return parts.join(' ').toLowerCase();
}

function serializeArgs(args: readonly unknown[]): unknown {
  return args.map((value) => (typeof value === 'bigint' ? value.toString() : value));
}

function layerFromText(text: string): ErrorLayer {
  if (text.includes('revert') || text.includes('contract')) return 'contract';
  return 'web';
}
