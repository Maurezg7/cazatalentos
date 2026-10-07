import { BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

type SentBody = { code?: string; message?: string; requestId?: string; stack?: string };

function mockHost(requestId: string): {
  host: { switchToHttp: () => { getResponse: () => unknown; getRequest: () => unknown } };
  status: () => number;
  body: () => SentBody | undefined;
} {
  let status = 0;
  let body: SentBody | undefined;
  const reply = {
    status(code: number) {
      status = code;
      return reply;
    },
    header() {
      return reply;
    },
    send(payload: SentBody) {
      body = payload;
      return reply;
    },
  };
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => reply,
        getRequest: () => ({
          url: '/api/pools/register',
          method: 'POST',
          headers: { 'x-request-id': requestId },
        }),
      }),
    },
    status: () => status,
    body: () => body,
  };
}

describe('AllExceptionsFilter', () => {
  const previousEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previousEnv;
  });

  it('returns a safe body with code, message and requestId in production', () => {
    process.env.NODE_ENV = 'production';
    const filter = new AllExceptionsFilter();
    const ctx = mockHost('req-e');
    filter.catch(new BadRequestException({ message: ['description must be longer'] }), ctx.host as never);
    expect(ctx.status()).toBe(400);
    expect(ctx.body()).toEqual({
      code: 'VALIDATION_FAILED',
      message: expect.stringContaining('datos'),
      requestId: 'req-e',
    });
    expect(ctx.body()?.stack).toBeUndefined();
  });

  it('includes a stack only outside production', () => {
    process.env.NODE_ENV = 'development';
    const filter = new AllExceptionsFilter();
    const ctx = mockHost('req-dev');
    filter.catch(new Error('boom'), ctx.host as never);
    expect(ctx.body()?.code).toBe('UNKNOWN');
    expect(ctx.body()?.requestId).toBe('req-dev');
    expect(ctx.body()?.stack).toBeDefined();
  });
});
