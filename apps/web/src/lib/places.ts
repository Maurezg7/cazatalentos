export const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'PE', name: 'Perú' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'VE', name: 'Venezuela' },
] as const;

export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join('');
}

export const REEL_FILTERS = [
  { id: 'none', label: 'Normal', css: 'none' },
  { id: 'warm', label: 'Cálido', css: 'sepia(0.4) saturate(1.35)' },
  { id: 'cold', label: 'Frío', css: 'saturate(0.85) hue-rotate(18deg)' },
  { id: 'mono', label: 'Blanco y negro', css: 'grayscale(1) contrast(1.1)' },
  { id: 'vivid', label: 'Vivo', css: 'saturate(1.7) contrast(1.08)' },
  { id: 'fade', label: 'Velado', css: 'contrast(0.9) brightness(1.08) saturate(0.75)' },
] as const;

export function reelFilterCss(id: string): string {
  return REEL_FILTERS.find((filter) => filter.id === id)?.css ?? 'none';
}
