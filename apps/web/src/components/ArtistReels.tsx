import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import { API_BASE, createArtistReel, fetchArtistReels, type ArtistReel } from '../lib/api';
import { REEL_FILTERS, reelFilterCss } from '../lib/places';
import { signedWrite } from '../lib/write-auth';
import { Icon } from './Icon';

const MAX_REEL_BYTES = 8 * 1024 * 1024;

type ArtistReelsProps = {
  artistId: number;
  isOwner: boolean;
  ownerAddress: string | undefined;
};

export function ArtistReels({ artistId, isOwner, ownerAddress }: ArtistReelsProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const reels = useQuery({
    queryKey: ['artist-reels', artistId],
    queryFn: () => fetchArtistReels(artistId),
  });

  const items = reels.data ?? [];
  if (!isOwner && items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-serif text-xl italic text-[#f5f7ee]">Reels</span>
        {isOwner ? (
          <button
            type="button"
            disabled={!ownerAddress}
            onClick={() => setEditorOpen(true)}
            className="min-h-9 rounded-full border border-[#8ea459] px-3 font-mono text-[0.6875rem] font-bold text-[#d6debe] disabled:opacity-50"
          >
            Nuevo reel
          </button>
        ) : null}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
      </div>
      {editorOpen ? (
        <ReelEditor
          artistId={artistId}
          onClose={() => setEditorOpen(false)}
          onSaved={() => setEditorOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ReelCard({ reel }: { reel: ArtistReel }) {
  const place =
    reel.textPlace === 'top' ? 'top-3' : reel.textPlace === 'bottom' ? 'bottom-8' : 'top-1/2 -translate-y-1/2';
  return (
    <figure className="w-28 shrink-0">
      <div className="relative">
        <video
          src={`${API_BASE}${reel.src}`}
          className="aspect-[9/16] w-28 rounded-2xl bg-black object-cover ring-1 ring-[#3c4626]"
          style={{ filter: reelFilterCss(reel.filter) }}
          controls
          playsInline
          preload="metadata"
        />
        {reel.overlayText ? (
          <p className={`pointer-events-none absolute inset-x-1 text-center text-[0.6875rem] font-semibold text-white drop-shadow ${place}`}>
            {reel.overlayText}
          </p>
        ) : null}
      </div>
      {reel.caption ? (
        <figcaption className="mt-1 truncate text-[0.6875rem] text-[#d6debe]">{reel.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function pickRecorderMime(): { mimeType: string; extension: 'webm' | 'mp4' } {
  const candidates = [
    'video/mp4',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];
  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
      return { mimeType, extension: mimeType.includes('mp4') ? 'mp4' : 'webm' };
    }
  }
  return { mimeType: '', extension: 'webm' };
}

function ReelEditor({
  artistId,
  onClose,
  onSaved,
}: {
  artistId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [overlayText, setOverlayText] = useState('');
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState<(typeof REEL_FILTERS)[number]['id']>('none');
  const [textPlace, setTextPlace] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();

  function clearTimers() {
    if (autoStopRef.current !== null) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function stopCamera() {
    clearTimers();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (liveRef.current) liveRef.current.srcObject = null;
  }

  useEffect(() => () => stopCamera(), []);

  // Attach the live stream only after the <video> is mounted (fixes black preview on phones).
  useEffect(() => {
    const node = liveRef.current;
    const stream = streamRef.current;
    if (!cameraOpen || !node || !stream) return;
    node.srcObject = stream;
    node.muted = true;
    node.setAttribute('playsinline', 'true');
    node.setAttribute('webkit-playsinline', 'true');
    void node.play().catch(() => undefined);
    return () => {
      node.srcObject = null;
    };
  }, [cameraOpen, facing]);

  const upload = useMutation({
    mutationFn: async () => {
      if (!video) throw new Error('Elegí o grabá un video.');
      const proof = await signedWrite(signMessageAsync, artistId, 'reel', {
        caption: caption.trim(),
        overlayText: overlayText.trim(),
        filter,
        textPlace,
        video,
      });
      return createArtistReel({ artistId, ...proof });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['artist-reels', artistId] });
      stopCamera();
      onSaved();
    },
    onError: (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'No se pudo publicar el reel.');
    },
  });

  async function readFile(file: File) {
    if (file.size > MAX_REEL_BYTES) {
      setError('El reel pesa más de 8 MB.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('No se pudo leer el video.'));
      };
      reader.onerror = () => reject(new Error('No se pudo leer el video.'));
      reader.readAsDataURL(file);
    });
    setError(null);
    setVideo(dataUrl);
  }

  async function openCamera(nextFacing: 'user' | 'environment' = facing) {
    setError(null);
    setVideo(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
      });
      streamRef.current = stream;
      setFacing(nextFacing);
      setCameraOpen(true);
      setRecording(false);
      setSeconds(0);
    } catch {
      setCameraOpen(false);
      setError('No se pudo usar la cámara. Podés subir un video de tus archivos.');
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) {
      void openCamera();
      return;
    }
    setError(null);
    const { mimeType, extension } = pickRecorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      setError('Este navegador no puede grabar video. Subí un archivo.');
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      clearTimers();
      const type = recorder.mimeType || (extension === 'mp4' ? 'video/mp4' : 'video/webm');
      const blob = new Blob(chunks, { type });
      stopCamera();
      setCameraOpen(false);
      setRecording(false);
      setSeconds(0);
      if (blob.size > MAX_REEL_BYTES) {
        setError('La grabación pesa más de 8 MB. Hacela más corta.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setVideo(reader.result);
      };
      reader.readAsDataURL(blob);
    };
    recorderRef.current = recorder;
    recorder.start(250);
    setRecording(true);
    setSeconds(0);
    tickRef.current = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);
    autoStopRef.current = window.setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 15_000);
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  function closeEditor() {
    stopCamera();
    setCameraOpen(false);
    onClose();
  }

  const placeClass =
    textPlace === 'top' ? 'top-6' : textPlace === 'bottom' ? 'bottom-16' : 'top-1/2 -translate-y-1/2';
  const mirrorPreview = facing === 'user';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reel-editor-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#5c6b3a] bg-[#202718] p-4 text-[#e3e8d8]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="reel-editor-title" className="font-serif text-2xl italic text-[#f5f7ee]">
            Nuevo reel
          </h2>
          <button type="button" onClick={closeEditor} aria-label="Cerrar" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#3b4725]">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {!video && !cameraOpen ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void openCamera('user')}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-[#5c6b3a] text-[#12160d] transition active:scale-[0.98]"
            >
              <CameraGlyph className="h-8 w-8" />
              <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-wide">Grabar</span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-[#8ea459] text-[#d6debe] transition active:scale-[0.98]"
            >
              <GalleryGlyph className="h-8 w-8" />
              <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-wide">Archivos</span>
            </button>
          </div>
        ) : null}

        {cameraOpen ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-[220px] overflow-hidden rounded-[1.5rem] bg-black ring-1 ring-[#3c4626]">
              <video
                ref={liveRef}
                autoPlay
                muted
                playsInline
                className={`aspect-[9/16] w-full bg-black object-cover ${mirrorPreview ? 'scale-x-[-1]' : ''}`}
              />
              {recording ? (
                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1">
                  <span className="reel-rec-dot inline-block h-2.5 w-2.5 rounded-full bg-[#ff3b30]" />
                  <span className="font-mono text-[0.6875rem] font-bold tracking-wide text-white">
                    REC {String(Math.min(seconds, 15)).padStart(2, '0')}s
                  </span>
                </div>
              ) : (
                <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[0.625rem] uppercase tracking-wider text-white/80">
                  Listo para grabar
                </p>
              )}
            </div>

            <div className="flex w-full max-w-[220px] items-center justify-between px-2">
              <button
                type="button"
                aria-label="Elegir de archivos"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#414d2b] bg-[#181d13] text-[#d6debe] transition active:scale-95"
              >
                <GalleryGlyph className="h-5 w-5" />
              </button>

              {recording ? (
                <button
                  type="button"
                  aria-label="Parar grabación"
                  onClick={stopRecording}
                  className="reel-shutter relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/80 transition active:scale-95"
                >
                  <span className="h-7 w-7 rounded-md bg-[#ff3b30] shadow-[0_0_18px_rgba(255,59,48,0.65)]" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Empezar a grabar"
                  onClick={startRecording}
                  className="reel-shutter relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white transition active:scale-95"
                >
                  <span className="h-14 w-14 rounded-full bg-[#ff3b30] shadow-[0_0_22px_rgba(255,59,48,0.55)]" />
                </button>
              )}

              <button
                type="button"
                aria-label={facing === 'user' ? 'Usar cámara trasera' : 'Usar cámara frontal'}
                onClick={() => void openCamera(facing === 'user' ? 'environment' : 'user')}
                disabled={recording}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#414d2b] bg-[#181d13] text-[#d6debe] transition active:scale-95 disabled:opacity-40"
              >
                <FlipCameraGlyph className="h-5 w-5" />
              </button>
            </div>
            <p className="font-mono text-[0.6875rem] text-[#879373]">Máximo 15 segundos.</p>
          </div>
        ) : null}

        {video ? (
          <div className="flex flex-col gap-3">
            <div className="relative mx-auto w-40">
              <video
                src={video}
                className="aspect-[9/16] w-40 rounded-2xl bg-black object-cover"
                style={{ filter: reelFilterCss(filter) }}
                controls
                playsInline
              />
              {overlayText ? (
                <p className={`pointer-events-none absolute inset-x-2 text-center text-sm font-semibold text-white drop-shadow ${placeClass}`}>
                  {overlayText}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setVideo(null);
                void openCamera();
              }}
              className="mx-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-[#414d2b] px-3 font-mono text-[0.6875rem] text-[#d6debe]"
            >
              <CameraGlyph className="h-4 w-4" />
              Volver a grabar
            </button>
            <label className="flex flex-col gap-1 text-xs text-[#d6debe]">
              Texto sobre el video
              <input
                value={overlayText}
                maxLength={60}
                onChange={(event) => setOverlayText(event.target.value)}
                className="min-h-11 rounded-lg border border-[#414d2b] bg-[#181d13] px-2 text-sm text-[#f5f7ee]"
              />
            </label>
            <div className="flex gap-2">
              {(['top', 'middle', 'bottom'] as const).map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => setTextPlace(place)}
                  className={`min-h-9 flex-1 rounded-full font-mono text-[0.6875rem] ${textPlace === place ? 'bg-[#5c6b3a] text-[#12160d]' : 'border border-[#414d2b] text-[#d6debe]'}`}
                >
                  {place === 'top' ? 'Arriba' : place === 'middle' ? 'Centro' : 'Abajo'}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {REEL_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`shrink-0 rounded-full px-3 py-2 font-mono text-[0.6875rem] ${filter === item.id ? 'bg-[#d6debe] text-[#12160d]' : 'border border-[#414d2b] text-[#d6debe]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-xs text-[#d6debe]">
              Epígrafe
              <input
                value={caption}
                maxLength={80}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-11 rounded-lg border border-[#414d2b] bg-[#181d13] px-2 text-sm text-[#f5f7ee]"
              />
            </label>
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => upload.mutate()}
              className="min-h-11 rounded-xl bg-[#5c6b3a] font-mono text-[0.6875rem] font-bold text-[#12160d] disabled:opacity-50"
            >
              {upload.isPending ? 'Publicando…' : 'Publicar reel'}
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-2 text-sm text-vino-700">{error}</p> : null}
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) {
              stopCamera();
              setCameraOpen(false);
              void readFile(file).catch(() => setError('No se pudo leer el video.'));
            }
          }}
        />
      </div>
    </div>
  );
}

function CameraGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6A1.5 1.5 0 0 1 10 3.5h4a1.5 1.5 0 0 1 1.2.9L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function GalleryGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m4.5 15.5 4.2-4.2a1.5 1.5 0 0 1 2.1 0L16 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="15.5" cy="9.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function FlipCameraGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 7h7.5a4.5 4.5 0 0 1 0 9H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M7 7 9.5 4.5M7 7l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M17 17H9.5a4.5 4.5 0 0 1 0-9H15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M17 17 14.5 19.5M17 17l-2.5-2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const BIO_PALETTE = [
  { wash: '#123524', ink: '#1ed760', label: 'Verde' },
  { wash: '#3a1024', ink: '#ff7ab6', label: 'Rosa' },
  { wash: '#10243f', ink: '#6eb6ff', label: 'Azul' },
  { wash: '#3a2208', ink: '#ffb020', label: 'Ámbar' },
  { wash: '#26143f', ink: '#d2a8ff', label: 'Violeta' },
  { wash: '#3a1412', ink: '#ff7a66', label: 'Rojo' },
] as const;
