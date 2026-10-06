import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import {
  createArtistPost,
  fetchArtistPosts,
  mediaUrl,
  updateArtistProfile,
  type ArtistPost,
} from '../lib/api';
import { COUNTRIES } from '../lib/places';
import { signedWrite } from '../lib/write-auth';
import { contrastRatio, NAME_FONTS, nameFontClass, type NameFont } from '../lib/name-style';
import { BIO_PALETTE } from './ArtistReels';

const EMOJIS = ['🎵', '🎸', '🎤', '🔥', '❤️', '🙌', '🎶', '✨', '💚', '🥁'];
const MAX_IMAGE_BYTES = 1_500_000;

type ArtistStudioProps = {
  artistId: number;
  ownerAddress: string | undefined;
  isOwner: boolean;
  bio: string | null;
  bioWash: string | null;
  bioInk: string | null;
  nameFont: string | null;
  displayName: string;
  country: string | null;
  region: string | null;
  photo: string | null;
  cover: string | null;
  onProfileSaved: () => void;
};

export function ArtistStudio({
  artistId,
  ownerAddress,
  isOwner,
  bio,
  bioWash,
  bioInk,
  nameFont,
  displayName,
  country,
  region,
  photo,
  cover,
  onProfileSaved,
}: ArtistStudioProps) {
  const posts = useQuery({
    queryKey: ['artist-posts', artistId],
    queryFn: () => fetchArtistPosts(artistId),
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-2xl font-semibold italic text-[#f5f7ee]">Novedades</h2>

      {isOwner && ownerAddress ? (
        <>
          <ProfileEditor
            artistId={artistId}
      bio={bio}
      bioWash={bioWash}
      bioInk={bioInk}
      nameFont={nameFont}
      displayName={displayName}
      country={country}
      region={region}
      photo={photo}
      cover={cover}
      onSaved={onProfileSaved}
          />
          <PostComposer artistId={artistId} />
        </>
      ) : null}

      {posts.isLoading ? (
        <p className="font-mono text-[0.6875rem] text-[#879373]">Cargando novedades…</p>
      ) : null}
      {!posts.isLoading && (posts.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-[#a8b393]">Todavía no hay publicaciones.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {(posts.data ?? []).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ul>
    </section>
  );
}

function ProfileEditor({
  artistId,
  bio,
  bioWash,
  bioInk,
  nameFont,
  displayName,
  country,
  region,
  photo,
  cover,
  onSaved,
}: {
  artistId: number;
  bio: string | null;
  bioWash: string | null;
  bioInk: string | null;
  nameFont: string | null;
  displayName: string;
  country: string | null;
  region: string | null;
  photo: string | null;
  cover: string | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftBio, setDraftBio] = useState(bio ?? '');
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(undefined);
  const [draftCover, setDraftCover] = useState<string | undefined>(undefined);
  const [draftCountry, setDraftCountry] = useState(country ?? '');
  const [draftRegion, setDraftRegion] = useState(region ?? '');
  const [wash, setWash] = useState(bioWash ?? '#123524');
  const [ink, setInk] = useState(bioInk ?? '#f3e9d6');
  const [font, setFont] = useState<NameFont>(nameFont === 'serif' || nameFont === 'sans' ? nameFont : 'display');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const save = useMutation({
    mutationFn: async () => {
      const proof = await signedWrite(signMessageAsync, artistId, 'profile', {
        bio: draftBio.trim(),
        ...(draftPhoto !== undefined ? { photo: draftPhoto } : {}),
        ...(draftCover !== undefined ? { cover: draftCover } : {}),
        bioWash: wash,
        bioInk: ink,
        nameFont: font,
        country: draftCountry,
        region: draftRegion.trim(),
      });
      return updateArtistProfile({ artistId, ...proof });
    },
    onSuccess: async () => {
      setError(null);
      setOpen(false);
      onSaved();
      await queryClient.invalidateQueries({ queryKey: ['artist-profile', String(artistId)] });
    },
    onError: (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el perfil.');
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraftBio(bio ?? '');
          setDraftPhoto(undefined);
          setDraftCover(undefined);
          setDraftCountry(country ?? '');
          setDraftRegion(region ?? '');
          setWash(bioWash ?? '#123524');
          setInk(bioInk ?? '#f3e9d6');
          setFont(nameFont === 'serif' || nameFont === 'sans' ? nameFont : 'display');
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#8ea459] bg-[#5c6b3a] px-3.5 font-mono text-[0.6875rem] font-bold tracking-wide text-[#12160d]"
      >
        Editar perfil
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-[#414d2b] bg-[#262f1e] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (contrastRatio(wash, ink) < 4.5) return;
        save.mutate();
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-[#d6debe]">
        Biografía
        <textarea
          value={draftBio}
          maxLength={280}
          rows={3}
          onChange={(event) => setDraftBio(event.target.value)}
          className="rounded-lg border border-[#414d2b] bg-[#181d13] p-2 text-sm text-[#f5f7ee]"
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-[#d6debe]">Color del perfil</span>
        <div className="flex flex-wrap gap-2">
          {BIO_PALETTE.map((swatch) => {
            const selected = wash === swatch.wash && ink === swatch.ink;
            return (
              <button
                key={swatch.label}
                type="button"
                aria-label={swatch.label}
                onClick={() => {
                  setWash(swatch.wash);
                  setInk(swatch.ink);
                }}
                className={`h-9 w-9 rounded-full border-2 ${selected ? 'border-white' : 'border-transparent'}`}
                style={{ background: `linear-gradient(135deg, ${swatch.wash}, ${swatch.ink})` }}
              />
            );
          })}
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-[#d6debe]">
            Fondo
            <input type="color" value={wash} onChange={(event) => setWash(event.target.value)} className="h-9 w-12 bg-transparent" />
          </label>
          <label className="flex items-center gap-2 text-xs text-[#d6debe]">
            Acento
            <input type="color" value={ink} onChange={(event) => setInk(event.target.value)} className="h-9 w-12 bg-transparent" />
          </label>
        </div>
        <div className="flex gap-2">
          {NAME_FONTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFont(option.id)}
              className={`landing-focus h-11 rounded-[10px] border px-3 text-sm ${font === option.id ? 'border-[var(--gold)]' : 'border-[#414d2b]'} ${nameFontClass(option.id)}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p
          className={`rounded-2xl px-3 py-4 text-3xl leading-none ${nameFontClass(font)}`}
          style={{ backgroundColor: wash, color: ink }}
        >
          {displayName}
        </p>
        {contrastRatio(wash, ink) < 4.5 ? (
          <p className="text-sm" role="alert">El color del nombre no se lee sobre ese fondo. Elegí un contraste más marcado.</p>
        ) : null}
      </div>
      <label className="flex flex-col gap-1 text-xs text-[#d6debe]">
        País
        <select
          value={draftCountry}
          onChange={(event) => setDraftCountry(event.target.value)}
          className="min-h-11 rounded-lg border border-[#414d2b] bg-[#181d13] px-2 text-sm text-[#f5f7ee]"
        >
          <option value="">Sin bandera</option>
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#d6debe]">
        Provincia o estado
        <input
          value={draftRegion}
          maxLength={40}
          onChange={(event) => setDraftRegion(event.target.value)}
          className="min-h-11 rounded-lg border border-[#414d2b] bg-[#181d13] px-2 text-sm text-[#f5f7ee]"
        />
      </label>
      <ImageField
        label="Foto de perfil"
        accept="image/jpeg,image/png,image/webp,image/gif"
        current={draftPhoto ?? photo}
        onPick={setDraftPhoto}
        onError={setError}
      />
      <ImageField
        label="Portada"
        accept="image/jpeg,image/png,image/webp,image/gif"
        current={draftCover ?? cover}
        onPick={setDraftCover}
        onError={setError}
      />
      {error ? <p className="text-sm text-vino-700">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={save.isPending || contrastRatio(wash, ink) < 4.5}
          className="min-h-11 flex-1 rounded-xl bg-[#5c6b3a] font-mono text-[0.6875rem] font-bold text-[#12160d] disabled:opacity-50"
        >
          {save.isPending ? 'Guardando…' : 'Guardar perfil'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-xl border border-[#414d2b] px-3 font-mono text-[0.6875rem] text-[#d6debe]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PostComposer({ artistId }: { artistId: number }) {
  const [body, setBody] = useState('');
  const [media, setMedia] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const gifRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const publish = useMutation({
    mutationFn: async () => {
      const proof = await signedWrite(signMessageAsync, artistId, 'post', {
        body: body.trim(),
        ...(media ? { media } : {}),
      });
      return createArtistPost({ artistId, ...proof });
    },
    onSuccess: async () => {
      setBody('');
      setMedia(undefined);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['artist-posts', artistId] });
    },
    onError: (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'No se pudo publicar.');
    },
  });

  function insertEmoji(emoji: string) {
    const node = textRef.current;
    if (!node) {
      setBody((current) => `${current}${emoji}`);
      return;
    }
    const start = node.selectionStart ?? body.length;
    const end = node.selectionEnd ?? body.length;
    const next = `${body.slice(0, start)}${emoji}${body.slice(end)}`;
    setBody(next.slice(0, 280));
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-[#414d2b] bg-[#262f1e] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim() && !media) {
          setError('Escribí algo o adjuntá una imagen.');
          return;
        }
        publish.mutate();
      }}
    >
      <textarea
        ref={textRef}
        value={body}
        maxLength={280}
        rows={3}
        placeholder="Contá una novedad…"
        onChange={(event) => setBody(event.target.value)}
        className="rounded-lg border border-[#414d2b] bg-[#181d13] p-2 text-sm text-[#f5f7ee] placeholder:text-[#879373]"
      />
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => insertEmoji(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#323d27]"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className="min-h-11 rounded-lg border border-[#414d2b] px-3 font-mono text-[0.6875rem] text-[#d6debe]"
        >
          Foto
        </button>
        <button
          type="button"
          onClick={() => gifRef.current?.click()}
          className="min-h-11 rounded-lg border border-[#414d2b] px-3 font-mono text-[0.6875rem] text-[#d6debe]"
        >
          GIF
        </button>
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void readImage(file, false).then(setMedia).catch((reason: unknown) => {
              setError(reason instanceof Error ? reason.message : 'No se pudo leer la foto.');
            });
          }}
        />
        <input
          ref={gifRef}
          type="file"
          accept="image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void readImage(file, true).then(setMedia).catch((reason: unknown) => {
              setError(reason instanceof Error ? reason.message : 'No se pudo leer el GIF.');
            });
          }}
        />
      </div>
      {media ? (
        <img src={media} alt="" className="max-h-40 w-full rounded-lg object-cover" />
      ) : null}
      {error ? <p className="text-sm text-vino-700">{error}</p> : null}
      <button
        type="submit"
        disabled={publish.isPending}
        className="min-h-11 rounded-xl bg-[#5c6b3a] font-mono text-[0.6875rem] font-bold text-[#12160d] disabled:opacity-50"
      >
        {publish.isPending ? 'Publicando…' : 'Publicar'}
      </button>
    </form>
  );
}

function PostCard({ post }: { post: ArtistPost }) {
  const when = new Date(post.createdAt).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <li className="rounded-2xl bg-[#1c2416] p-4">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#f5f7ee]">{post.body}</p>
      {post.media ? (
        <img src={mediaUrl(post.media) ?? ''} alt="" className="mt-2 max-h-80 w-full rounded-lg object-cover" />
      ) : null}
      <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-wider text-[#879373]">{when}</p>
    </li>
  );
}

function ImageField({
  label,
  accept,
  current,
  onPick,
  onError,
}: {
  label: string;
  accept: string;
  current: string | null | undefined;
  onPick: (value: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#d6debe]">
      {label}
      {current ? <img src={current} alt="" className="h-24 w-full rounded-lg object-cover" /> : null}
      <input
        type="file"
        accept={accept}
        className="text-xs"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          void readImage(file, file.type === 'image/gif')
            .then(onPick)
            .catch((reason: unknown) => {
              onError(reason instanceof Error ? reason.message : 'No se pudo leer la imagen.');
            });
        }}
      />
    </label>
  );
}

async function readImage(file: File, keepGif: boolean): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen pesa más de 1.5 MB.');
  }
  if (keepGif || file.type === 'image/gif') {
    return readAsDataUrl(file);
  }
  return compressPhoto(file);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No se pudo leer el archivo.'));
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

async function compressPhoto(file: File): Promise<string> {
  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo abrir la imagen.'));
    image.src = src;
  });
}
