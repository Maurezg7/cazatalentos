import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/api';
import { formatMonFromWei } from '../landing/pozo';
import { admiteEntrada, avancePozo, chipPozo } from './selectores';
import type { ArtistaExplorar } from './tipos';

function motivo(artista: ArtistaExplorar): string | null {
  if (admiteEntrada(artista)) return null;
  if (!artista.pozo) return 'Todavía no tiene un pozo abierto.';
  return 'Este pozo ya no recibe marcas.';
}

export function ArtistaCard({ artista }: { artista: ArtistaExplorar }) {
  const portada = mediaUrl(artista.portada);
  const cerrado = motivo(artista);
  return (
    <article className="pozo-card flex min-h-[280px] flex-col overflow-hidden" role="listitem">
      <div className="relative h-24">
        {portada ? <img src={portada} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: 'var(--line)' }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {artista.patrocinado ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#1c1814] px-2 py-1 text-xs font-semibold text-[#f3e9d6]">Patrocinado</span>
        ) : null}
        <h2 className="display-num absolute bottom-2 left-3 right-3 m-0 text-xl uppercase text-[#f3e9d6]">{artista.nombre}</h2>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="tone-muted m-0 text-sm">{artista.ciudad}</p>
        <p className="m-0 text-sm font-semibold">{chipPozo(artista)}</p>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avancePozo(artista)} className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
          <span className="block h-full" style={{ width: `${avancePozo(artista)}%`, background: 'var(--sun)' }} />
        </div>
        <p className="m-0 text-sm">{artista.pioneros} pioneros{artista.pozo ? ` · ${formatMonFromWei(/^-?\d+$/.test(artista.pozo.montoWei) ? BigInt(artista.pozo.montoWei) : 0n)}` : ''}</p>
        <div className="mt-auto flex gap-2">
          <Link to={`/artist/${artista.id}`} className="landing-focus line-btn inline-flex h-11 flex-1 items-center justify-center text-sm font-semibold">Ver perfil</Link>
          {cerrado ? (
            <button type="button" disabled className="h-11 flex-1 rounded-[10px] text-sm opacity-60">{cerrado}</button>
          ) : (
            <Link to={`/artist/${artista.id}`} className="landing-focus sun-btn inline-flex h-11 flex-1 items-center justify-center text-sm font-semibold">Estuve antes</Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ArtistaRow({ artista }: { artista: ArtistaExplorar }) {
  const cerrado = motivo(artista);
  return (
    <article className="pozo-card grid items-center gap-3 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]" role="listitem">
      <div>
        {artista.patrocinado ? <p className="m-0 text-xs font-semibold uppercase">Patrocinado</p> : null}
        <h2 className="display-num m-0 text-2xl uppercase">{artista.nombre}</h2>
        <p className="tone-muted m-0 text-sm">{artista.ciudad}</p>
      </div>
      <p className="m-0 text-sm">{chipPozo(artista)}</p>
      <div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avancePozo(artista)} className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
          <span className="block h-full" style={{ width: `${avancePozo(artista)}%`, background: 'var(--sun)' }} />
        </div>
        <p className="m-0 mt-1 text-sm">{artista.pioneros} pioneros</p>
      </div>
      <div className="flex gap-2">
        <Link to={`/artist/${artista.id}`} className="landing-focus line-btn inline-flex h-11 items-center px-3 text-sm font-semibold">Ver perfil</Link>
        {cerrado ? <span className="tone-muted self-center text-sm">{cerrado}</span> : <Link to={`/artist/${artista.id}`} className="landing-focus sun-btn inline-flex h-11 items-center px-3 text-sm font-semibold">Estuve antes</Link>}
      </div>
    </article>
  );
}
