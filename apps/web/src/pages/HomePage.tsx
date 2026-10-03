import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import type { ArtistProfile, PoolDto } from '../lib/api';
import { fetchArtistPools, fetchArtistProfile } from '../lib/api';
import { formatMON, poolStatusLabel } from '../lib/format';
import { useTotalArtists } from '../lib/hooks';
import { useEntrySheet } from '../components/EntrySheet';
import { RegisterArtistModal } from '../components/RegisterArtistModal';

const FEATURED_IDS = [1, 2] as const;

const STATUS_INDEX = {
  Open: 0,
  Claimed: 1,
  Approved: 2,
  Rejected: 3,
  Reclaimed: 4,
} as const;

type FeaturedRow = {
  id: number;
  profile: ArtistProfile | null;
  pools: PoolDto[];
};

export function HomePage() {
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();
  const { openEntry } = useEntrySheet();
  const [registerOpen, setRegisterOpen] = useState(false);
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

  const featured: FeaturedRow[] = FEATURED_IDS.map((id) => {
    const row = featuredQuery.data?.find((item) => item.id === id);
    return { id, profile: row?.profile ?? null, pools: row?.pools ?? [] };
  });
  const mauro = featured.find((row) => row.id === 2);
  const mauroName = artistName(mauro, 'Mauro');
  const mauroPioneers = mauro?.profile?.supporterCount;
  const examplePool = mauro?.pools[0];
  const exampleAmount =
    examplePool !== undefined ? `${formatMON(BigInt(examplePool.amountWei))} MON` : null;

  const pools = featured
    .flatMap((row) =>
      row.pools.map((pool) => ({
        pool,
        artistName: artistName(row, row.id === 1 ? 'Los Copleros' : 'Mauro'),
      })),
    )
    .sort((left, right) => new Date(right.pool.deadline).getTime() - new Date(left.pool.deadline).getTime());

  function openRegister() {
    if (!authenticated) {
      openEntry();
      return;
    }
    setRegisterOpen(true);
  }

  return (
    <section className="flex flex-col gap-6 pb-6 pt-4 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:gap-y-8 lg:pb-10 lg:pt-8">
      <FeaturedArtistCard
        className="order-1 lg:col-span-6 lg:col-start-7 lg:row-start-1"
        id={2}
        name={mauroName}
        photo={mauro?.profile?.photo ?? null}
        pioneerCount={mauroPioneers}
        loading={featuredQuery.isLoading}
      />

      <section className="order-2 flex flex-col overflow-hidden rounded-xl bg-surface-container-low p-4 shadow-md lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider text-primary">
            Registro inalterable
          </span>
          <span className="font-mono text-[0.6875rem] text-outline">Provincia de Salta</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-on-surface lg:text-5xl">
          Creíste primero.
          <br />
          <span className="italic text-primary">Quedó registrado.</span>
        </h1>
        <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-on-surface-variant lg:text-base">
          Respaldá a un artista antes del aplauso masivo. Te queda una entrada numerada y, si el hito
          se cumple, participás del pozo.
        </p>

        <div className="relative mt-4 overflow-hidden rounded-lg bg-surface-container p-4">
          <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-primary-container" />
          <div className="flex items-start justify-between pl-2">
            <div>
              <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-outline">
                Ejemplo de creyente temprano
              </span>
              <span className="font-serif text-xl font-medium text-on-surface">{mauroName}</span>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[0.6875rem] font-semibold uppercase text-secondary">
                Primer pionero
              </span>
              <div className="font-mono text-lg font-bold tracking-tight text-primary">Nº 001</div>
            </div>
          </div>
          <div className="relative my-3 flex items-center">
            <div className="absolute -left-6 h-4 w-4 rounded-full bg-surface-container-low" />
            <div className="mx-1 w-full border-t border-dashed border-outline/30" />
            <div className="absolute -right-6 h-4 w-4 rounded-full bg-surface-container-low" />
          </div>
          <div className="flex items-center justify-between pl-2">
            <div className="flex flex-col">
              <span className="font-mono text-[0.6875rem] text-outline">Artista 2 · pozo 1</span>
              <span className="text-xs font-medium text-on-surface">En votación</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[0.6875rem] text-outline">En el pozo</span>
              <span className="font-mono text-[0.6875rem] font-semibold text-secondary">
                {exampleAmount ?? '0.100 MON'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/artist/2"
            className="flex h-11 items-center justify-center rounded bg-primary-container text-sm font-bold text-on-primary-container transition-transform active:scale-[0.98]"
          >
            Soy fan
          </Link>
          <button
            type="button"
            onClick={openRegister}
            disabled={!ready}
            className="flex h-11 items-center justify-center rounded bg-surface-container-high text-sm font-medium text-on-surface transition-colors hover:bg-surface-bright disabled:opacity-50"
          >
            Soy artista
          </button>
        </div>
      </section>

      <section className="order-3 flex flex-col gap-3 lg:col-span-6 lg:col-start-1 lg:row-start-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-on-surface">¿Cómo funciona?</h2>
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-outline">
            4 pasos
          </span>
        </div>
        <ol className="grid grid-cols-2 gap-2">
          <HowStep
            n="01"
            title="Descubrí un artista"
            detail="Mirá quién está en el registro y escuchá antes de que se llene."
          />
          <HowStep
            n="02"
            title="Dejá tu marca"
            detail="Un depósito chico de respaldo, atado a tu lugar en la fila."
          />
          <HowStep
            n="03"
            accent="secondary"
            title="Entrada numerada"
            detail="Tu rango queda anotado y no se puede borrar ni comprar."
          />
          <HowStep
            n="04"
            accent="secondary"
            title="Cobrá si llega"
            detail="Si el hito se aprueba, el pozo se reparte entre quienes llegaron primero."
          />
        </ol>
      </section>

      <section className="order-4 flex flex-col gap-3 lg:col-span-6 lg:col-start-7 lg:row-start-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl text-on-surface">Artistas en el registro</h2>
          <span className="font-mono text-[0.6875rem] text-secondary">
            {artistCount !== undefined
              ? `${artistCount} ${artistCount === 1 ? 'artista' : 'artistas'}`
              : 'Cargando…'}
          </span>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          {featured.map((row) => {
            const fallback = row.id === 1 ? 'Los Copleros' : 'Mauro';
            const name = artistName(row, fallback);
            const pioneers = row.profile?.supporterCount;
            return (
              <Link
                key={row.id}
                to={`/artist/${row.id}`}
                className="flex w-[240px] shrink-0 flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-md lg:w-auto"
              >
                <div className="relative h-28 w-full bg-surface-container">
                  {row.profile?.photo ? (
                    <img src={row.profile.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-3xl italic text-primary">
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-2 p-3">
                  <div>
                    <h3 className="font-serif text-xl leading-tight text-on-surface">{name}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {pioneers !== undefined
                        ? `${pioneers} ${pioneers === 1 ? 'pionero' : 'pioneros'}`
                        : `Artista ${row.id}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.6875rem] text-primary">
                      #{String(row.id).padStart(3, '0')}
                    </span>
                    <span className="flex h-11 items-center rounded bg-primary-container px-3 font-mono text-[0.6875rem] font-bold text-on-primary-container">
                      Ver
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {pools.length > 0 ? (
        <section className="order-5 flex flex-col gap-3 lg:col-span-6 lg:col-start-7 lg:row-start-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl text-on-surface">Pozos</h2>
            <span className="font-mono text-[0.6875rem] font-semibold uppercase text-secondary">
              En curso
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {pools.map(({ pool, artistName: name }) => (
              <Link
                key={pool.id}
                to={`/pool/${pool.id}`}
                className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-4 shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase text-primary">
                        {poolStatusLabel(STATUS_INDEX[pool.status])}
                      </span>
                      <span className="font-mono text-[0.6875rem] text-outline">
                        Pozo #{String(pool.id).padStart(3, '0')}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-on-surface">
                      {pool.milestoneDescription ?? `Pozo ${pool.id}`}
                    </h3>
                    <p className="text-xs text-on-surface-variant">{name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-lg font-bold text-primary">
                      {formatMON(BigInt(pool.amountWei))} MON
                    </div>
                    <span className="font-mono text-[0.6875rem] text-outline">acumulado</span>
                  </div>
                </div>
                <span className="flex h-11 items-center justify-center rounded bg-surface-container-high text-sm font-semibold text-on-surface">
                  Ver el pozo
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="order-6 relative overflow-hidden rounded-xl bg-surface-container-low p-4 shadow-md lg:col-span-12 lg:p-6">
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-primary">
          Espacio para músicos
        </span>
        <h2 className="mt-1 font-serif text-xl leading-tight text-on-surface">
          ¿Tocás en peñas o festivales?
        </h2>
        <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-on-surface-variant">
          Abrí tu perfil, contá tu próximo hito y dejá que tu gente respalde el despegue.
        </p>
        <button
          type="button"
          onClick={openRegister}
          disabled={!ready}
          className="mt-4 flex h-11 w-full items-center justify-center rounded bg-primary-container text-sm font-bold text-on-primary-container transition-transform active:scale-[0.99] disabled:opacity-50 lg:w-fit lg:px-8"
        >
          Crear mi perfil de artista
        </button>
      </section>

      <div className="order-7 space-y-1 rounded-xl bg-surface-container-low p-4 text-center lg:col-span-12 lg:p-6">
        <p className="font-serif text-xl italic text-on-surface">
          “Bancaste primero. Que no te vengan a contar después.”
        </p>
        <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-outline">
          Salta, República Argentina
        </p>
      </div>

      <RegisterArtistModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={(newArtistId) => {
          setRegisterOpen(false);
          if (newArtistId !== undefined) {
            void navigate(`/artist/${newArtistId.toString()}`);
          }
        }}
      />
    </section>
  );
}

function FeaturedArtistCard({
  className,
  id,
  name,
  photo,
  pioneerCount,
  loading,
}: {
  className?: string;
  id: number;
  name: string;
  photo: string | null;
  pioneerCount: number | undefined;
  loading: boolean;
}) {
  const pioneers =
    pioneerCount === undefined
      ? null
      : pioneerCount === 1
        ? '1 pionero'
        : `${pioneerCount} pioneros`;

  return (
    <article
      className={`relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-xl bg-surface-container-low p-4 shadow-xl lg:min-h-[360px] ${className ?? ''}`}
    >
      {photo ? (
        <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1b1c16_0%,#2a2a24_55%,#13140f_100%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent" />

      <div className="relative z-10 mb-2 self-start rounded-full bg-primary/20 px-2 py-0.5">
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-primary">
          Destacado
        </span>
      </div>

      <div className="relative z-10 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl font-medium leading-tight text-on-surface lg:text-3xl">
            {loading ? 'Cargando…' : name}
          </h2>
          {pioneers ? (
            <span className="rounded bg-surface-container-highest/90 px-2 py-0.5 font-mono text-[0.6875rem] font-semibold text-primary">
              {pioneers}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 mt-3 grid grid-cols-2 gap-2">
        <Link
          to={`/artist/${id}`}
          className="flex h-11 items-center justify-center rounded bg-primary-container text-sm font-bold text-on-primary-container transition-transform active:scale-[0.98]"
        >
          Ver perfil
        </Link>
        <Link
          to={`/artist/${id}`}
          className="flex h-11 items-center justify-center rounded bg-surface-container-high/90 text-sm font-medium text-on-surface"
        >
          Dejar mi marca
        </Link>
      </div>
    </article>
  );
}

function HowStep({
  n,
  title,
  detail,
  accent = 'primary',
}: {
  n: string;
  title: string;
  detail: string;
  accent?: 'primary' | 'secondary';
}) {
  return (
    <li className="flex flex-col justify-between gap-2 rounded-lg bg-surface-container-low p-3">
      <span
        className={`font-mono text-lg font-bold ${
          accent === 'secondary' ? 'text-secondary' : 'text-primary'
        }`}
      >
        {n}
      </span>
      <div>
        <h3 className="text-sm font-semibold leading-snug text-on-surface">{title}</h3>
        <p className="mt-0.5 text-xs text-on-surface-variant">{detail}</p>
      </div>
    </li>
  );
}

function artistName(row: FeaturedRow | undefined, fallback: string): string {
  return row?.profile?.displayName || row?.profile?.metadataURI || fallback;
}
