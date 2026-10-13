import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../i18n/LocaleContext';
import type { Pozo } from './pozo';
import { PozosAbiertos } from './PozosAbiertos';

const pozo: Pozo = {
  id: 1,
  artistaId: 101,
  artista: 'Los Hijos del Cerro',
  ciudad: 'Salta Capital',
  montoWei: 1n,
  metaWei: null,
  metaTexto: 'Grabar el disco',
  pioneros: 3,
  cupoMaximo: null,
  cierraEn: '10 de octubre',
  portada: null,
  estado: 'en_curso',
  abierto: true,
};

function renderPozos(props: Partial<Parameters<typeof PozosAbiertos>[0]>) {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <PozosAbiertos pozos={[]} loading={false} error={false} onRetry={vi.fn()} {...props} />
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe('PozosAbiertos', () => {
  it('shows skeletons while loading', () => {
    renderPozos({ loading: true });
    expect(screen.getByRole('heading', { name: 'Open pools' })).toBeTruthy();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('explains the empty state', () => {
    renderPozos({});
    expect(screen.getByText(/No open pools yet/)).toBeTruthy();
  });

  it('shows a retry when the read fails', () => {
    renderPozos({ error: true });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('renders a card from data', () => {
    renderPozos({ pozos: [pozo] });
    expect(screen.getByRole('heading', { name: 'Los Hijos del Cerro' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /I was there first/ })).toBeTruthy();
  });
});
