import { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchExplorar } from '../explorar/fetch';
import { ResultadosGrid } from '../explorar/Resultados';
import { filtroMasRestrictivo } from '../explorar/selectores';
import type { ConsultaExplorar, EstadoFiltro, OrdenExplorar, VistaExplorar } from '../explorar/tipos';
import { consultaToParams, parseConsulta } from '../explorar/url';

const ESTADOS: { id: EstadoFiltro; label: string }[] = [
  { id: 'cupo', label: 'Con cupo' },
  { id: 'ultimos', label: 'Últimos cupos' },
  { id: 'pronto', label: 'Cierra pronto' },
  { id: 'cerrado', label: 'Cerrado' },
];

const ORDENES: { id: OrdenExplorar; label: string }[] = [
  { id: 'meta', label: 'Más cerca de la meta' },
  { id: 'cierra', label: 'Cierra pronto' },
  { id: 'pioneros', label: 'Más pioneros' },
  { id: 'nuevos', label: 'Recién sumados' },
  { id: 'az', label: 'A–Z' },
];

function rememberedVista(): VistaExplorar | null {
  try {
    const value = localStorage.getItem('ct-explorar-vista');
    return value === 'lista' || value === 'grilla' ? value : null;
  } catch {
    return null;
  }
}

export function ExplorarPage() {
  const [params, setParams] = useSearchParams();
  const parsed = parseConsulta(params);
  const vista: VistaExplorar = params.has('vista') ? parsed.vista : rememberedVista() ?? parsed.vista;
  const consulta: ConsultaExplorar = { ...parsed, vista };
  const [draft, setDraft] = useState(parsed.q);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const filtrosButton = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const resultado = useQuery({
    queryKey: ['explorar', consulta],
    queryFn: () => fetchExplorar(consulta),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const parsedCurrent = parseConsulta(current);
        if (draft.trim() === parsedCurrent.q) return current;
        return consultaToParams({ ...parsedCurrent, q: draft.trim(), pagina: 1 });
      }, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, setParams]);

  useEffect(() => {
    if (!filtrosAbiertos) return;
    const node = sheetRef.current;
    const previous = document.activeElement;
    node?.querySelector<HTMLElement>('button, input')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setFiltrosAbiertos(false);
      if (event.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>('button, input, select, a')];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [filtrosAbiertos]);

  function write(next: ConsultaExplorar) {
    setParams(consultaToParams(next), { replace: true });
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  const activos = [
    ...consulta.ciudades.map((ciudad) => ({ key: `ciudad:${ciudad}`, label: ciudad, clear: () => write({ ...consulta, ciudades: toggle(consulta.ciudades, ciudad), pagina: 1 }) })),
    ...consulta.estados.map((estado) => ({ key: `estado:${estado}`, label: ESTADOS.find((item) => item.id === estado)?.label ?? estado, clear: () => write({ ...consulta, estados: consulta.estados.filter((item) => item !== estado), pagina: 1 }) })),
  ];
  const sugerencia = filtroMasRestrictivo(consulta.estados, consulta.ciudades, consulta.generos);
  const panel = (
    <PanelFiltros
      ciudades={resultado.data?.ciudades ?? []}
      consulta={consulta}
      onCiudad={(ciudad) => write({ ...consulta, ciudades: toggle(consulta.ciudades, ciudad), pagina: 1 })}
      onEstado={(estado) => write({ ...consulta, estados: toggle(consulta.estados, estado) as EstadoFiltro[], pagina: 1 })}
    />
  );

  return (
    <div className="py-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 id={tituloId} className="display-num m-0 text-4xl uppercase">Explorar</h1>
        <p className="tone-muted m-0 text-sm" aria-live="polite">{resultado.data ? `${resultado.data.total} artistas` : 'Buscando…'}</p>
      </div>
      <form role="search" className="mb-4" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="buscar-artistas">Buscar artista o ciudad</label>
        <input
          id="buscar-artistas"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar artista, ciudad o género…"
          className="landing-focus h-11 w-full rounded-[10px] border bg-transparent px-3"
          style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
        />
      </form>
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="sticky top-20 hidden self-start lg:block">{panel}</aside>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button ref={filtrosButton} type="button" className="landing-focus line-btn h-11 px-3 text-sm font-semibold lg:hidden" onClick={() => setFiltrosAbiertos(true)}>
              Filtros ({consulta.ciudades.length + consulta.estados.length})
            </button>
            {activos.map((chip) => (
              <button key={chip.key} type="button" className="landing-focus line-btn inline-flex h-9 items-center gap-1 px-3 text-sm" onClick={chip.clear}>{chip.label} <Icon name="x" className="h-3 w-3" /></button>
            ))}
            {activos.length > 0 ? <button type="button" className="landing-focus h-9 px-2 text-sm underline" onClick={() => write({ ...consulta, ciudades: [], estados: [], generos: [], q: '', pagina: 1 })}>Limpiar todo</button> : null}
            <label className="ml-auto text-sm">
              <span className="sr-only">Ordenar</span>
              <select
                value={consulta.orden}
                onChange={(event) => write({ ...consulta, orden: event.target.value as OrdenExplorar, pagina: 1 })}
                className="landing-focus h-11 rounded-[10px] bg-transparent px-2"
                style={{ color: 'var(--text)', borderColor: 'var(--line)' }}
              >
                {ORDENES.map((orden) => <option key={orden.id} value={orden.id}>{orden.label}</option>)}
              </select>
            </label>
            <button type="button" aria-pressed={vista === 'grilla'} aria-label="Vista grilla" className="landing-focus line-btn h-11 px-3 text-sm" onClick={() => elegirVista('grilla')}>Grilla</button>
            <button type="button" aria-pressed={vista === 'lista'} aria-label="Vista lista" className="landing-focus line-btn inline-flex h-11 items-center px-3 text-sm" onClick={() => elegirVista('lista')}><Icon name="list" className="h-4 w-4" /></button>
          </div>
          {sugerencia && resultado.data?.total === 0 ? <p className="tone-muted text-sm">Probá quitar “{sugerencia}”.</p> : null}
          <ResultadosGrid
            items={resultado.data?.items ?? []}
            vista={vista}
            loading={resultado.isLoading}
            error={resultado.isError}
            vacio={!resultado.isLoading && !resultado.isError && (resultado.data?.total ?? 0) === 0}
            onRetry={() => void resultado.refetch()}
            onLimpiar={() => write({ q: '', ciudades: [], generos: [], estados: [], orden: 'az', vista, pagina: 1 })}
          />
          {resultado.data && resultado.data.total > resultado.data.tamano ? (
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={consulta.pagina <= 1} className="landing-focus line-btn h-11 px-3 disabled:opacity-40" onClick={() => write({ ...consulta, pagina: consulta.pagina - 1 })}>Anterior</button>
              <button type="button" disabled={consulta.pagina * resultado.data.tamano >= resultado.data.total} className="landing-focus line-btn h-11 px-3 disabled:opacity-40" onClick={() => write({ ...consulta, pagina: consulta.pagina + 1 })}>Siguiente</button>
            </div>
          ) : null}
        </div>
      </div>
      {filtrosAbiertos ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/50 lg:hidden">
          <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="filtros-titulo" className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl p-4" style={{ background: 'var(--bg)' }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 id="filtros-titulo" className="display-num m-0 text-2xl uppercase">Filtros</h2>
              <button type="button" className="landing-focus h-11 px-3" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
            </div>
            {panel}
            <button type="button" className="landing-focus sun-btn mt-4 h-11 w-full font-semibold" onClick={() => setFiltrosAbiertos(false)}>
              Ver {resultado.data?.total ?? 0} resultados
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  function elegirVista(next: VistaExplorar) {
    try { localStorage.setItem('ct-explorar-vista', next); } catch { /* storage unavailable */ }
    write({ ...consulta, vista: next });
  }
}

function PanelFiltros({
  ciudades,
  consulta,
  onCiudad,
  onEstado,
}: {
  ciudades: string[];
  consulta: ConsultaExplorar;
  onCiudad: (ciudad: string) => void;
  onEstado: (estado: EstadoFiltro) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold uppercase">Ciudad</legend>
        {ciudades.length === 0 ? <p className="tone-muted m-0 text-sm">Sin ciudades publicadas.</p> : ciudades.map((ciudad) => (
          <label key={ciudad} className="flex h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={consulta.ciudades.includes(ciudad)} onChange={() => onCiudad(ciudad)} />
            {ciudad}
          </label>
        ))}
      </fieldset>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold uppercase">Género</legend>
        <p className="tone-muted m-0 text-sm">Los géneros todavía no están publicados.</p>
      </fieldset>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold uppercase">Estado del pozo</legend>
        {ESTADOS.map((estado) => (
          <label key={estado.id} className="flex h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={consulta.estados.includes(estado.id)} onChange={() => onEstado(estado.id)} />
            {estado.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
