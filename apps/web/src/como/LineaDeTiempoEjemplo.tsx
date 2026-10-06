import type { ReactNode } from 'react';

export function LineaDeTiempoEjemplo({
  eventos,
}: {
  eventos: { fecha: string; texto: string; ticket?: ReactNode }[];
}) {
  return (
    <ol className="m-0 flex list-none flex-col gap-6 p-0">
      {eventos.map((evento) => (
        <li key={`${evento.fecha}-${evento.texto}`} className="border-l-2 border-[var(--gold)] pl-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{evento.fecha}</p>
          <p className="m-0 mt-1">{evento.texto}</p>
          {evento.ticket}
        </li>
      ))}
    </ol>
  );
}
