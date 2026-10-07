import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="space-y-4 pt-6">
      <h2 className="font-serif text-2xl">No encontramos esa página.</h2>
      <p className="text-tierra-700">
        Puede que el link esté roto o que el artista ya no esté disponible.
      </p>
      <Link to="/" className="text-ocre-600 underline">
        Volver al inicio
      </Link>
    </section>
  );
}
