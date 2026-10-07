import { describe, expect, it } from 'vitest';
import { SIMULADOR_CONFIG } from '../content/como-funciona';
import { simularEntrada } from './simular';

const config = SIMULADOR_CONFIG;

describe('simularEntrada', () => {
  it('splits the pool by weight and keeps the deposit apart', () => {
    const ok = simularEntrada(
      { depositoWei: config.depositoMinWei, entrada: 41, pozoWei: 100n, pesoTotal: 10n, seCumple: true },
      config,
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.peso).toBe(3);
    expect(ok.partePozoWei).toBe(30n);
    expect(ok.partePozoWei + (100n - ok.partePozoWei)).toBe(100n);
    expect(ok.comisionWei + (ok.depositoWei - ok.comisionWei)).toBe(ok.depositoWei);
  });

  it('pays nothing from the pool when the goal fails', () => {
    const ok = simularEntrada(
      { depositoWei: config.depositoMinWei, entrada: 1, pozoWei: 100n, pesoTotal: 10n, seCumple: false },
      config,
    );
    expect(ok.ok && ok.partePozoWei).toBe(0n);
    expect(ok.ok && ok.peso).toBe(5);
  });

  it('rejects the edges and invalid numbers', () => {
    expect(simularEntrada({ depositoWei: config.depositoMinWei - 1n, entrada: 1, pozoWei: 1n, pesoTotal: 1n, seCumple: true }, config).ok).toBe(false);
    expect(simularEntrada({ depositoWei: config.depositoMaxWei + 1n, entrada: 1, pozoWei: 1n, pesoTotal: 1n, seCumple: true }, config).ok).toBe(false);
    expect(simularEntrada({ depositoWei: config.depositoMinWei, entrada: config.cupo, pozoWei: 1n, pesoTotal: 1n, seCumple: true }, config).ok).toBe(true);
    expect(simularEntrada({ depositoWei: config.depositoMinWei, entrada: 0, pozoWei: 1n, pesoTotal: 1n, seCumple: true }, config).ok).toBe(false);
    expect(simularEntrada({ depositoWei: config.depositoMinWei, entrada: 1.5, pozoWei: 1n, pesoTotal: 0n, seCumple: true }, config).ok).toBe(false);
  });
});
