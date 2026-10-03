import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { AppError, type ErrorCode, type ErrorLayer } from '@cazatalentos/shared';

export function mapException(error: unknown, requestId?: string): AppError {
  if (error instanceof AppError) {
    return requestId && !error.requestId
      ? AppError.fromCode(error.code, error.layer, error.context, error.cause, requestId)
      : error;
  }

  if (error instanceof ThrottlerException) {
    return AppError.fromCode('RATE_LIMITED', 'api', {}, error, requestId);
  }

  if (error instanceof PayloadTooLargeException) {
    return AppError.fromCode('UPLOAD_TOO_LARGE', 'api', {}, error, requestId);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return AppError.fromCode(
        'DB_CONSTRAINT',
        'api',
        { prismaCode: error.code, target: error.meta?.target },
        error,
        requestId,
      );
    }
    if (error.code === 'P2025') {
      return AppError.fromCode(
        'DB_CONSTRAINT',
        'api',
        { prismaCode: error.code, model: error.meta?.modelName },
        error,
        requestId,
      );
    }
    if (error.code === 'P1001' || error.code === 'P1017' || error.code === 'P1002') {
      return AppError.fromCode('DB_UNAVAILABLE', 'api', { prismaCode: error.code }, error, requestId);
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return AppError.fromCode('DB_UNAVAILABLE', 'api', { prismaCode: 'init' }, error, requestId);
  }

  if (isUploadError(error)) {
    return mapUpload(error, requestId);
  }

  if (isSiweError(error)) {
    return AppError.fromCode('AUTH_INVALID_SIWE', 'api', {}, error, requestId);
  }

  if (isRpcTimeout(error)) {
    return AppError.fromCode('RPC_TIMEOUT', 'api', {}, error, requestId);
  }

  if (error instanceof BadRequestException) {
    return AppError.fromCode(
      'VALIDATION_FAILED',
      'api',
      { fields: exceptionResponse(error) },
      error,
      requestId,
    );
  }

  if (error instanceof NotFoundException) {
    return AppError.fromCode('DB_CONSTRAINT', 'api', { reason: 'not_found' }, error, requestId);
  }

  if (error instanceof ForbiddenException) {
    return AppError.fromCode('AUTH_INVALID_SIWE', 'api', { reason: 'forbidden' }, error, requestId);
  }

  if (error instanceof HttpException) {
    const status = error.getStatus();
    const code: ErrorCode = status === 429 ? 'RATE_LIMITED' : status === 400 ? 'VALIDATION_FAILED' : 'UNKNOWN';
    const layer: ErrorLayer = 'api';
    return AppError.fromCode(code, layer, { status }, error, requestId);
  }

  return AppError.fromCode('UNKNOWN', 'api', {}, error, requestId);
}

export function httpStatusFor(error: AppError): number {
  switch (error.code) {
    case 'VALIDATION_FAILED':
    case 'UPLOAD_INVALID_TYPE':
      return 400;
    case 'AUTH_INVALID_SIWE':
      return 401;
    case 'DB_CONSTRAINT':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    case 'UPLOAD_TOO_LARGE':
      return 413;
    case 'DB_UNAVAILABLE':
    case 'RPC_TIMEOUT':
    case 'INDEXER_DECODE_FAILED':
    case 'INDEXER_LAG':
      return 503;
    default:
      return 500;
  }
}

function exceptionResponse(error: HttpException): unknown {
  const response = error.getResponse();
  if (typeof response === 'object' && response !== null && 'message' in response) {
    return (response as { message: unknown }).message;
  }
  return response;
}

function isUploadError(error: unknown): error is { code?: string; message?: string } {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  return (
    code.includes('FILE_TOO_LARGE') ||
    code.includes('CTP_BODY_TOO_LARGE') ||
    message.toLowerCase().includes('file too large') ||
    message.toLowerCase().includes('unsupported media') ||
    message.toLowerCase().includes('invalid mime')
  );
}

function mapUpload(error: { code?: string; message?: string }, requestId?: string): AppError {
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  if (text.includes('mime') || text.includes('media') || text.includes('type')) {
    return AppError.fromCode('UPLOAD_INVALID_TYPE', 'api', { code: error.code }, error, requestId);
  }
  return AppError.fromCode('UPLOAD_TOO_LARGE', 'api', { code: error.code }, error, requestId);
}

function isSiweError(error: unknown): boolean {
  const text = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return text.includes('siwe') || text.includes('invalid nonce') || text.includes('invalid signature');
}

function isRpcTimeout(error: unknown): boolean {
  const text = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('aborted') ||
    text.includes('econnreset')
  );
}
