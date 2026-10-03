export function HomePage() {
  return (
    <section className="space-y-8 pt-8">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ocre-600">
          Monad · Salta · 2026
        </p>
        <h2 className="font-serif text-4xl leading-[1.1]">
          El registro de quién
          <br />
          <em className="text-ocre-600">creyó primero.</em>
        </h2>
        <p className="max-w-prose text-base text-tierra-700">
          Los primeros fans hacen grande a un artista. Acá eso deja marca: un rango numerado,
          verificable, que no se puede borrar ni comprar.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-tierra-100 bg-white/60 p-4">
        <p className="text-xs uppercase tracking-wider text-tierra-700">¿Cómo se usa?</p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-tierra-700">
          <li>Entrás con tu email o Google.</li>
          <li>Dejás una marca en el artista con un depósito mínimo.</li>
          <li>Te queda un rango para siempre. Y si el artista crece, cobrás.</li>
        </ol>
      </div>
    </section>
  );
}
