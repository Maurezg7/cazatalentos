import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../i18n/LocaleContext';
import { ResultadosGrid } from './Resultados';
import type { ArtistaExplorar } from './tipos';

const artista: ArtistaExplorar = {
  id: 101,
  nombre: 'Zamba Lunar',
  ciudad: 'Cafayate',
  generos: [],
  pioneros: 2,
  patrocinado: true,
  foto: null,
  portada: null,
  pozo: null,
};

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

function renderGrid(props: Partial<Parameters<typeof ResultadosGrid>[0]>) {
  return render(
    wrap(
      <ResultadosGrid
        items={[]}
        vista="grilla"
        loading={false}
        error={false}
        vacio={false}
        onRetry={vi.fn()}
        onLimpiar={vi.fn()}
        {...props}
      />,
    ),
  );
}

describe('ResultadosGrid', () => {
  it('reserves skeleton space while loading', () => {
    renderGrid({ loading: true });
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('explains an empty filter result', () => {
    renderGrid({ vacio: true });
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
  });

  it('offers a retry when the read fails', () => {
    renderGrid({ error: true });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('renders grid and list items', () => {
    const { rerender } = renderGrid({ items: [artista] });
    expect(screen.getByText('Lunar Zamba')).toBeTruthy();
    expect(screen.getByText('SPONSORED')).toBeTruthy();
    rerender(
      wrap(
        <ResultadosGrid
          items={[artista]}
          vista="lista"
          loading={false}
          error={false}
          vacio={false}
          onRetry={vi.fn()}
          onLimpiar={vi.fn()}
        />,
      ),
    );
    expect(screen.getByText('No pool')).toBeTruthy();
  });
});
