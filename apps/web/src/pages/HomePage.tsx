import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchArtistPools, fetchArtistProfile } from '../lib/api';
import { formatMON } from '../lib/format';
import { useTotalArtists } from '../lib/hooks';

const FEATURED_IDS = [1, 2] as const;

export function HomePage() {
  const totalQuery = useTotalArtists();
  const artistCount = totalQuery.data !== undefined ? Number(totalQuery.data) : undefined;

  const featuredQuery = useQuery({
    queryKey: ['home-featured', FEATURED_IDS],
    queryFn: async () => {
      const rows = await Promise.all(
        FEATURED_IDS.map(async (id) => {
          const profile = await fetchArtistProfile(id);
          const pools = await fetchArtistPools(id);
          return { id, profile, pools };
        }),
      );
      return rows;
    },
  });

  const featured = FEATURED_IDS.map((id) => {
    const row = featuredQuery.data?.find((item) => item.id === id);
    return { id, profile: row?.profile ?? null, pools: row?.pools ?? [] };
  });
  const mauro = featured.find((row) => row.id === 2);
  const examplePool = mauro?.pools[0];
  const exampleAmount =
    examplePool !== undefined ? `${formatMON(BigInt(examplePool.amountWei))} MON` : null;

  return (
    <section className="flex flex-col pb-6 pt-4">
      <div className="flex items-center justify-between pb-2">
        <div className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
          <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-primary-container">
            Monad · Salta · 2026
          </span>
        </div>
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-outline">Testnet</span>
      </div>

      <div className="mt-2 space-y-1">
        <h2 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-on-surface">
          El registro de quién <br />
          <em className="italic text-primary-container">creyó primero.</em>
        </h2>
        <p className="max-w-[42ch] pt-1 text-sm leading-relaxed text-outline">
          Los primeros fans hacen grande a un artista. Acá eso deja marca: un rango numerado,
          verificable, que no se puede borrar ni comprar.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          to="/artist/2"
          className="flex h-12 w-full items-center justify-center gap-1 rounded-full bg-primary-container text-sm font-bold text-surface-container-lowest shadow-sm transition-transform active:scale-[0.98]"
        >
          <span>Ver a Mauro</span>
          <span aria-hidden>→</span>
        </Link>
        <div className="flex items-center justify-between px-1 text-outline">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wide">
            Archivos en Monad testnet
          </span>
          <span className="font-mono text-[0.6875rem] text-secondary">
            {artistCount !== undefined
              ? `${artistCount} ${artistCount === 1 ? 'artista activo' : 'artistas activos'}`
              : 'Cargando artistas…'}
          </span>
        </div>
      </div>

      <Link
        to="/artist/2"
        className="relative mt-6 overflow-hidden rounded-xl bg-surface-container-high p-4 shadow-md"
      >
        <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-primary-container" />
        <div className="flex items-start justify-between pl-1">
          <div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-outline">
              Ejemplo de creyente temprano
            </span>
            <h3 className="mt-0.5 font-serif text-xl font-medium text-on-surface">
              {mauro?.profile?.displayName ?? mauro?.profile?.metadataURI ?? 'Mauro'}
            </h3>
            <p className="text-xs text-outline">Artista 2 · pozo 1 en votación</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-semibold tracking-tight text-tertiary">#0001</span>
            <div className="mt-0.5 font-mono text-[0.6875rem] text-secondary">Rango inalterable</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-container-low p-2">
          <span className="font-mono text-[0.6875rem] text-outline">Pionero del deployer</span>
          <span className="font-mono text-[0.6875rem] text-primary">
            {exampleAmount ? `Pozo actual: ${exampleAmount}` : 'Pozo 1 · 0.100 MON'}
          </span>
        </div>
      </Link>

      <div className="mt-6 rounded-xl bg-surface-container p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-medium text-on-surface">¿Cómo funciona?</h3>
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-outline">
            3 pasos
          </span>
        </div>
        <ol className="space-y-4">
          <HowStep
            n="01"
            title="Entrás con tu email o Google."
            detail="Sin vueltas ni configuraciones raras. Tenés tu registro personal al instante."
          />
          <HowStep
            n="02"
            title="Dejás una marca en el artista con un depósito mínimo."
            detail="Un aporte chico de respaldo que queda atado a tu rango."
          />
          <HowStep
            n="03"
            title="Te queda un rango para siempre. Y si el artista crece, cobrás."
            detail="Si el hito se aprueba, el pozo se reparte entre quienes llegaron primero."
          />
        </ol>
      </div>

      <div className="mt-6 space-y-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-outline">
          Artistas en el registro
        </span>
        <div className="space-y-2">
          {featured.map((row) => {
            const fallback = row.id === 1 ? 'Los Copleros' : 'Mauro';
            const name = row.profile?.displayName || row.profile?.metadataURI || fallback;
            const pioneers = row.profile?.supporterCount;
            return (
              <Link
                key={row.id}
                to={`/artist/${row.id}`}
                className="flex items-center justify-between rounded-xl bg-surface-container-high p-2 transition-colors hover:bg-surface-variant"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest font-serif text-lg text-primary-container">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-on-surface">{name}</h4>
                    <p className="truncate text-xs text-outline">
                      {pioneers !== undefined
                        ? `${pioneers} ${pioneers === 1 ? 'pionero' : 'pioneros'}`
                        : `Artista ${row.id}`}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-surface-container-lowest px-1 py-0.5 font-mono text-[0.6875rem] text-primary">
                  #{String(row.id).padStart(3, '0')}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-10 space-y-1 rounded-xl bg-surface-container-low p-4 text-center">
        <p className="font-serif text-xl italic text-on-surface">
          “Bancaste primero. Que no te vengan a contar después.”
        </p>
        <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-outline">
          Salta, República Argentina · Monad testnet
        </p>
      </div>
    </section>
  );
}

function HowStep({ n, title, detail }: { n: string; title: string; detail: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="shrink-0 pt-0.5 font-mono text-sm font-semibold text-primary-container">{n}</span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-on-surface">{title}</p>
        <p className="text-xs text-outline">{detail}</p>
      </div>
    </li>
  );
}
