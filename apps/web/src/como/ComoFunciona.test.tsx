import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ComoFuncionaPage } from '../pages/ComoFuncionaPage';

describe('ComoFuncionaPage', () => {
  it('opens and closes a question with the button', () => {
    render(
      <MemoryRouter>
        <ComoFuncionaPage />
      </MemoryRouter>,
    );
    const button = screen.getByRole('button', { name: '¿Quién decide si el artista cumplió la meta?' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.focus();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/Votan los pioneros/).textContent).toContain('pioneros');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the simulator off unless the flag is set', () => {
    render(
      <MemoryRouter>
        <ComoFuncionaPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/El simulador está apagado/).textContent).toContain('apagado');
    expect(screen.getByText('Si no se cumple').textContent).toBe('Si no se cumple');
    expect(screen.getByText('Si la meta se cumple').textContent).toBe('Si la meta se cumple');
  });
});
