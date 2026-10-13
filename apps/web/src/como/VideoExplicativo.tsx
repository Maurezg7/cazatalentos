import { VIDEO } from '../content/como-funciona';
import { useLocale, useT } from '../i18n/LocaleContext';

export function VideoExplicativo({ transcript }: { transcript?: string }) {
  const t = useT();
  const { locale } = useLocale();
  const text = transcript ?? VIDEO.transcripcion;

  if (!VIDEO.src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)]">
        <p className="m-0 font-semibold">{t('videoComingSoon')}</p>
      </div>
    );
  }
  return (
    <figure className="m-0">
      <video controls preload="none" poster={VIDEO.poster ?? undefined} className="w-full rounded-[var(--radius-card)]">
        <source src={VIDEO.src} />
        <track
          kind="captions"
          srcLang={locale === 'es' ? 'es' : 'en'}
          label={locale === 'es' ? 'Español' : 'English'}
          src="/como-funciona-captions.vtt"
        />
      </video>
      <figcaption>
        <details>
          <summary>{t('transcript')}</summary>
          <p>{text}</p>
        </details>
      </figcaption>
    </figure>
  );
}
