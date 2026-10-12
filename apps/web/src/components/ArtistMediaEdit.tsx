import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import { updateArtistProfile } from '../lib/api';
import { readArtistImage } from '../lib/artist-image';
import { signedWrite } from '../lib/write-auth';
import { Icon } from './Icon';

type Field = 'photo' | 'cover';

export function useArtistMediaSave(artistId: number, onSaved: () => void) {
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState<string | null>(null);
  const [bust, setBust] = useState(() => Date.now());

  const save = useMutation({
    mutationFn: async ({ field, dataUrl }: { field: Field; dataUrl: string }) => {
      const proof = await signedWrite(signMessageAsync, artistId, 'profile', {
        [field]: dataUrl,
      });
      return updateArtistProfile({ artistId, ...proof });
    },
    onSuccess: async () => {
      setError(null);
      setBust(Date.now());
      onSaved();
      await queryClient.invalidateQueries({ queryKey: ['artist-profile', String(artistId)] });
    },
    onError: (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la imagen.');
    },
  });

  async function pickAndSave(field: Field, file: File) {
    try {
      setError(null);
      const dataUrl = await readArtistImage(file, file.type === 'image/gif');
      await save.mutateAsync({ field, dataUrl });
    } catch (reason: unknown) {
      if (reason instanceof Error && reason.message) setError(reason.message);
      else setError('No se pudo leer la imagen.');
    }
  }

  return {
    pickAndSave,
    saving: save.isPending,
    error,
    bust,
    clearError: () => setError(null),
  };
}

export function CoverEditButton({
  onPick,
  saving,
}: {
  onPick: (file: File) => void;
  saving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        disabled={saving}
        onClick={() => inputRef.current?.click()}
        className="absolute right-3 top-3 z-30 inline-flex h-10 items-center gap-2 rounded-full bg-black/55 px-3 font-mono text-[0.6875rem] font-semibold text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-60"
      >
        <Icon name="image" className="h-3.5 w-3.5" />
        {saving ? 'Guardando…' : 'Portada'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onPick(file);
        }}
      />
    </>
  );
}

export function PhotoEditBadge({
  onPick,
  saving,
}: {
  onPick: (file: File) => void;
  saving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        disabled={saving}
        aria-label={saving ? 'Guardando foto…' : 'Cambiar foto de perfil'}
        title="Cambiar foto de perfil"
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-1 right-1 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-60"
      >
        <Icon name="camera" className="h-3.5 w-3.5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onPick(file);
        }}
      />
    </>
  );
}
