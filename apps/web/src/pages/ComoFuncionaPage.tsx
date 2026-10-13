import { Link } from 'react-router-dom';
import { useState } from 'react';
import { EscenariosLadoALado } from '../como/EscenariosLadoALado';
import { LineaDeTiempoEjemplo } from '../como/LineaDeTiempoEjemplo';
import { PasoDetallado } from '../como/PasoDetallado';
import { SimuladorEntrada } from '../como/SimuladorEntrada';
import { VideoExplicativo } from '../como/VideoExplicativo';
import { CONTRATO_DESPLEGADO, getComoFunciona } from '../content/como-funciona-i18n';
import { useLocale, useT } from '../i18n/LocaleContext';
import { TicketPionero } from '../landing/TicketPionero';

function Mini({ children }: { children: string }) {
  return <p className="m-0 font-display text-lg uppercase">{children}</p>;
}

export function ComoFuncionaPage() {
  const { locale } = useLocale();
  const t = useT();
  const copy = getComoFunciona(locale);
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[70ch] flex-col gap-12 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header>
        <h1 className="m-0 font-display text-4xl uppercase tracking-wide">{copy.pageTitle}</h1>
        <p className="m-0 mt-3 text-lg">{copy.intro}</p>
      </header>

      <section aria-labelledby="pasos-title" className="flex flex-col gap-8">
        <h2 id="pasos-title" className="m-0 font-display text-2xl uppercase">
          {copy.fourSteps}
        </h2>
        {copy.pasos.map((paso, index) => (
          <PasoDetallado
            key={paso.numero}
            numero={paso.numero}
            titulo={paso.titulo}
            accion={paso.accion}
            queCuesta={paso.plata}
            queVes={
              index === 0 ? (
                <Mini>{copy.stepVisuals.profile}</Mini>
              ) : index === 1 ? (
                <span className="sun-btn inline-flex h-11 items-center px-4">{t('wasThereFirst')}</span>
              ) : index === 2 ? (
                <p className="ticket-numero m-0 text-4xl">
                  <sup>Nº</sup> 041
                </p>
              ) : (
                <Mini>{copy.stepVisuals.vote}</Mini>
              )
            }
          />
        ))}
      </section>

      <section aria-labelledby="ejemplo-title" className="flex flex-col gap-6">
        <h2 id="ejemplo-title" className="m-0 font-display text-2xl uppercase">
          {copy.fullExample}
        </h2>
        <p className="m-0">
          {copy.ejemplo.fan} y {copy.ejemplo.artista}, de {copy.ejemplo.ciudad}.
        </p>
        <LineaDeTiempoEjemplo
          eventos={copy.ejemplo.eventos.map((evento, index) => ({
            ...evento,
            ticket:
              index === 1 ? (
                <div className="mt-3 max-w-sm">
                  <TicketPionero
                    numero={copy.ejemplo.numero}
                    artista={copy.ejemplo.artista}
                    ciudad={copy.ejemplo.ciudad}
                    registradaEn={copy.ejemplo.ticketDate}
                    posicion={copy.ejemplo.numero}
                    totalPioneros={148}
                    meta={copy.ejemplo.ticketMeta}
                    estado="en_curso"
                  />
                </div>
              ) : undefined,
          }))}
        />
        <EscenariosLadoALado cumple={copy.escenarios.cumple} noCumple={copy.escenarios.noCumple} />
        <p id="contrato" className="m-0 text-sm">
          <a className="landing-focus underline" href={CONTRATO_DESPLEGADO.explorer} target="_blank" rel="noreferrer">
            {copy.viewContract}
          </a>
          <span>{copy.contractNote}</span>
        </p>
      </section>

      <section aria-labelledby="sim-title" className="flex flex-col gap-4">
        <h2 id="sim-title" className="m-0 font-display text-2xl uppercase">
          {copy.tryNumbers}
        </h2>
        <SimuladorEntrada />
      </section>

      <section aria-labelledby="glosario-title">
        <h2 id="glosario-title" className="m-0 font-display text-2xl uppercase">
          {copy.glossary}
        </h2>
        <dl className="mt-4 flex flex-col gap-3">
          {copy.glosario.map((item) => (
            <div key={item.termino}>
              <dt className="font-semibold">{item.termino}</dt>
              <dd className="m-0">{item.definicion}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="faq-title" className="flex flex-col gap-2">
        <h2 id="faq-title" className="m-0 font-display text-2xl uppercase">
          {copy.faq}
        </h2>
        {copy.faqItems.map((item, index) => {
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
        <h2 id="video-title" className="m-0 font-display text-2xl uppercase">
          {copy.video}
        </h2>
        <VideoExplicativo transcript={copy.videoTranscript} />
        <details>
          <summary>{copy.transcript}</summary>
          <p>{copy.videoTranscript}</p>
        </details>
      </section>

      <section aria-labelledby="cierre-title" className="flex flex-wrap gap-3">
        <h2 id="cierre-title" className="sr-only">
          {copy.follow}
        </h2>
        <Link to="/#pozos" className="sun-btn landing-focus inline-flex h-11 items-center px-4">
          {t('viewOpenPools')}
        </Link>
        <Link to="/explorar" className="line-btn landing-focus inline-flex h-11 items-center px-4">
          {t('heroExploreArtists')}
        </Link>
      </section>
    </main>
  );
}
