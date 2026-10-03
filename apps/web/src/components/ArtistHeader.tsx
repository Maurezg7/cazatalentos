type ArtistHeaderProps = {
  name: string;
  supporterCount: number;
};

export function ArtistHeader({ name, supporterCount }: ArtistHeaderProps) {
  return (
    <header className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-tierra-700">Artista</p>
      <h2 className="font-serif text-4xl leading-tight text-tierra-900">{name}</h2>
      <p className="text-sm text-tierra-700">
        {supporterCount === 1
          ? '1 persona ya dejó su marca'
          : `${supporterCount} personas ya dejaron su marca`}
      </p>
    </header>
  );
}
