import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '../i18n/LocaleContext';
import { ComoFuncionaPage } from '../pages/ComoFuncionaPage';

function renderPage() {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <ComoFuncionaPage />
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe('ComoFuncionaPage', () => {
  it('opens and closes a question with the button', () => {
    renderPage();
    const button = screen.getByRole('button', { name: 'Who decides if the artist met the goal?' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.focus();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/Pioneers who were already there/).textContent).toContain('20% quorum');
    const contrato = screen.getByRole('link', { name: 'View the contract on Monadscan' });
    expect(contrato.getAttribute('href')).toBe(
      'https://testnet.monadscan.com/address/0x899c15654d9ffA753eD0C008831f41F3473B40d1',
    );
    expect(screen.queryByText(/queda pendiente/)).toBeNull();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the simulator off unless the flag is set', () => {
    renderPage();
    expect(screen.getByText(/The simulator is off/).textContent).toContain('off');
    expect(screen.getByText('If it is not met').textContent).toBe('If it is not met');
    expect(screen.getByText('If the goal is met').textContent).toBe('If the goal is met');
  });
});
