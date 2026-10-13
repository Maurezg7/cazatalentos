import { getConfianza } from '../content/confianza-i18n';
import { useLocale, useT } from '../i18n/LocaleContext';

export function FranjaConfianza() {
  const { locale } = useLocale();
  const t = useT();
  const bloques = getConfianza(locale);

  return (
    <section aria-labelledby="confianza-title" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <h2 id="confianza-title" className="sr-only">
        {t('trustTitle')}
      </h2>
      {bloques.map((bloque) => (
        <article
          key={bloque.titulo}
          className="rounded-[14px] border p-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <h3 className="display-num m-0 text-lg uppercase">{bloque.titulo}</h3>
          <p className="tone-muted m-0 mt-2 text-sm">{bloque.texto}</p>
        </article>
      ))}
    </section>
  );
}
