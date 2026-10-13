import { useT } from '../i18n/LocaleContext';
import type { Pozo } from './pozo';
import { PozoCard } from './PozoCard';

export function PozosAbiertos({
  pozos,
  loading,
  error,
  onRetry,
}: {
  pozos: Pozo[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const t = useT();
  return (
    <section id="pozos" aria-labelledby="pozos-title" className="flex flex-col gap-4">
      <h2 id="pozos-title" className="display-num m-0 text-2xl uppercase">
        {t('openPoolsTitle')}
      </h2>
      {loading ? (
        <div className="pozo-grid" aria-busy="true">
          {[0, 1].map((item) => (
            <div key={item} className="h-[420px] animate-pulse rounded-[14px]" style={{ background: 'var(--panel)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[14px] border p-5" style={{ borderColor: 'var(--line)' }}>
          <p className="m-0">{t('openPoolsError')}</p>
          <button type="button" onClick={onRetry} className="landing-focus sun-btn mt-3 h-11 px-4 font-semibold">
            {t('retry')}
          </button>
        </div>
      ) : pozos.length === 0 ? (
        <p className="m-0 rounded-[14px] border p-5" style={{ borderColor: 'var(--line)' }}>
          {t('noOpenPools')}
        </p>
      ) : (
        <div className="pozo-grid">
          {pozos.map((pozo) => (
            <PozoCard key={pozo.id} pozo={pozo} />
          ))}
        </div>
      )}
    </section>
  );
}
