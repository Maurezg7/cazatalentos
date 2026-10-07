import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { currentRequestId } from '../observability/request-context';
import { IndexerService } from '../indexer/indexer.service';
import { PrismaService } from '../prisma/prisma.service';

type DepStatus = {
  status: 'up' | 'down';
  latencyMs: number;
  detail?: string;
};

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(IndexerService) private readonly indexer: IndexerService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Get()
  async health(): Promise<{
    status: 'ok' | 'degraded';
    requestId?: string;
    uptime: number;
    dependencies: {
      db: DepStatus;
      rpc: DepStatus & { latestBlock?: string };
      indexer: { lastBlock: string; currentBlock: string; lag: string; status: 'up' | 'down' };
    };
  }> {
    const db = await this.checkDb();
    const rpc = await this.checkRpc();
    let indexer: { lastBlock: string; currentBlock: string; lag: string; status: 'up' | 'down' } = {
      lastBlock: '0',
      currentBlock: '0',
      lag: '0',
      status: 'down',
    };
    try {
      const raw = await this.indexer.status();
      indexer = { ...raw, status: 'up' };
    } catch {
      indexer = { lastBlock: '0', currentBlock: '0', lag: '0', status: 'down' };
    }

    const degraded = db.status === 'down' || rpc.status === 'down' || indexer.status === 'down';
    return {
      status: degraded ? 'degraded' : 'ok',
      requestId: currentRequestId(),
      uptime: process.uptime(),
      dependencies: { db, rpc, indexer },
    };
  }

  private async checkDb(): Promise<DepStatus> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error: unknown) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        detail: error instanceof Error ? error.name : 'db_error',
      };
    }
  }

  private async checkRpc(): Promise<DepStatus & { latestBlock?: string }> {
    const started = Date.now();
    try {
      const client = createPublicClient({
        chain: monadTestnet,
        transport: http(this.config.getOrThrow<string>('MONAD_RPC_URL'), { timeout: 4_000 }),
      });
      const block = await client.getBlockNumber();
      return { status: 'up', latencyMs: Date.now() - started, latestBlock: block.toString() };
    } catch (error: unknown) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        detail: error instanceof Error ? error.name : 'rpc_error',
      };
    }
  }
}
