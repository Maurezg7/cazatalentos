import { Controller, Get, Inject } from '@nestjs/common';
import { IndexerService } from '../indexer/indexer.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(IndexerService) private readonly indexer: IndexerService,
  ) {}

  @Get()
  async health(): Promise<{
    status: 'ok';
    uptime: number;
    db: 'up' | 'down';
    indexer: { lastBlock: string; currentBlock: string; lag: string };
  }> {
    let db: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }

    let indexer = { lastBlock: '0', currentBlock: '0', lag: '0' };
    try {
      indexer = await this.indexer.status();
    } catch {
      indexer = { lastBlock: '0', currentBlock: '0', lag: '0' };
    }

    return {
      status: 'ok',
      uptime: process.uptime(),
      db,
      indexer,
    };
  }
}
