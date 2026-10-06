import { useRef, useState } from 'react';
import { nameFontClass, readableInk } from '../lib/name-style';
import { flagEmoji } from '../lib/places';
import { ArtistReels } from './ArtistReels';

type ArtistHeaderProps = {
  artistId: bigint;
  name: string;
  bio: string | null;
  bioWash: string | null;
  bioInk: string | null;
  nameFont: string | null;
  country: string | null;
  region: string | null;
  photo: string | null;
  isOwner: boolean;
  ownerAddress: string | undefined;
  supporterCount: number;
  poolCount: number;
  accent: string | null;
};

export function ArtistHeader({
  artistId,
  name,
  bio,
  bioWash,
  bioInk,
  nameFont,
  country,
  region,
  photo,
  isOwner,
  ownerAddress,
  supporterCount,
  poolCount,
  accent,
}: ArtistHeaderProps) {
  const acta = artistId.toString().padStart(3, '0');
  const initial = name.trim().slice(0, 1).toUpperCase() || 'A';
  const pioneers =
    supporterCount === 1 ? '1 pionero' : `${supporterCount} pioneros`;
  const poolsLabel = poolCount === 1 ? '1 pozo' : `${poolCount} pozos`;

  return (
    <div className="relative -mt-14 md:-mt-16">
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#14180f] bg-[#2e3723] shadow-2xl md:h-32 md:w-32">
            {photo && !isVideoUrl(photo) ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-4xl font-semibold italic text-primary">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={`text-4xl font-semibold leading-none tracking-tight md:text-5xl ${nameFontClass(nameFont)}`}
                style={{ color: readableInk(bioInk, bioWash) }}
              >
                {name}
              </h1>
              {isOwner ? (
                <span className="rounded-full bg-[#2d381f] px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wide text-secondary">
                  Tu perfil
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-widest text-[#9ea78b]">
              Acta #{acta}
            </p>
            {country ? (
              <p className="mt-1 text-sm text-[#d6debe]">
                <span aria-hidden>{flagEmoji(country)}</span> {region ? region : country}
              </p>
            ) : null}
          </div>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="font-mono text-[0.625rem] uppercase tracking-wider text-[#869272]">Pioneros</dt>
            <dd className="font-serif text-xl italic text-[#f5f7ee]">{pioneers}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.625rem] uppercase tracking-wider text-[#869272]">Pozos</dt>
            <dd className="font-serif text-xl italic" style={{ color: accent ?? '#c6a15a' }}>{poolsLabel}</dd>
          </div>
        </dl>
      </div>

      {bio ? (
        <p
          className="mt-5 max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed md:text-base"
          style={{
            backgroundColor: bioWash ?? '#1c2416',
            color: bioInk ?? '#dbe2ce',
          }}
        >
          {bio}
        </p>
      ) : null}

      <ArtistReels artistId={Number(artistId)} isOwner={isOwner} ownerAddress={ownerAddress} />
    </div>
  );
}

export function CoverMedia({ src, name, wash }: { src: string | null; name: string; wash: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(src === null || !isVideoUrl(src));

  const video = src !== null && isVideoUrl(src);

  function togglePlayback() {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play();
      setPaused(false);
      return;
    }
    node.pause();
    setPaused(true);
  }

  return (
    <div
      className={`relative mb-0 w-full overflow-hidden bg-[#14180f] ${
        src ? 'h-[220px] md:h-[300px]' : 'h-[160px] md:h-[200px]'
      }`}
    >
      {src && video ? (
        <video
          ref={videoRef}
          className={`h-full w-full object-cover object-center transition-[filter] duration-500 ${
            loaded ? 'brightness-90' : 'scale-105 blur-md brightness-75'
          }`}
          src={src}
          muted
          loop
          playsInline
          autoPlay
          onLoadedData={() => setLoaded(true)}
        />
      ) : null}
      {src && !video ? (
        <img
          alt={`Tapa de ${name}`}
          className="h-full w-full object-cover object-center brightness-90 contrast-[1.05]"
          src={src}
        />
      ) : null}
      {!src ? (
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(160deg, ${wash ?? '#1b2214'} 0%, #14180f 100%)`,
          }}
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${wash ?? '#14180f'} 0%, transparent 55%, rgba(0,0,0,0.35) 100%)`,
        }}
      />

      {!loaded && video ? (
        <p className="absolute left-4 top-4 z-10 font-mono text-[0.6875rem] uppercase tracking-wider text-[#d6debe]">
          Cargando tapa…
        </p>
      ) : null}

      {video ? (
        <button
          type="button"
          aria-label={paused ? 'Reproducir tapa' : 'Pausar tapa'}
          onClick={togglePlayback}
          className="absolute bottom-4 right-4 z-20 flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 border-[#48582d] bg-[#192013]/90 px-3 font-mono text-[0.6875rem] text-[#e4e3d9]"
        >
          <PlayPauseIcon paused={paused} />
          <span>{paused ? 'Reproducir' : 'Pausar'}</span>
        </button>
      ) : null}
    </div>
  );
}

function PlayPauseIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg aria-hidden className="h-4 w-4 fill-secondary" viewBox="0 0 16 16">
      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
    </svg>
  ) : (
    <svg aria-hidden className="h-4 w-4 fill-secondary" viewBox="0 0 16 16">
      <path d="M4 3h3v10H4V3Zm5 0h3v10H9V3Z" />
    </svg>
  );
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}
