import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapException } from './map-exception';

describe('acceptance log lines (api)', () => {
  it('emits layer, code, requestId, cause and hint for validation, db down and upload', () => {
    const cases = [
      mapException(new BadRequestException({ message: ['description must be longer'] }), 'req-e'),
      mapException(
        new Prisma.PrismaClientKnownRequestError('db down', { code: 'P1001', clientVersion: '7.10.0' }),
        'req-f',
      ),
      mapException(new PayloadTooLargeException(), 'req-h'),
    ];

    const labels = ['ACCEPT e)', 'ACCEPT f)', 'ACCEPT h)'];
    cases.forEach((mapped, index) => {
      const line = {
        ...mapped.toLog(),
        cause: mapped.cause instanceof Error ? mapped.cause.name : mapped.code,
      };
      process.stdout.write(`${labels[index]} ${JSON.stringify(line)}\n`);
      expect(mapped.layer).toBe('api');
      expect(mapped.requestId).toMatch(/^req-/);
      expect(mapped.hint.length).toBeGreaterThan(8);
    });
  });
});
