import { type ErrorCode, type ErrorLayer, isErrorCode } from './codes';
import { lookupError } from './dictionary';

export type ErrorContext = Record<string, unknown>;

export type AppErrorInit = {
  code: ErrorCode;
  layer: ErrorLayer;
  context?: ErrorContext;
  cause?: unknown;
  requestId?: string;
  userMessage?: string;
  hint?: string;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly layer: ErrorLayer;
  readonly userMessage: string;
  readonly hint: string;
  readonly context: ErrorContext;
  readonly requestId?: string;
  override readonly cause?: unknown;

  constructor(init: AppErrorInit) {
    const copy = lookupError(init.code);
    super(init.userMessage ?? copy.userMessage);
    this.name = 'AppError';
    this.code = init.code;
    this.layer = init.layer;
    this.userMessage = init.userMessage ?? copy.userMessage;
    this.hint = init.hint ?? copy.hint;
    this.context = init.context ?? {};
    this.requestId = init.requestId;
    this.cause = init.cause;
  }

  static fromCode(
    code: ErrorCode,
    layer: ErrorLayer,
    context?: ErrorContext,
    cause?: unknown,
    requestId?: string,
  ): AppError {
    return new AppError({ code, layer, context, cause, requestId });
  }

  toLog(): Record<string, unknown> {
    return {
      code: this.code,
      layer: this.layer,
      requestId: this.requestId,
      hint: this.hint,
      cause: summarizeCause(this.cause),
      context: this.context,
      userMessage: this.userMessage,
    };
  }

  toClientBody(): { code: ErrorCode; message: string; requestId?: string } {
    return {
      code: this.code,
      message: this.userMessage,
      requestId: this.requestId,
    };
  }
}

export function asAppError(
  error: unknown,
  fallbackLayer: ErrorLayer,
  requestId?: string,
): AppError {
  if (error instanceof AppError) {
    if (requestId && !error.requestId) {
      return new AppError({
        code: error.code,
        layer: error.layer,
        context: error.context,
        cause: error.cause,
        requestId,
        userMessage: error.userMessage,
        hint: error.hint,
      });
    }
    return error;
  }
  return AppError.fromCode('UNKNOWN', fallbackLayer, {}, error, requestId);
}

export function parseErrorCode(value: unknown): ErrorCode | undefined {
  return typeof value === 'string' && isErrorCode(value) ? value : undefined;
}

function summarizeCause(cause: unknown): { name: string; message: string } | undefined {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message.slice(0, 300) };
  }
  if (typeof cause === 'string' && cause.length > 0) {
    return { name: 'Error', message: cause.slice(0, 300) };
  }
  return undefined;
}
