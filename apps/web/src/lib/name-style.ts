export const NAME_FONTS = [
  { id: 'display', label: 'Cartel' },
  { id: 'serif', label: 'Serif' },
  { id: 'sans', label: 'Recta' },
] as const;

export type NameFont = (typeof NAME_FONTS)[number]['id'];

export function nameFontClass(font: string | null): string {
  if (font === 'serif') return 'font-serif italic';
  if (font === 'sans') return 'font-sans not-italic';
  return 'font-display uppercase not-italic';
}

export function contrastRatio(wash: string, ink: string): number {
  const luminance = (hex: string) => {
    const channels = [0, 2, 4].map((offset) => {
      const value = Number.parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const [r = 0, g = 0, b = 0] = channels;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const lighter = Math.max(luminance(wash), luminance(ink));
  const darker = Math.min(luminance(wash), luminance(ink));
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableInk(ink: string | null, wash: string | null): string {
  const background = wash ?? '#14180f';
  const chosen = ink ?? '#f3e9d6';
  if (contrastRatio(background, chosen) >= 4.5) return chosen;
  return contrastRatio(background, '#1c1814') >= contrastRatio(background, '#f3e9d6') ? '#1c1814' : '#f3e9d6';
}
