import { describe, expect, it } from 'vitest';
import { entryDigits, formatMonFromWei, freeSlots, goalPercent } from './pozo';

describe('formatMonFromWei', () => {
  it('formats whole and fractional wei without floats', () => {
    expect(formatMonFromWei(0n)).toBe('0 MON');
    expect(formatMonFromWei(1_500_000_000_000_000_000n)).toBe('1,500 MON');
    expect(formatMonFromWei(2_250_000_000_000_000n)).toBe('0,002 MON');
  });
});

describe('goalPercent', () => {
  it('caps at 0 and 100 and ignores a missing goal', () => {
    expect(goalPercent(50n, null)).toBe(0);
    expect(goalPercent(50n, 0n)).toBe(0);
    expect(goalPercent(1n, 4n)).toBe(25);
    expect(goalPercent(9n, 4n)).toBe(100);
    expect(goalPercent(-1n, 4n)).toBe(0);
  });
});

describe('freeSlots', () => {
  it('handles empty, full and invalid caps', () => {
    expect(freeSlots(0, 20)).toBe(20);
    expect(freeSlots(20, 20)).toBe(0);
    expect(freeSlots(25, 20)).toBe(0);
    expect(freeSlots(3, null)).toBe(0);
    expect(freeSlots(Number.NaN, 20)).toBe(0);
  });
});

describe('entryDigits', () => {
  it('pads to three digits', () => {
    expect(entryDigits(7)).toBe('007');
    expect(entryDigits(0)).toBe('000');
    expect(entryDigits(41)).toBe('041');
    expect(entryDigits(-1)).toBe('000');
  });
});
