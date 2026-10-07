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
  const [video, setVideo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState<(typeof REEL_FILTERS)[number]['id']>('none');
  const [textPlace, setTextPlace] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => () => stopCamera(), []);

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

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      if (liveRef.current) liveRef.current.srcObject = stream;
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        stopCamera();
        setRecording(false);
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
      recorder.start();
      setRecording(true);
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 15_000);
    } catch {
      setError('No se pudo usar la cámara. Podés subir un video de tus archivos.');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  const placeClass =
    textPlace === 'top' ? 'top-6' : textPlace === 'bottom' ? 'bottom-16' : 'top-1/2 -translate-y-1/2';

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
          <button type="button" onClick={() => { stopCamera(); onClose(); }} aria-label="Cerrar" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#3b4725]">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {!video && !recording ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void startRecording()} className="min-h-24 rounded-2xl bg-[#5c6b3a] font-mono text-[0.6875rem] font-bold text-[#12160d]">
              Grabar
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="min-h-24 rounded-2xl border border-[#8ea459] font-mono text-[0.6875rem] font-bold text-[#d6debe]">
              Subir de archivos
            </button>
          </div>
        ) : null}

        {recording ? (
          <div className="flex flex-col items-center gap-3">
            <video ref={liveRef} autoPlay muted playsInline className="aspect-[9/16] w-40 rounded-2xl bg-black object-cover" />
            <button type="button" onClick={stopRecording} className="min-h-11 rounded-full bg-[#ff7a66] px-4 font-mono text-[0.6875rem] font-bold text-[#12160d]">
              Listo
            </button>
            <p className="font-mono text-[0.6875rem] text-[#879373]">Se corta solo a los 15 segundos.</p>
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
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void readFile(file).catch(() => setError('No se pudo leer el video.'));
          }}
        />
      </div>
    </div>
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
