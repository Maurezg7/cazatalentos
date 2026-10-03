import { PINO_REDACT_PATHS, redactValue, shouldOmitBody } from './redaction';

describe('redaction', () => {
  it('covers required secret paths', () => {
    expect(PINO_REDACT_PATHS).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        '*.key',
        '*.secret',
        '*.token',
        '*.password',
      ]),
    );
  });

  it('omits upload bodies', () => {
    expect(shouldOmitBody('multipart/form-data; boundary=x', '/api/media')).toBe(true);
    expect(shouldOmitBody('application/json', '/api/pools/register')).toBe(false);
  });

  it('redacts secret-looking keys', () => {
    expect(redactValue('authorization', 'Bearer abc')).toBe('[Redacted]');
    expect(redactValue('faucetPrivateKey', '00')).toBe('[Redacted]');
    expect(redactValue('description', 'hola')).toBe('hola');
  });
});
