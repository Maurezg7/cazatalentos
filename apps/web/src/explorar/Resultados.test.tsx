import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ResultadosGrid } from './Resultados';
import type { ArtistaExplorar } from './tipos';

const artista: ArtistaExplorar = {
  id: 101,
  nombre: 'Zamba Lunar',
  ciudad: 'Cafayate',
  generos: [],
  pioneros: 2,
  patrocinado: true,
  portada: null,
  pozo: null,
};

function renderGrid(props: Partial<Parameters<typeof ResultadosGrid>[0]>) {
  return render(
    <MemoryRouter>
      <ResultadosGrid items={[]} vista="grilla" loading={false} error={false} vacio={false} onRetry={vi.fn()} onLimpiar={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

describe('ResultadosGrid', () => {
  it('reserves skeleton space while loading', () => {
    renderGrid({ loading: true });
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('explains an empty filter result', () => {
    renderGrid({ vacio: true });
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeTruthy();
  });

  it('offers a retry when the read fails', () => {
    renderGrid({ error: true });
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  it('renders grid and list items', () => {
    const { rerender } = renderGrid({ items: [artista] });
    expect(screen.getByText('Zamba Lunar')).toBeTruthy();
    expect(screen.getByText('Patrocinado')).toBeTruthy();
    rerender(
      <MemoryRouter>
        <ResultadosGrid items={[artista]} vista="lista" loading={false} error={false} vacio={false} onRetry={vi.fn()} onLimpiar={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sin pozo')).toBeTruthy();
  });
});
