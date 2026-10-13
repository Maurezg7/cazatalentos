import { useT } from '../i18n/LocaleContext';
import { ArtistaCard, ArtistaRow } from './ArtistaResultado';
import type { ArtistaExplorar, VistaExplorar } from './tipos';

export function ResultadosGrid({
  items,
  vista,
  loading,
  error,
  vacio,
  onRetry,
  onLimpiar,
}: {
  items: ArtistaExplorar[];
  vista: VistaExplorar;
  loading: boolean;
  error: boolean;
  vacio: boolean;
  onRetry: () => void;
  onLimpiar: () => void;
}) {
  const t = useT();

  if (loading) {
    return (
      <div className={vista === 'grilla' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3'} aria-busy="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-[280px] animate-pulse rounded-[14px]" style={{ background: 'var(--panel)' }} />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="pozo-card p-5">
        <p className="m-0">{t('exploreLoadError')}</p>
        <button type="button" onClick={onRetry} className="landing-focus sun-btn mt-3 h-11 px-4 font-semibold">
          {t('retry')}
        </button>
      </div>
    );
  }
  if (vacio) {
    return (
      <div className="pozo-card p-5">
        <p className="m-0">{t('exploreEmptyFilters')}</p>
        <button type="button" onClick={onLimpiar} className="landing-focus sun-btn mt-3 h-11 px-4 font-semibold">
          {t('exploreClearFilters')}
        </button>
      </div>
    );
  }
  if (vista === 'lista') {
    return (
      <div className="flex flex-col gap-3" role="list">
        {items.map((artista) => (
          <ArtistaRow key={artista.id} artista={artista} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
      {items.map((artista) => (
        <ArtistaCard key={artista.id} artista={artista} />
      ))}
    </div>
  );
}
