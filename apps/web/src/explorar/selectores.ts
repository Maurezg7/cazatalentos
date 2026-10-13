import { freeSlots, goalPercent } from '../landing/pozo';
import type { MessageKey } from '../i18n/messages';
import type { ArtistaExplorar, EstadoFiltro } from './tipos';

export type ChipPozo = 'has_slots' | 'last_slots' | 'closing_soon' | 'closed' | 'no_pool';

const CHIP_MESSAGE: Record<ChipPozo, MessageKey> = {
  has_slots: 'chipHasSlots',
  last_slots: 'chipLastSlots',
  closing_soon: 'chipClosingSoon',
  closed: 'chipClosed',
  no_pool: 'chipNoPool',
};

export function chipPozo(artista: ArtistaExplorar, now = Date.now()): ChipPozo {
  const pozo = artista.pozo;
  if (!pozo || !pozo.abierto) return pozo ? 'closed' : 'no_pool';
  const closes = Date.parse(pozo.cierraEn);
  if (Number.isFinite(closes) && closes - now < 3 * 24 * 60 * 60 * 1000 && closes > now) return 'closing_soon';
  const libres = freeSlots(artista.pioneros, pozo.cupoMaximo);
  if (pozo.cupoMaximo !== null && libres > 0 && libres <= 3) return 'last_slots';
  return 'has_slots';
}

export function chipPozoKey(chip: ChipPozo): MessageKey {
  return CHIP_MESSAGE[chip];
}

export function avancePozo(artista: ArtistaExplorar): number {
  if (!artista.pozo) return 0;
  const meta = artista.pozo.metaWei !== null && /^-?\d+$/.test(artista.pozo.metaWei) ? BigInt(artista.pozo.metaWei) : null;
  const monto = /^-?\d+$/.test(artista.pozo.montoWei) ? BigInt(artista.pozo.montoWei) : 0n;
  return goalPercent(monto, meta);
}

export function admiteEntrada(artista: ArtistaExplorar): boolean {
  const chip = chipPozo(artista);
  return chip === 'has_slots' || chip === 'last_slots' || chip === 'closing_soon';
}

export function colocarPatrocinados<T extends { patrocinado: boolean }>(items: T[]): T[] {
  const placed: T[] = [];
  const waiting: T[] = [];
  for (const item of items) {
    const start = Math.floor(placed.length / 8) * 8;
    const used = placed.slice(start).some((row) => row.patrocinado);
    if (item.patrocinado && used) waiting.push(item);
    else placed.push(item);
  }
  return [...placed, ...waiting];
}

export function filtroMasRestrictivo(estados: EstadoFiltro[], ciudades: string[], generos: string[]): string | null {
  if (generos.length > 0) return generos[0] ?? null;
  if (ciudades.length > 1) return ciudades[0] ?? null;
  if (estados.includes('cerrado')) return 'cerrado';
  return null;
}
