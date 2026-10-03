export const PINO_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'req.headers["x-indexer-secret"]',
  '*.key',
  '*.secret',
  '*.token',
  '*.password',
  'req.body.file',
  'req.body.buffer',
  'req.body.data',
] as const;

export function shouldOmitBody(contentType: string | undefined, url: string | undefined): boolean {
  const type = contentType?.toLowerCase() ?? '';
  const path = url ?? '';
  return (
    type.includes('multipart/form-data') ||
    type.includes('application/octet-stream') ||
    path.includes('/upload') ||
    path.includes('/media')
  );
}

export function redactValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (
    lower.includes('key') ||
    lower.includes('secret') ||
    lower.includes('token') ||
    lower.includes('password') ||
    lower === 'authorization' ||
    lower === 'cookie'
  ) {
    return '[Redacted]';
  }
  return value;
}
