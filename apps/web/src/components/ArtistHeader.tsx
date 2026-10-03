import { useRef, useState } from 'react';

type ArtistHeaderProps = {
  artistId: bigint;
  name: string;
  bio: string | null;
  photo: string | null;
  isOwner: boolean;
  supporterCount: number;
  poolCount: number;
};

export function ArtistHeader({
  artistId,
  name,
  bio,
  photo,
  isOwner,
  supporterCount,
  poolCount,
}: ArtistHeaderProps) {
  const acta = artistId.toString().padStart(3, '0');
  const initial = name.trim().slice(0, 1).toUpperCase() || 'A';
  const pioneers =
    supporterCount === 1 ? '1 pionero' : `${supporterCount} pioneros`;
  const poolsLabel = poolCount === 1 ? '1 pozo' : `${poolCount} pozos`;

  return (
      <div className="relative rounded-2xl border-2 border-[#434e2c] bg-[#21281a] p-4 pt-0 shadow-lg">
        <div className="mb-3 flex items-end justify-between -mt-12">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-[3px] border-[#21281a] bg-[#2e3723] shadow-2xl ring-2 ring-[#5c6b3a]">
            {photo && !isVideoUrl(photo) ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-3xl font-semibold italic text-primary">
                {initial}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-4xl font-semibold italic leading-none tracking-tight text-[#f5f7ee] lg:text-5xl">
            {name}
          </h1>
          {isOwner ? (
            <span className="rounded-md border border-[#48592d] bg-[#2d381f] px-2 py-0.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-wide text-secondary">
              Tu perfil
            </span>
          ) : null}
        </div>

        <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-widest text-[#9ea78b]">
          Registro · Acta #{acta}
        </p>

        {bio ? (
          <p className="mt-3 border-t border-[#2e3722] pt-3 text-sm leading-relaxed text-[#dbe2ce] lg:text-base">
            {bio}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#343e24] bg-[#192013] p-2.5">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase text-[#869272]">Pioneros</span>
            <span className="font-mono text-sm font-bold text-[#f5f7ee]">{pioneers}</span>
          </div>
          <div className="flex flex-col border-l border-[#2e3820] pl-2.5">
            <span className="font-mono text-[10px] uppercase text-[#869272]">Pozos</span>
            <span className="font-mono text-sm font-bold text-primary">{poolsLabel}</span>
          </div>
        </div>
      </div>
  );
}

export function CoverMedia({ src, name }: { src: string | null; name: string }) {
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
      className={`relative mb-0 w-full overflow-hidden rounded-2xl border-2 border-[#434f2b] bg-[#14180f] shadow-xl ${
        src ? 'h-[220px] md:h-[320px] lg:h-[400px]' : 'h-[140px] md:h-[180px]'
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
        <div className="h-full w-full bg-[linear-gradient(160deg,#1b2214_0%,#2e3723_55%,#14180f_100%)]" />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14180f] via-transparent to-black/40" />

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
