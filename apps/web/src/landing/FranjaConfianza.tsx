import { CONFIANZA } from '../content/confianza';

export function FranjaConfianza() {
  return (
    <section aria-labelledby="confianza-title" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <h2 id="confianza-title" className="sr-only">Cómo funciona el pozo</h2>
      {CONFIANZA.map((bloque) => (
        <article key={bloque.titulo} className="rounded-[14px] border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <h3 className="display-num m-0 text-lg uppercase">{bloque.titulo}</h3>
          <p className="tone-muted m-0 mt-2 text-sm">{bloque.texto}</p>
        </article>
      ))}
    </section>
  );
}
