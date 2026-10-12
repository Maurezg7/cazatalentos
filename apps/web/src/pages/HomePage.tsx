import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { mediaUrl } from '../lib/api';
import { fetchExplorar } from '../explorar/fetch';
import type { ArtistaExplorar } from '../explorar/tipos';
import { HeroLanding } from '../landing/HeroLanding';
import { FranjaConfianza } from '../landing/FranjaConfianza';
import { PozosAbiertos } from '../landing/PozosAbiertos';
import type { Pozo } from '../landing/pozo';
import { readTotalArtists } from '../lib/public-read';
import { useEntrySignal } from '../lib/entry-signal';
import { HOME_CARTELERA, prefetchArtist } from '../lib/prefetch';
import { Marquee } from '../effects/Marquee';
import { ScrollReveal } from '../effects/ScrollReveal';
import useEmblaCarousel from 'embla-carousel-react';
import { Icon } from '../components/Icon';

const RegisterArtistModal = lazy(() =>
  import('../components/RegisterArtistModal').then((m) => ({ default: m.RegisterArtistModal })),
);

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { authenticated } = useEntrySignal();
  const [registerOpen, setRegisterOpen] = useState(false);
  const cartelera = useQuery({
    queryKey: ['home-cartelera'],
    queryFn: () => fetchExplorar(HOME_CARTELERA),
  });
  const artistas = cartelera.data?.items ?? [];
  useQuery({ queryKey: ['total-artists'], queryFn: readTotalArtists });

  const pozos = openPoolsFromCartelera(artistas);
  const lead = artistas[0];
  const patrocinados = artistas.filter((artista) => artista.patrocinado);
  const loadingArtistas = cartelera.isLoading && !cartelera.data;
  const loadingPozos = loadingArtistas;

  function warmArtist(artistId: number) {
    prefetchArtist(queryClient, artistId);
  }

  const showRegister = registerOpen || (params.get('alta') === '1' && authenticated);

  function closeRegister() {
    setRegisterOpen(false);
    if (params.get('alta') === '1') {
      const next = new URLSearchParams(params);
      next.delete('alta');
      setParams(next, { replace: true });
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-12 py-6 font-body text-ink dark:text-cream">
      <HeroLanding
        artista={lead?.nombre ?? 'Un artista del NOA'}
        ciudad={lead && lead.ciudad !== 'Sin ciudad' ? lead.ciudad : 'Salta'}
        pioneros={lead?.pioneros ?? 0}
        pozosAbiertos={pozos.length}
        onExplorar="/explorar"
      />
      <SponsoredCarousel rows={patrocinados} loading={loadingArtistas} onWarmArtist={warmArtist} />

      <ScrollReveal>
      <section id="como" className="flex flex-col gap-4">
        <h2 className="font-display text-2xl uppercase tracking-wide">Cómo funciona</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Step n="01" title="Descubrí un artista" detail="Mirá el perfil y si hay un pozo abierto." />
          <Step n="02" title="Marcá “Estuve antes”" detail="El contrato te da el siguiente número." />
          <Step n="03" title="Recibí tu entrada" detail="El depósito queda en el contrato, aparte del pozo." />
          <Step n="04" title="Se vota la meta" detail="48 horas de votación. Si se aprueba, reclamás una parte según tu peso." />
        </ol>
        <Link to="/como-funciona" className="landing-focus inline-flex h-11 items-center font-semibold underline">Ver ejemplo completo</Link>
      </section>
      </ScrollReveal>

      <section id="artistas" className="flex min-w-0 flex-col gap-3">
        <h2 className="font-display text-2xl uppercase tracking-wide">Artistas en ascenso</h2>
        {loadingArtistas ? (
          <div className="h-56 animate-pulse rounded-2xl bg-ink/10 dark:bg-cream/10" />
        ) : cartelera.isError ? (
          <p className="ticket p-4">No pudimos leer el registro. Probá de nuevo en un momento.</p>
        ) : artistas.length === 0 ? (
          <p className="ticket p-4">Todavía no hay artistas en el registro.</p>
        ) : (
          <div className="flex min-w-0 snap-x gap-3 overflow-x-auto pb-2">
            {artistas.map((artista) => (
              <Link
                key={artista.id}
                to={`/artist/${artista.id}`}
                onMouseEnter={() => warmArtist(artista.id)}
                onFocus={() => warmArtist(artista.id)}
                className="ticket w-56 shrink-0 snap-start p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta"
              >
                <div className="relative h-36 overflow-hidden rounded-xl bg-ink/10">
                  {artista.portada ? (
                    <img src={mediaUrl(artista.portada) || ''} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-xl uppercase leading-none">{artista.nombre}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm">
                  <Icon name="geo-alt" className="h-3.5 w-3.5" />
                  {artista.ciudad}
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm font-semibold">
                  <Icon name="people" className="h-3.5 w-3.5" />
                  {artista.pioneros === 1 ? '1 pionero' : `${artista.pioneros} pioneros`}
                </p>
                {artista.patrocinado ? (
                  <span className="mt-2 inline-flex text-xs font-bold uppercase tracking-wide text-ochre">En alza</span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <PozosAbiertos
        pozos={pozos}
        loading={loadingPozos}
        error={cartelera.isError}
        onRetry={() => {
          void cartelera.refetch();
        }}
      />
      <FranjaConfianza />

      <section aria-label="Cómo queda asentado" className="ticket overflow-hidden px-4 py-3">
        <Marquee text="El número lo asigna el contrato al firmar · El depósito del fan queda aparte del pozo del artista · " />
      </section>

      <footer className="flex flex-col gap-3 border-t border-dashed border-ink/30 pt-6 dark:border-cream/30">
        <img src="/logo-light.svg" alt="Cazatalentos" className="h-8 w-auto self-start dark:hidden" />
        <img src="/logo.svg" alt="Cazatalentos" className="hidden h-8 w-auto self-start dark:block" />
        <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wide">
          <Link to="/explorar" className="inline-flex h-11 items-center">Explorar</Link>
          <Link to="/como-funciona" className="inline-flex h-11 items-center">Cómo funciona</Link>
        </div>
        <span className="ticket-stub h-4 w-40 text-ink/50 dark:text-cream/50" aria-hidden />
        <p className="text-sm">Salta, República Argentina</p>
      </footer>

      {showRegister ? (
        <Suspense fallback={null}>
          <RegisterArtistModal
            open={showRegister}
            onClose={closeRegister}
            onRegistered={(id) => {
              closeRegister();
              if (id !== undefined) void navigate(`/artist/${id.toString()}`);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function openPoolsFromCartelera(artistas: ArtistaExplorar[]): Pozo[] {
  return artistas.flatMap((artista) => {
    const pozo = artista.pozo;
    if (!pozo?.abierto) return [];
    return [
      {
        id: pozo.id ?? artista.id,
        artistaId: artista.id,
        artista: artista.nombre,
        ciudad: artista.ciudad === 'Sin ciudad' ? 'Salta' : artista.ciudad,
        montoWei: BigInt(pozo.montoWei || '0'),
        metaWei: pozo.metaWei ? BigInt(pozo.metaWei) : null,
        metaTexto: 'la meta del artista',
        pioneros: artista.pioneros,
        cupoMaximo: pozo.cupoMaximo,
        cierraEn: new Date(pozo.cierraEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }),
        portada: mediaUrl(artista.portada),
        estado: 'en_curso' as const,
        abierto: true,
      },
    ];
  });
}

function SponsoredCarousel({
  rows,
  loading,
  onWarmArtist,
}: {
  rows: ArtistaExplorar[];
  loading: boolean;
  onWarmArtist: (artistId: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: rows.length > 1, skipSnaps: false });
  const count = Math.max(rows.length, 1);

  useEffect(() => {
    if (paused || loading || rows.length === 0) return;
    const timer = window.setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
      else setIndex((current) => (current + 1) % rows.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, loading, rows.length, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Artistas patrocinados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-sm uppercase tracking-[0.18em]">Patrocinados</h2>
        <div className="hidden gap-2 md:flex">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 dark:border-cream/30" aria-label="Anterior" onClick={() => (emblaApi ? emblaApi.scrollPrev() : setIndex((current) => (current - 1 + count) % count))}><Icon name="chevron-left" className="h-4 w-4" /></button>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 dark:border-cream/30" aria-label="Siguiente" onClick={() => (emblaApi ? emblaApi.scrollNext() : setIndex((current) => (current + 1) % count))}><Icon name="chevron-right" className="h-4 w-4" /></button>
        </div>
      </div>
      {loading ? (
        <div className="h-44 animate-pulse rounded-2xl bg-ink/10 dark:bg-cream/10 sm:h-48" />
      ) : rows.length === 0 ? (
        <p className="ticket flex h-48 w-full items-center justify-center p-6 text-center font-display text-2xl uppercase">
          Pronto hay artistas acá
        </p>
      ) : (
        <div ref={emblaRef} className="overflow-hidden" onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
        <div className="flex">
          {rows.map((row, position) => {
            const active = position === index % rows.length;
            const portada = mediaUrl(row.portada);
            return (
              <article
                key={row.id}
                className={`relative min-h-44 min-w-0 shrink-0 grow-0 basis-full overflow-hidden rounded-2xl text-cream sm:min-h-48 sm:basis-[85%] lg:basis-[28rem] ${active ? '' : 'lg:scale-[0.96] lg:opacity-80'}`}
              >
                {portada ? (
                  <img src={portada} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-ink" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
                <span className="absolute right-3 top-3 rounded-lg bg-cream px-2 py-1 text-[0.6875rem] font-bold tracking-wide text-ink">PATROCINADO</span>
                <div className="relative flex min-h-44 flex-col justify-end gap-2 p-4 sm:min-h-48">
                  <h3 className="font-display text-2xl uppercase leading-none sm:text-3xl">{row.nombre}</h3>
                  <p className="flex items-center gap-1 text-sm">
                    <Icon name="geo-alt" className="h-3.5 w-3.5" />
                    {row.ciudad} · {row.pioneros === 1 ? '1 pionero' : `${row.pioneros} pioneros`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/artist/${row.id}`}
                      onMouseEnter={() => onWarmArtist(row.id)}
                      onFocus={() => onWarmArtist(row.id)}
                      className="inline-flex h-11 items-center rounded-xl bg-terracotta px-4 text-sm font-bold text-cream dark:bg-terracotta-dark"
                    >
                      Ver perfil
                    </Link>
                    <Link
                      to={`/artist/${row.id}`}
                      onMouseEnter={() => onWarmArtist(row.id)}
                      onFocus={() => onWarmArtist(row.id)}
                      className="inline-flex h-11 items-center rounded-xl border border-cream px-4 text-sm font-bold"
                    >
                      Estuve antes
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {rows.map((row, position) => (
          <span key={row.id} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/15 dark:bg-cream/20">
            <span className={`block h-full bg-terracotta dark:bg-terracotta-dark ${position === index % Math.max(rows.length, 1) && !paused ? 'w-full transition-[width] duration-[6000ms]' : position < index ? 'w-full' : 'w-0'}`} />
          </span>
        ))}
      </div>
    </section>
  );
}

function Step({ n, title, detail }: { n: string; title: string; detail: string }) {
  return (
    <li className="ticket flex min-h-36 flex-col justify-between p-4">
      <span className="font-display text-3xl text-terracotta dark:text-terracotta-dark">{n}</span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm">{detail}</p>
      </div>
    </li>
  );
}
