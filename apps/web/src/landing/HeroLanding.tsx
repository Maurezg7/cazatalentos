import { TicketPionero } from './TicketPionero';

export function HeroLanding({
  artista,
  ciudad,
  pioneros,
  pozosAbiertos,
  onExplorar,
}: {
  artista: string;
  ciudad: string;
  pioneros: number;
  pozosAbiertos: number;
  onExplorar: string;
}) {
  return (
    <section className="grid min-w-0 items-center gap-8 lg:grid-cols-[1.05fr_1fr]" aria-labelledby="hero-title">
      <div className="min-w-0">
        <h1 id="hero-title" className="hero-title">
          Creíste primero.
          <br />
          <span>Quedó registrado.</span>
        </h1>
        <p className="tone-muted mt-4 max-w-[44ch] text-base leading-relaxed">
          Quien llega antes se lleva una entrada numerada y una parte del pozo si el artista cumple la meta.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#pozos" className="landing-focus sun-btn inline-flex h-11 items-center px-5 font-semibold">
            Ver pozos abiertos
          </a>
          <a href={onExplorar} className="landing-focus line-btn inline-flex h-11 items-center px-5 font-semibold">
            Explorar artistas
          </a>
        </div>
        <dl className="mt-6 flex gap-6 text-sm">
          <div>
            <dt className="tone-muted">Pioneros</dt>
            <dd className="display-num m-0 text-2xl">{pioneros}</dd>
          </div>
          <div>
            <dt className="tone-muted">Pozos abiertos</dt>
            <dd className="display-num m-0 text-2xl">{pozosAbiertos}</dd>
          </div>
        </dl>
      </div>
      <TicketPionero
        numero={7}
        artista={artista}
        ciudad={ciudad}
        registradaEn="Entrada de muestra"
        posicion={7}
        totalPioneros={Math.max(pioneros, 7)}
        meta="El número real lo asigna el contrato"
        estado="en_curso"
      />
    </section>
  );
}
