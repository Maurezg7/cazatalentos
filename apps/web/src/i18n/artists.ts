import type { Locale } from './runtime';

/** Canonical Spanish catalog names → English display labels. */
const ARTIST_NAME_EN: Record<string, string> = {
  'Los Copleros del Valle': 'The Valley Copleros',
  Mauro: 'Mauro',
  'Zamba Lunar': 'Lunar Zamba',
  'El Chango Nublado': 'Cloudy Chango',
  'Dúo Algarrobal': 'Algarrobal Duo',
  'Mate Eléctrico': 'Electric Mate',
  'Las Voces del Cerro': 'Voices of the Hill',
  'Huayra Nueva': 'New Huayra',
  'Los Hijos del Cerro': 'Children of the Hill',
  'Un artista del NOA': 'An artist from the NOA',
  Artista: 'Artist',
};

const REGION_EN: Record<string, string> = {
  'Salta Capital': 'Salta Capital',
  Cafayate: 'Cafayate',
  Cachi: 'Cachi',
  'Rosario de Lerma': 'Rosario de Lerma',
  Tilcara: 'Tilcara',
  'San Salvador de Jujuy': 'San Salvador de Jujuy',
  Salta: 'Salta',
  'Sin ciudad': 'No city',
};

export function localizeArtistName(name: string | null | undefined, locale: Locale): string {
  const raw = (name ?? '').trim();
  if (!raw) return locale === 'es' ? 'Artista' : 'Artist';
  if (locale === 'es') return raw;
  return ARTIST_NAME_EN[raw] ?? raw;
}

export function localizePlace(place: string | null | undefined, locale: Locale): string {
  const raw = (place ?? '').trim();
  if (!raw) return raw;
  if (locale === 'es') return raw;
  return REGION_EN[raw] ?? raw;
}
