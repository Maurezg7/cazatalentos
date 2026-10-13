import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { localizeArtistName, localizePlace } from '../i18n/artists';
import { useLocale, useT } from '../i18n/LocaleContext';
import { mediaUrl } from '../lib/api';
import { prefetchArtist } from '../lib/prefetch';
import { formatMonFromWei } from '../landing/pozo';
import { admiteEntrada, avancePozo, chipPozo, chipPozoKey } from './selectores';
import type { ArtistaExplorar } from './tipos';

function useWarmArtist() {
  const queryClient = useQueryClient();
  return (artistId: number) => prefetchArtist(queryClient, artistId);
}

export function ArtistaCard({ artista }: { artista: ArtistaExplorar }) {
  const t = useT();
  const { locale } = useLocale();
  const warm = useWarmArtist();
  const [fotoFailed, setFotoFailed] = useState(false);
  const portada = mediaUrl(artista.portada) ?? `/artists/${artista.id}-cover.jpg`;
  const foto = mediaUrl(artista.foto) ?? `/artists/${artista.id}-photo.jpg`;
  const cerrado = !admiteEntrada(artista);
  const motivo = cerrado ? (!artista.pozo ? t('noPoolYet') : t('poolClosedReason')) : null;
  const nombre = localizeArtistName(artista.nombre, locale);
  const ciudad = localizePlace(artista.ciudad, locale);
  const initial = nombre.trim().slice(0, 1).toUpperCase() || 'A';
  const chip = chipPozo(artista);

  return (
    <article className="pozo-card flex min-h-[280px] flex-col overflow-hidden" role="listitem">
      <div className="relative h-24">
        {portada ? (
          <img
            src={portada}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="h-full w-full" style={{ background: 'var(--line)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {artista.patrocinado ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#1c1814] px-2 py-1 text-xs font-semibold text-[#f3e9d6]">
            {t('sponsoredLabel')}
          </span>
        ) : null}
        <span className="absolute bottom-2 left-3 inline-flex h-11 w-11 overflow-hidden rounded-full border-2 border-[#f3e9d6] bg-[#1c1814] shadow-md">
          {!fotoFailed ? (
            <img src={foto} alt="" className="h-full w-full object-cover" onError={() => setFotoFailed(true)} />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-serif text-sm text-[#f3e9d6]">{initial}</span>
          )}
        </span>
        <h2 className="display-num absolute bottom-2 left-16 right-3 m-0 break-words text-xl uppercase text-[#f3e9d6]">
          {nombre}
        </h2>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="tone-muted m-0 text-sm">{ciudad}</p>
        <p className="m-0 text-sm font-semibold">{t(chipPozoKey(chip))}</p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={avancePozo(artista)}
          className="h-1.5 overflow-hidden rounded-full"
          style={{ background: 'var(--line)' }}
        >
          <span className="block h-full" style={{ width: `${avancePozo(artista)}%`, background: 'var(--sun)' }} />
        </div>
        <p className="m-0 text-sm">
          {artista.pioneros === 1 ? t('pioneerOne') : t('pioneerMany', { n: artista.pioneros })}
          {artista.pozo
            ? ` · ${formatMonFromWei(/^-?\d+$/.test(artista.pozo.montoWei) ? BigInt(artista.pozo.montoWei) : 0n)}`
            : ''}
        </p>
        <div className="mt-auto flex gap-2">
          <Link
            to={`/artist/${artista.id}`}
            onMouseEnter={() => warm(artista.id)}
            onFocus={() => warm(artista.id)}
            className="landing-focus line-btn inline-flex h-11 flex-1 items-center justify-center text-sm font-semibold"
          >
            {t('viewProfile')}
          </Link>
          {motivo ? (
            <button type="button" disabled className="h-11 flex-1 rounded-[10px] text-sm opacity-60">
              {motivo}
            </button>
          ) : (
            <Link
              to={`/artist/${artista.id}`}
              onMouseEnter={() => warm(artista.id)}
              onFocus={() => warm(artista.id)}
              className="landing-focus sun-btn inline-flex h-11 flex-1 items-center justify-center text-sm font-semibold"
            >
              {t('wasThereFirst')}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ArtistaRow({ artista }: { artista: ArtistaExplorar }) {
  const t = useT();
  const { locale } = useLocale();
  const warm = useWarmArtist();
  const cerrado = !admiteEntrada(artista);
  const motivo = cerrado ? (!artista.pozo ? t('noPoolYet') : t('poolClosedReason')) : null;
  const nombre = localizeArtistName(artista.nombre, locale);
  const ciudad = localizePlace(artista.ciudad, locale);
  const chip = chipPozo(artista);

  return (
    <article
      className="pozo-card grid min-w-0 items-center gap-3 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
      role="listitem"
    >
      <div className="min-w-0">
        {artista.patrocinado ? <p className="m-0 text-xs font-semibold uppercase">{t('sponsoredLabel')}</p> : null}
        <h2 className="display-num m-0 break-words text-2xl uppercase">{nombre}</h2>
        <p className="tone-muted m-0 text-sm">{ciudad}</p>
      </div>
      <p className="m-0 text-sm">{t(chipPozoKey(chip))}</p>
      <div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={avancePozo(artista)}
          className="h-1.5 overflow-hidden rounded-full"
          style={{ background: 'var(--line)' }}
        >
          <span className="block h-full" style={{ width: `${avancePozo(artista)}%`, background: 'var(--sun)' }} />
        </div>
        <p className="m-0 mt-1 text-sm">
          {artista.pioneros === 1 ? t('pioneerOne') : t('pioneerMany', { n: artista.pioneros })}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/artist/${artista.id}`}
          onMouseEnter={() => warm(artista.id)}
          onFocus={() => warm(artista.id)}
          className="landing-focus line-btn inline-flex h-11 items-center px-3 text-sm font-semibold"
        >
          {t('viewProfile')}
        </Link>
        {motivo ? (
          <span className="tone-muted self-center text-sm">{motivo}</span>
        ) : (
          <Link
            to={`/artist/${artista.id}`}
            onMouseEnter={() => warm(artista.id)}
            onFocus={() => warm(artista.id)}
            className="landing-focus sun-btn inline-flex h-11 items-center px-3 text-sm font-semibold"
          >
            {t('wasThereFirst')}
          </Link>
        )}
      </div>
    </article>
  );
}
