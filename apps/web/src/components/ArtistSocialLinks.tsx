import { Icon, type IconName } from './Icon';

export function ArtistSocialLinks({
  entries,
  className = '',
}: {
  entries: Array<[string, string]>;
  className?: string;
}) {
  if (entries.length === 0) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {entries.map(([label, href]) => {
        const icon = socialIconFor(label, href);
        const pretty = prettyLinkLabel(label);
        return (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={pretty}
              title={pretty}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#414d2b] bg-[#1c2416] text-[#d6debe] transition-colors hover:border-[#8ea459] hover:bg-[#24301a] hover:text-[#f5f7ee]"
            >
              <Icon name={icon} className="h-5 w-5" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function prettyLinkLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) return 'Link';
  const known: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    spotify: 'Spotify',
    twitter: 'X',
    x: 'X',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    bandcamp: 'Bandcamp',
    github: 'GitHub',
    website: 'Web',
    web: 'Web',
  };
  const key = trimmed.toLowerCase();
  if (known[key]) return known[key];
  return trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1);
}

export function socialIconFor(label: string, href: string): IconName {
  const hay = `${label} ${href}`.toLowerCase();
  if (hay.includes('instagram')) return 'instagram';
  if (hay.includes('youtube') || hay.includes('youtu.be')) return 'youtube';
  if (hay.includes('spotify')) return 'spotify';
  if (hay.includes('tiktok')) return 'tiktok';
  if (hay.includes('facebook') || hay.includes('fb.com')) return 'facebook';
  if (hay.includes('twitter') || hay.includes('x.com') || label.toLowerCase() === 'x') return 'twitter-x';
  if (hay.includes('github')) return 'github';
  if (hay.includes('bandcamp') || hay.includes('soundcloud') || hay.includes('music')) {
    return 'music-note-beamed';
  }
  if (hay.includes('http') || hay.includes('www') || hay.includes('web')) return 'globe2';
  return 'link-45deg';
}

export const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: 'instagram' as const, placeholder: 'https://instagram.com/…' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' as const, placeholder: 'https://youtube.com/…' },
  { key: 'spotify', label: 'Spotify', icon: 'spotify' as const, placeholder: 'https://open.spotify.com/…' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok' as const, placeholder: 'https://tiktok.com/@…' },
  { key: 'twitter', label: 'X', icon: 'twitter-x' as const, placeholder: 'https://x.com/…' },
] as const;

export function stableLinksJson(links: Record<string, string>): string {
  const cleaned = Object.fromEntries(
    Object.entries(links)
      .map(([key, value]) => [key.trim().toLowerCase(), value.trim()] as const)
      .filter(([, value]) => value.length > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  return JSON.stringify(cleaned);
}
