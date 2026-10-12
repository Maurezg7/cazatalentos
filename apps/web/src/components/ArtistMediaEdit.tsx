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

  const save = useMutation({
    mutationFn: async ({ field, dataUrl }: { field: Field; dataUrl: string }) => {
      const proof = await signedWrite(signMessageAsync, artistId, 'profile', {
        [field]: dataUrl,
      });
      return updateArtistProfile({ artistId, ...proof });
    },
    onSuccess: async () => {
      setError(null);
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
      save.mutate({ field, dataUrl });
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo leer la imagen.');
    }
  }

  return {
    pickAndSave,
    saving: save.isPending,
    error,
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
        className="absolute right-3 top-3 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#8ea459] bg-[#192013]/95 px-3 font-mono text-[0.6875rem] font-bold text-[#e4e3d9] shadow-lg disabled:opacity-60"
      >
        <Icon name="image" className="h-4 w-4" />
        {saving ? 'Subiendo…' : 'Cambiar portada'}
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
        aria-label={saving ? 'Subiendo foto…' : 'Cambiar foto de perfil'}
        title="Cambiar foto de perfil"
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#14180f] bg-[#5c6b3a] text-[#12160d] shadow-lg disabled:opacity-60"
      >
        <Icon name="camera" className="h-4 w-4" />
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
