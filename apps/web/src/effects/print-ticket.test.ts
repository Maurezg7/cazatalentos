import { describe, expect, it } from 'vitest';

function shouldPrint(confirmed: boolean): boolean {
  return confirmed;
}

describe('print ticket gate', () => {
  it('stays hidden until the transaction is confirmed', () => {
    expect(shouldPrint(false)).toBe(false);
    expect(shouldPrint(true)).toBe(true);
  });
});
