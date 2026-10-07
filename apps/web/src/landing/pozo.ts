export type PozoEstado = 'en_curso' | 'cumplida' | 'no_cumplida';

export type Pozo = {
  id: number;
  artistaId: number;
  artista: string;
  ciudad: string;
  montoWei: bigint;
  metaWei: bigint | null;
  metaTexto: string;
  pioneros: number;
  cupoMaximo: number | null;
  cierraEn: string;
  portada: string | null;
  estado: PozoEstado;
  abierto: boolean;
};

export function formatMonFromWei(wei: bigint): string {
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  const whole = abs / 10n ** 18n;
  const frac = (abs % 10n ** 18n) / 10n ** 15n;
  const wholeText = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(whole);
  const body = frac === 0n ? wholeText : `${wholeText},${frac.toString().padStart(3, '0')}`;
  return `${negative ? '-' : ''}${body} MON`;
}

export function goalPercent(current: bigint, goal: bigint | null): number {
  if (goal === null || goal <= 0n || current < 0n) return 0;
  const pct = (current * 100n) / goal;
  if (pct > 100n) return 100;
  return Number(pct);
}

export function freeSlots(used: number, max: number | null): number {
  if (max === null || !Number.isFinite(used) || !Number.isFinite(max) || max <= 0) return 0;
  const taken = Math.max(0, Math.floor(used));
  return Math.max(0, Math.min(max, max - taken));
}

export function entryDigits(n: number): string {
  if (!Number.isInteger(n) || n < 0) return '000';
  return String(n).padStart(3, '0');
}
