import { describe, expect, it } from 'vitest';
import { admiteEntrada, avancePozo, chipPozo, colocarPatrocinados } from './selectores';
import type { ArtistaExplorar } from './tipos';
import { parseConsulta } from './url';

function artista(partial: Partial<ArtistaExplorar> = {}): ArtistaExplorar {
  return {
    id: 1,
    nombre: 'Los Hijos del Cerro',
    ciudad: 'Salta Capital',
    generos: [],
    pioneros: 4,
    patrocinado: false,
    portada: null,
    pozo: {
      montoWei: '10',
      metaWei: '40',
      cupoMaximo: 20,
      cierraEn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      abierto: true,
    },
    ...partial,
  };
}

describe('chipPozo', () => {
  it('covers missing, open, closing and closed pools', () => {
    expect(chipPozo(artista({ pozo: null }))).toBe('Sin pozo');
    expect(chipPozo(artista())).toBe('Hay cupo');
    expect(chipPozo(artista({ pioneros: 18 }))).toBe('Últimos cupos');
    expect(chipPozo(artista({ pozo: { ...artista().pozo!, cierraEn: new Date(Date.now() + 60_000).toISOString() } }))).toBe('Cierra pronto');
    expect(chipPozo(artista({ pozo: { ...artista().pozo!, abierto: false } }))).toBe('Cerrado');
  });

  it('caps progress and allows entry only while the pool is open', () => {
    expect(avancePozo(artista())).toBe(25);
    expect(avancePozo(artista({ pozo: null }))).toBe(0);
    expect(avancePozo(artista({ pozo: { ...artista().pozo!, metaWei: '0' } }))).toBe(0);
    expect(admiteEntrada(artista())).toBe(true);
    expect(admiteEntrada(artista({ pozo: null }))).toBe(false);
  });
});

describe('colocarPatrocinados', () => {
  it('keeps at most one sponsored artist in each block of eight', () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({ id: index, patrocinado: index < 3 }));
    const placed = colocarPatrocinados(rows);
    expect(placed.slice(0, 8).filter((row) => row.patrocinado)).toHaveLength(1);
    expect(placed.filter((row) => row.patrocinado)).toHaveLength(3);
  });
});

describe('parseConsulta', () => {
  it('keeps valid params and drops unknown or empty ones', () => {
    const params = new URLSearchParams('q=luna&q=otra&ciudad=Cachi&ciudad=&genero=folklore&estado=cupo&estado=nope&orden=cierra&vista=lista&pagina=2');
    expect(parseConsulta(params)).toEqual({
      q: 'luna',
      ciudades: ['Cachi'],
      generos: ['folklore'],
      estados: ['cupo'],
      orden: 'cierra',
      vista: 'lista',
      pagina: 2,
    });
    expect(parseConsulta(new URLSearchParams('orden=hack&pagina=0&vista='))).toMatchObject({
      orden: 'az',
      vista: 'grilla',
      pagina: 1,
    });
  });
});
