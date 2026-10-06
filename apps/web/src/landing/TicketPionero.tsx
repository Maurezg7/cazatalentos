import { entryDigits } from './pozo';

export type TicketEstado = 'en_curso' | 'cumplida' | 'no_cumplida';

export function TicketPionero({
  numero,
  artista,
  ciudad,
  registradaEn,
  posicion,
  totalPioneros,
  meta,
  estado,
}: {
  numero: number;
  artista: string;
  ciudad: string;
  registradaEn: Date | string;
  posicion: number;
  totalPioneros: number;
  meta: string;
  estado: TicketEstado;
}) {
  const fecha = typeof registradaEn === 'string' ? registradaEn : registradaEn.toLocaleDateString('es-AR');
  const estadoLabel = estado === 'cumplida' ? 'Meta cumplida' : estado === 'no_cumplida' ? 'Meta no cumplida' : 'En curso';
  return (
    <article
      className="ticket-pionero"
      role="img"
      aria-label={`Entrada de pionero número ${entryDigits(numero)} para ${artista}`}
    >
      <div className="ticket-pionero-body">
        <span className="ticket-seal">PIONERO</span>
        <p className="m-0 text-xs uppercase tracking-wide">Entrada de pionero</p>
        <p className="ticket-numero">
          <sup className="text-lg">Nº</sup> {entryDigits(numero)}
        </p>
        <p className="m-0 mt-3 text-sm font-semibold">{artista}</p>
        <p className="m-0 text-sm">{ciudad}</p>
        <p className="m-0 mt-2 text-xs">{fecha} · {posicion} de {totalPioneros}</p>
        <p className="m-0 mt-1 text-xs">{meta}</p>
        <p className="m-0 mt-2 text-xs font-semibold uppercase">{estadoLabel}</p>
      </div>
      <div className="ticket-pionero-stub" aria-hidden="true">
        <span className="ticket-serial">{entryDigits(numero)}</span>
      </div>
    </article>
  );
}
