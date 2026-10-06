import { VIDEO } from '../content/como-funciona';

export function VideoExplicativo() {
  if (!VIDEO.src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)]">
        <p className="m-0 font-semibold">Video próximamente</p>
      </div>
    );
  }
  return (
    <figure className="m-0">
      <video controls preload="none" poster={VIDEO.poster ?? undefined} className="w-full rounded-[var(--radius-card)]">
        <source src={VIDEO.src} />
        <track kind="captions" srcLang="es" label="Español" src="/como-funciona-captions.vtt" />
      </video>
      <figcaption>
        <details>
          <summary>Transcripción</summary>
          <p>{VIDEO.transcripcion}</p>
        </details>
      </figcaption>
    </figure>
  );
}
