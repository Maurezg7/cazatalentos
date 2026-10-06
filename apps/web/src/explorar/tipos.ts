export type EstadoFiltro = 'cupo' | 'ultimos' | 'pronto' | 'cerrado';
export type OrdenExplorar = 'meta' | 'cierra' | 'pioneros' | 'nuevos' | 'az';
export type VistaExplorar = 'grilla' | 'lista';

export type PozoExplorar = {
  montoWei: string;
  metaWei: string | null;
  cupoMaximo: number | null;
  cierraEn: string;
  abierto: boolean;
};

export type ArtistaExplorar = {
  id: number;
  nombre: string;
  ciudad: string;
  generos: string[];
  pioneros: number;
  patrocinado: boolean;
  portada: string | null;
  pozo: PozoExplorar | null;
};

export type PaginaExplorar = {
  items: ArtistaExplorar[];
  total: number;
  pagina: number;
  tamano: number;
  ciudades: string[];
};

export type ConsultaExplorar = {
  q: string;
  ciudades: string[];
  generos: string[];
  estados: EstadoFiltro[];
  orden: OrdenExplorar;
  vista: VistaExplorar;
  pagina: number;
};
