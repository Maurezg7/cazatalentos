import { useT } from '../i18n/LocaleContext';
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
  const t = useT();
  return (
    <section className="grid min-w-0 items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">
          {t('heroTitle1')}
          <br />
          <span>{t('heroTitle2')}</span>
        </h1>
        <p className="tone-muted mt-4 max-w-[44ch] text-base leading-relaxed">{t('heroSub')}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#pozos" className="landing-focus sun-btn inline-flex h-11 items-center px-5 font-semibold">
            {t('heroOpenPools')}
          </a>
          <a href={onExplorar} className="landing-focus line-btn inline-flex h-11 items-center px-5 font-semibold">
            {t('heroExploreArtists')}
          </a>
        </div>
        <dl className="mt-6 flex gap-6 text-sm">
          <div>
            <dt className="tone-muted">{t('pioneers')}</dt>
            <dd className="display-num m-0 text-2xl">{pioneros}</dd>
          </div>
          <div>
            <dt className="tone-muted">{t('openPools')}</dt>
            <dd className="display-num m-0 text-2xl">{pozosAbiertos}</dd>
          </div>
        </dl>
      </div>
      <TicketPionero
        numero={pioneros > 0 ? 1 : 7}
        artista={artista}
        ciudad={ciudad}
        registradaEn={t('ticketSample')}
        posicion={pioneros > 0 ? 1 : 7}
        totalPioneros={Math.max(pioneros, 1)}
        meta={t('ticketMeta')}
        estado="en_curso"
      />
    </section>
  );
}
