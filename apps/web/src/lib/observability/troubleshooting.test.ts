import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ERROR_CODES } from '@cazatalentos/shared';

describe('TROUBLESHOOTING.md', () => {
  it('documents every error code', () => {
    const md = readFileSync(resolve(__dirname, '../../../../../docs/TROUBLESHOOTING.md'), 'utf8');
    for (const code of ERROR_CODES) {
      expect(md).toContain(`## ${code}`);
    }
  });
});
