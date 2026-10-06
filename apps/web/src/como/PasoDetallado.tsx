import type { ReactNode } from 'react';

export function PasoDetallado({
  numero,
  titulo,
  accion,
  queVes,
  queCuesta,
}: {
  numero: number;
  titulo: string;
  accion: string;
  queVes: ReactNode;
  queCuesta: string;
}) {
  return (
    <article className="reader-block" aria-labelledby={`paso-${numero}`}>
      <p className="ticket-numero m-0 text-3xl">
        <sup className="text-base">Nº</sup> {String(numero).padStart(2, '0')}
      </p>
      <h3 id={`paso-${numero}`} className="m-0 font-display text-2xl uppercase tracking-wide">{titulo}</h3>
      <p className="m-0">{accion}</p>
      <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)] p-4">{queVes}</div>
      <p className="m-0 text-sm"><strong>Tu plata: </strong>{queCuesta}</p>
    </article>
  );
}
