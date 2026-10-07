import { Link } from 'react-router-dom';
import { entryDigits, formatMonFromWei, freeSlots, goalPercent, type Pozo } from './pozo';

const SLOTS = 20;

export function PozoCard({ pozo }: { pozo: Pozo }) {
  const percent = goalPercent(pozo.montoWei, pozo.metaWei);
  const libres = pozo.cupoMaximo === null ? null : freeSlots(pozo.pioneros, pozo.cupoMaximo);
  const lleno = libres === 0 && pozo.cupoMaximo !== null;
  const cerrado = !pozo.abierto || lleno;
  const motivo = !pozo.abierto ? 'Este pozo ya no recibe marcas.' : lleno ? 'No quedan entradas libres.' : null;
  const siguiente = entryDigits(pozo.pioneros + 1);
  const filled = pozo.cupoMaximo === null ? 0 : Math.min(SLOTS, Math.max(0, pozo.pioneros));

  return (
    <article className="pozo-card overflow-hidden rounded-[14px]">
      <div className="relative h-36">
        {pozo.portada ? <img src={pozo.portada} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: 'var(--line)' }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
        <h3 className="display-num absolute bottom-3 left-3 right-3 m-0 text-2xl uppercase text-[#f3e9d6]">{pozo.artista}</h3>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="tone-muted m-0 text-sm">{pozo.ciudad}</p>
        <p className="m-0">
          <span className="display-num gold-amount text-3xl">{formatMonFromWei(pozo.montoWei)}</span>
          <span className="tone-muted text-sm"> de {pozo.metaTexto}</span>
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Avance del pozo"
          className="h-2 overflow-hidden rounded-full"
          style={{ background: 'var(--line)' }}
        >
          <span className="pozo-bar block h-full" style={{ width: `${percent}%`, background: 'var(--sun)' }} />
        </div>
        <p className="m-0 flex justify-between text-sm">
          <span>{pozo.metaWei === null ? 'Sin meta numérica publicada' : `${percent}% de la meta`}</span>
          <span>Cierra {pozo.cierraEn}</span>
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: SLOTS }, (_, index) => (
            <span key={index} className="h-3 flex-1 rounded-sm" style={{ background: index < filled ? 'var(--sun)' : 'transparent', border: '1px dashed var(--muted)' }} />
          ))}
        </div>
        <p className="m-0 text-sm">{libres === null ? 'El contrato no publica un cupo máximo.' : `${libres} entradas libres`}</p>
        {cerrado ? (
          <button type="button" disabled className="h-11 rounded-[10px] px-4 text-sm font-semibold opacity-60">
            {motivo}
          </button>
        ) : (
          <Link to={`/artist/${pozo.artistaId}`} className="landing-focus sun-btn inline-flex h-11 items-center justify-center px-4 text-sm font-semibold">
            Estuve antes · Nº {siguiente}
          </Link>
        )}
        <p className="tone-muted m-0 text-xs">El número lo confirma la red al dejar tu marca. Otro pionero puede adelantarse.</p>
      </div>
    </article>
  );
}
