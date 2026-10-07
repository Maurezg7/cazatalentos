import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { httpStatusFor, mapException } from './map-exception';

describe('mapException', () => {
  it('maps validation errors', () => {
    const mapped = mapException(new BadRequestException({ message: ['description must be longer'] }), 'req-val');
    expect(mapped.code).toBe('VALIDATION_FAILED');
    expect(mapped.layer).toBe('api');
    expect(mapped.requestId).toBe('req-val');
    expect(mapped.hint).toContain('class-validator');
    expect(httpStatusFor(mapped)).toBe(400);
  });

  it('maps prisma connection loss to DB_UNAVAILABLE', () => {
    const error = new Prisma.PrismaClientKnownRequestError('closed', {
      code: 'P1001',
      clientVersion: '7.10.0',
    });
    const mapped = mapException(error, 'req-db');
    expect(mapped.code).toBe('DB_UNAVAILABLE');
    expect(mapped.requestId).toBe('req-db');
    expect(httpStatusFor(mapped)).toBe(503);
  });

  it('maps unique constraint to DB_CONSTRAINT', () => {
    const error = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: { target: ['id'] },
    });
    expect(mapException(error).code).toBe('DB_CONSTRAINT');
  });

  it('maps rate limits', () => {
    expect(mapException(new ThrottlerException()).code).toBe('RATE_LIMITED');
  });

  it('maps upload too large and invalid type', () => {
    const large = mapException(new PayloadTooLargeException(), 'req-up');
    expect(large.code).toBe('UPLOAD_TOO_LARGE');
    expect(large.requestId).toBe('req-up');
    const invalid = mapException({ code: 'FST_INVALID', message: 'invalid mime type' }, 'req-mime');
    expect(invalid.code).toBe('UPLOAD_INVALID_TYPE');
    expect(invalid.hint).toContain('MIME');
  });

  it('maps SIWE-looking errors', () => {
    expect(mapException(new Error('invalid SIWE nonce')).code).toBe('AUTH_INVALID_SIWE');
  });

  it('maps RPC timeouts', () => {
    expect(mapException(new Error('request timed out')).code).toBe('RPC_TIMEOUT');
  });
});
