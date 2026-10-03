type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel(): LogLevel {
  const raw = import.meta.env.VITE_LOG_LEVEL;
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return import.meta.env.DEV ? 'debug' : 'info';
}

function emit(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  if (ORDER[level] < ORDER[currentLevel()]) return;
  const line = {
    level,
    message,
    time: new Date().toISOString(),
    ...extra,
  };
  const payload = JSON.stringify(line);
  if (level === 'error') {
    globalThis.console.error(payload);
    return;
  }
  if (level === 'warn') {
    globalThis.console.warn(payload);
    return;
  }
  globalThis.console.info(payload);
}

export const log = {
  debug: (message: string, extra?: Record<string, unknown>) => emit('debug', message, extra),
  info: (message: string, extra?: Record<string, unknown>) => emit('info', message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => emit('warn', message, extra),
  error: (message: string, extra?: Record<string, unknown>) => emit('error', message, extra),
};
