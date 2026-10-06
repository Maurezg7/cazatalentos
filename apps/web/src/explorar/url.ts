import type { ConsultaExplorar, EstadoFiltro, OrdenExplorar, VistaExplorar } from './tipos';

const ESTADOS = new Set<EstadoFiltro>(['cupo', 'ultimos', 'pronto', 'cerrado']);
const ORDENES = new Set<OrdenExplorar>(['meta', 'cierra', 'pioneros', 'nuevos', 'az']);
const VISTAS = new Set<VistaExplorar>(['grilla', 'lista']);

function many(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).map((item) => item.trim()).filter((item) => item.length > 0 && item.length <= 40);
}

export function parseConsulta(params: URLSearchParams): ConsultaExplorar {
  const orden = params.get('orden');
  const vista = params.get('vista');
  const pagina = Number(params.get('pagina'));
  return {
    q: (params.get('q') ?? '').trim().slice(0, 80),
    ciudades: many(params, 'ciudad'),
    generos: many(params, 'genero'),
    estados: many(params, 'estado').filter((item): item is EstadoFiltro => ESTADOS.has(item as EstadoFiltro)),
    orden: ORDENES.has(orden as OrdenExplorar) ? (orden as OrdenExplorar) : 'az',
    vista: VISTAS.has(vista as VistaExplorar) ? (vista as VistaExplorar) : 'grilla',
    pagina: Number.isInteger(pagina) && pagina > 0 && pagina < 500 ? pagina : 1,
  };
}

export function consultaToParams(consulta: ConsultaExplorar): URLSearchParams {
  const params = new URLSearchParams();
  if (consulta.q) params.set('q', consulta.q);
  for (const ciudad of consulta.ciudades) params.append('ciudad', ciudad);
  for (const genero of consulta.generos) params.append('genero', genero);
  for (const estado of consulta.estados) params.append('estado', estado);
  if (consulta.orden !== 'az') params.set('orden', consulta.orden);
  if (consulta.vista !== 'grilla') params.set('vista', consulta.vista);
  if (consulta.pagina > 1) params.set('pagina', String(consulta.pagina));
  return params;
}
