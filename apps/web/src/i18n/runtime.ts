export type Locale = 'en' | 'es';

export const LOCALE_STORAGE_KEY = 'ct-locale';
export const DEFAULT_LOCALE: Locale = 'en';

let current: Locale = DEFAULT_LOCALE;

export function getLocale(): Locale {
  return current;
}

export function setRuntimeLocale(locale: Locale): void {
  current = locale;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'es' ? 'es' : 'en';
  }
}

export function readStoredLocale(): Locale {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (value === 'en' || value === 'es') return value;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}
