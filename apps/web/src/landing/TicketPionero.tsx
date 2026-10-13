import { useT } from '../i18n/LocaleContext';
import { getLocale } from '../i18n/runtime';
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
  const t = useT();
  const fecha =
    typeof registradaEn === 'string'
      ? registradaEn
      : registradaEn.toLocaleDateString(getLocale() === 'es' ? 'es-AR' : 'en-US');
  const estadoLabel =
    estado === 'cumplida'
      ? t('ticketGoalMet')
      : estado === 'no_cumplida'
        ? t('ticketGoalMissed')
        : t('ticketInProgress');
  return (
    <article
      className="ticket-pionero"
      role="img"
      aria-label={t('ticketAria', { n: entryDigits(numero), artist: artista })}
    >
      <div className="ticket-pionero-body">
        <span className="ticket-seal">{t('ticketSeal')}</span>
        <p className="m-0 pr-16 text-xs uppercase tracking-wide">{t('ticketTitle')}</p>
        <p className="ticket-numero">
          <sup className="text-lg">Nº</sup> {entryDigits(numero)}
        </p>
        <p className="m-0 mt-3 text-sm font-semibold">{artista}</p>
        <p className="m-0 text-sm">{ciudad}</p>
        <p className="m-0 mt-2 text-xs">
          {fecha} · {t('ticketOf', { pos: posicion, total: totalPioneros })}
        </p>
        <p className="m-0 mt-1 text-xs">{meta}</p>
        <p className="m-0 mt-2 text-xs font-semibold uppercase">{estadoLabel}</p>
      </div>
      <div className="ticket-pionero-stub" aria-hidden="true">
        <span className="ticket-serial">{entryDigits(numero)}</span>
      </div>
    </article>
  );
}
