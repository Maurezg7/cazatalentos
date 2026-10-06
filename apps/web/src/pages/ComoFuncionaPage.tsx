import { Link } from 'react-router-dom';
import { EscenariosLadoALado } from '../como/EscenariosLadoALado';
import { LineaDeTiempoEjemplo } from '../como/LineaDeTiempoEjemplo';
import { PasoDetallado } from '../como/PasoDetallado';
import { SimuladorEntrada } from '../como/SimuladorEntrada';
import { VideoExplicativo } from '../como/VideoExplicativo';
import { EJEMPLO, ESCENARIOS, FAQ, GLOSARIO, INTRODUCCION, PASOS, VIDEO } from '../content/como-funciona';
import { TicketPionero } from '../landing/TicketPionero';
import { useState } from 'react';

function Mini({ children }: { children: string }) {
  return <p className="m-0 font-display text-lg uppercase">{children}</p>;
}

export function ComoFuncionaPage() {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <main className="mx-auto flex w-full max-w-[70ch] flex-col gap-12 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header>
        <h1 className="m-0 font-display text-4xl uppercase tracking-wide">Cómo funciona</h1>
        <p className="m-0 mt-3 text-lg">{INTRODUCCION}</p>
      </header>

      <section aria-labelledby="pasos-title" className="flex flex-col gap-8">
        <h2 id="pasos-title" className="m-0 font-display text-2xl uppercase">Los cuatro pasos</h2>
        <PasoDetallado numero={PASOS[0].numero} titulo={PASOS[0].titulo} accion={PASOS[0].accion} queCuesta={PASOS[0].plata} queVes={<Mini>Perfil de Zamba Lunar · Cafayate</Mini>} />
        <PasoDetallado numero={PASOS[1].numero} titulo={PASOS[1].titulo} accion={PASOS[1].accion} queCuesta={PASOS[1].plata} queVes={<span className="sun-btn inline-flex h-11 items-center px-4">Estuve antes</span>} />
        <PasoDetallado numero={PASOS[2].numero} titulo={PASOS[2].titulo} accion={PASOS[2].accion} queCuesta={PASOS[2].plata} queVes={<p className="ticket-numero m-0 text-4xl"><sup>Nº</sup> 041</p>} />
        <PasoDetallado numero={PASOS[3].numero} titulo={PASOS[3].titulo} accion={PASOS[3].accion} queCuesta={PASOS[3].plata} queVes={<Mini>Votación de pioneros · en definición de plazos públicos</Mini>} />
      </section>

      <section aria-labelledby="ejemplo-title" className="flex flex-col gap-6">
        <h2 id="ejemplo-title" className="m-0 font-display text-2xl uppercase">Ejemplo completo</h2>
        <p className="m-0">{EJEMPLO.fan} y {EJEMPLO.artista}, de {EJEMPLO.ciudad}.</p>
        <LineaDeTiempoEjemplo
          eventos={EJEMPLO.eventos.map((evento, index) => ({
            ...evento,
            ticket: index === 1 ? (
              <div className="mt-3 max-w-sm">
                <TicketPionero
                  numero={EJEMPLO.numero}
                  artista={EJEMPLO.artista}
                  ciudad={EJEMPLO.ciudad}
                  registradaEn="2 oct 2026"
                  posicion={EJEMPLO.numero}
                  totalPioneros={148}
                  meta="La meta la declara el artista en el contrato"
                  estado="en_curso"
                />
              </div>
            ) : undefined,
          }))}
        />
        <EscenariosLadoALado cumple={ESCENARIOS.cumple} noCumple={ESCENARIOS.noCumple} />
        <p className="m-0 text-sm">
          <a className="landing-focus underline" href="#contrato">Ver contrato</a>
          <span id="contrato">. El enlace al contrato desplegado queda pendiente.</span>
        </p>
      </section>

      <section aria-labelledby="sim-title" className="flex flex-col gap-4">
        <h2 id="sim-title" className="m-0 font-display text-2xl uppercase">Probá con tus números</h2>
        <SimuladorEntrada />
      </section>

      <section aria-labelledby="glosario-title">
        <h2 id="glosario-title" className="m-0 font-display text-2xl uppercase">Glosario</h2>
        <dl className="mt-4 flex flex-col gap-3">
          {GLOSARIO.map((item) => (
            <div key={item.termino}>
              <dt className="font-semibold">{item.termino}</dt>
              <dd className="m-0">{item.definicion}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="faq-title" className="flex flex-col gap-2">
        <h2 id="faq-title" className="m-0 font-display text-2xl uppercase">Preguntas frecuentes</h2>
        {FAQ.map((item, index) => {
          const open = abierta === index;
          const panelId = `faq-panel-${index}`;
          return (
            <div key={item.pregunta} className="border-b border-[var(--line)]">
              <h3 className="m-0 text-base">
                <button
                  type="button"
                  className="landing-focus flex min-h-11 w-full items-center justify-between py-3 text-left font-semibold"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setAbierta(open ? null : index)}
                >
                  {item.pregunta}
                </button>
              </h3>
              <div id={panelId} hidden={!open}>
                <p className="m-0 pb-3">{item.respuesta}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="video-title" className="flex flex-col gap-3">
        <h2 id="video-title" className="m-0 font-display text-2xl uppercase">Video</h2>
        <VideoExplicativo />
        <details>
          <summary>Transcripción</summary>
          <p>{VIDEO.transcripcion}</p>
        </details>
      </section>

      <section aria-labelledby="cierre-title" className="flex flex-wrap gap-3">
        <h2 id="cierre-title" className="sr-only">Seguir</h2>
        <Link to="/#pozos" className="sun-btn landing-focus inline-flex h-11 items-center px-4">Ver pozos abiertos</Link>
        <Link to="/explorar" className="line-btn landing-focus inline-flex h-11 items-center px-4">Explorar artistas</Link>
      </section>
    </main>
  );
}
