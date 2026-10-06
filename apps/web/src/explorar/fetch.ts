import { API_BASE } from '../lib/api';
import type { ConsultaExplorar, PaginaExplorar } from './tipos';
import { consultaToParams } from './url';

export async function fetchExplorar(consulta: ConsultaExplorar): Promise<PaginaExplorar> {
  const params = consultaToParams(consulta);
  params.set('orden', consulta.orden);
  params.set('pagina', String(consulta.pagina));
  const response = await fetch(`${API_BASE}/api/artists?${params.toString()}`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('No se pudo leer la cartelera');
  return (await response.json()) as PaginaExplorar;
}
