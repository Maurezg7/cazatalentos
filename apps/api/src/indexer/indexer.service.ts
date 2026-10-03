import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type PrismaClient } from '@prisma/client';
import {
  createPublicClient,
  http,
  parseAbi,
  parseAbiItem,
  type Address,
  type PublicClient,
} from 'viem';
import { monadTestnet } from 'viem/chains';
import { PrismaService } from '../prisma/prisma.service';

const CURSOR_NAME = 'cazatalentos';
// Monad public RPC limits eth_getLogs to a 100-block range.
// Larger windows are rejected with "eth_getLogs is limited to a 100 range".
const DEFAULT_CHUNK_SIZE = 100;
const CATCH_UP_LAG_BLOCKS = 1_000n;
// Faster than INDEXER_POLL_INTERVAL_MS while the cursor is still behind.
const CATCH_UP_INTERVAL_MS = 500;

const POOL_STATUSES = ['Open', 'Claimed', 'Approved', 'Rejected', 'Reclaimed'] as const;

const artistRegisteredEvent = parseAbiItem(
  'event ArtistRegistered(uint256 indexed artistId, address indexed owner, string uri)',
);
const beliefSignedEvent = parseAbiItem(
  'event BeliefSigned(uint256 indexed artistId, address indexed supporter, uint32 rank, uint8 weight)',
);
const poolOpenedEvent = parseAbiItem(
  'event PoolOpened(uint256 indexed poolId, uint256 indexed artistId, uint256 amount, bytes32 milestoneHash, uint64 deadline)',
);
const milestoneClaimedEvent = parseAbiItem(
  'event MilestoneClaimed(uint256 indexed poolId, string evidenceURI, uint64 voteEnd)',
);
const votedEvent = parseAbiItem(
  'event Voted(uint256 indexed poolId, address indexed supporter, bool approve, uint256 weight)',
);
const poolFinalizedEvent = parseAbiItem('event PoolFinalized(uint256 indexed poolId, uint8 status)');
const rewardClaimedEvent = parseAbiItem(
  'event RewardClaimed(uint256 indexed poolId, address indexed supporter, uint256 amount)',
);
const poolReclaimedEvent = parseAbiItem(
  'event PoolReclaimed(uint256 indexed poolId, address indexed artist, uint256 amount)',
);
const stakeWithdrawnEvent = parseAbiItem(
  'event StakeWithdrawn(uint256 indexed artistId, address indexed supporter, uint256 amount)',
);

const poolOfAbi = parseAbi([
  'function poolOf(uint256 poolId) view returns ((uint256 artistId, uint256 amount, bytes32 milestoneHash, uint64 deadline, uint64 voteEnd, uint256 votesFor, uint256 votesAgainst, uint32 supportersAtOpen, uint256 totalWeightAtOpen, uint8 status, string evidenceURI))',
]);

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends' | '$use'
>;

type IndexedLog = {
  blockNumber: bigint;
  logIndex: number;
  apply: (tx: Tx, signedAt: Date) => Promise<void>;
};

type WriteCounts = {
  artists: number;
  supporters: number;
  pools: number;
  votes: number;
};

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private readonly client: PublicClient;
  private readonly contract: Address;
  private readonly startBlock: bigint;
  private readonly pollMs: number;
  private readonly chunkSize: bigint;
  private readonly lagWarningBlocks: bigint;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private boot: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private inflight: Promise<void> | undefined;
  private consecutiveFailures = 0;
  private backoffUntil = 0;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) config: ConfigService,
  ) {
    const rpcUrl = config.getOrThrow<string>('MONAD_RPC_URL');
    this.contract = config.getOrThrow<string>('CAZATALENTOS_ADDRESS') as Address;
    this.startBlock = BigInt(config.getOrThrow<number>('INDEXER_START_BLOCK'));
    this.pollMs = config.getOrThrow<number>('INDEXER_POLL_INTERVAL_MS');
    this.chunkSize = BigInt(config.get<number>('INDEXER_CHUNK_SIZE') ?? DEFAULT_CHUNK_SIZE);
    this.lagWarningBlocks = this.chunkSize * 10n;
    this.client = createPublicClient({
      chain: monadTestnet,
      transport: http(rpcUrl),
    });
  }

  onModuleInit(): void {
    this.boot = setTimeout(() => {
      void this.tick();
    }, 2_000);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.boot) clearTimeout(this.boot);
    if (this.timer) clearTimeout(this.timer);
  }

  async status(): Promise<{ lastBlock: string; currentBlock: string; lag: string }> {
    const currentBlock = await this.client.getBlockNumber();
    const cursor = await this.prisma.indexerCursor.findUnique({ where: { name: CURSOR_NAME } });
    const lastBlock = cursor?.lastBlock ?? this.startBlock - 1n;
    const lag = currentBlock > lastBlock ? currentBlock - lastBlock : 0n;
    return {
      lastBlock: lastBlock.toString(),
      currentBlock: currentBlock.toString(),
      lag: lag.toString(),
    };
  }

  async syncNow(): Promise<{ lastBlock: string; currentBlock: string; lag: string }> {
    if (!this.inflight) {
      this.inflight = this.runChunk().finally(() => {
        this.inflight = undefined;
      });
    }
    await this.inflight;
    return this.status();
  }

  private async tick(): Promise<void> {
    if (Date.now() < this.backoffUntil) {
      this.scheduleNext(this.backoffUntil - Date.now());
      return;
    }
    const started = this.inflight === undefined;
    let delay = this.pollMs;
    try {
      const cursor = await this.syncNow();
      delay = this.pollDelay(BigInt(cursor.lag));
      if (started) {
        this.consecutiveFailures = 0;
        this.backoffUntil = 0;
      }
    } catch (error: unknown) {
      // This catch does not touch the cursor. runChunk advances it only after the chunk transaction commits.
      if (started) {
        this.consecutiveFailures += 1;
        const message = error instanceof Error ? error.message : 'unknown indexer error';
        this.logger.error(`Indexer tick failed: ${message}`);
        const waitMs = this.backoffMs(this.consecutiveFailures);
        if (waitMs > 0) {
          this.backoffUntil = Date.now() + waitMs;
          delay = waitMs;
          this.logger.warn(
            `Indexer backing off for ${waitMs / 1000}s after ${this.consecutiveFailures} consecutive failures`,
          );
        }
      }
    }
    this.scheduleNext(delay);
  }

  private pollDelay(lag: bigint): number {
    if (lag > CATCH_UP_LAG_BLOCKS) return CATCH_UP_INTERVAL_MS;
    return this.pollMs;
  }

  private scheduleNext(delayMs: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
  }

  private backoffMs(failures: number): number {
    if (failures >= 4) return 120_000;
    if (failures >= 2) return 30_000;
    return 0;
  }

  private async runChunk(): Promise<void> {
    const cursor = await this.ensureCursor();
    const currentBlock = await this.client.getBlockNumber();
    if (currentBlock <= cursor.lastBlock) return;

    const lag = currentBlock - cursor.lastBlock;
    if (lag > this.lagWarningBlocks) {
      this.logger.warn(`Indexer is behind by ${lag.toString()} blocks`);
    }

    const fromBlock = cursor.lastBlock + 1n;
    const toBlock =
      fromBlock + this.chunkSize - 1n > currentBlock
        ? currentBlock
        : fromBlock + this.chunkSize - 1n;

    const collected = await this.collect(fromBlock, toBlock);
    const logs = collected.logs;
    logs.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber < b.blockNumber ? -1 : 1;
      return a.logIndex - b.logIndex;
    });

    this.logger.log(
      `Processing chunk ${fromBlock.toString()}-${toBlock.toString()} (${logs.length} logs)`,
    );

    const timestamps = await this.blockTimestamps(logs);

    await this.prisma.$transaction(async (tx) => {
      for (const log of logs) {
        const signedAt = timestamps.get(log.blockNumber);
        if (!signedAt) {
          throw new Error(`Missing timestamp for block ${log.blockNumber.toString()}`);
        }
        await log.apply(tx, signedAt);
      }
      await tx.indexerCursor.update({
        where: { name: CURSOR_NAME },
        data: { lastBlock: toBlock },
      });
    });

    const { counts } = collected;
    this.logger.log(
      `DB upserts artists=${counts.artists} supporters=${counts.supporters} pools=${counts.pools} votes=${counts.votes}`,
    );
  }

  private async ensureCursor(): Promise<{ lastBlock: bigint }> {
    const existing = await this.prisma.indexerCursor.findUnique({ where: { name: CURSOR_NAME } });
    if (existing) return existing;
    return this.prisma.indexerCursor.create({
      data: { name: CURSOR_NAME, lastBlock: this.startBlock - 1n },
    });
  }

  private async blockTimestamps(logs: IndexedLog[]): Promise<Map<bigint, Date>> {
    const timestamps = new Map<bigint, Date>();
    const blocks = [...new Set(logs.map((log) => log.blockNumber))];
    for (const blockNumber of blocks) {
      const block = await this.client.getBlock({ blockNumber });
      timestamps.set(blockNumber, new Date(Number(block.timestamp) * 1000));
    }
    return timestamps;
  }

  private async collect(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<{ logs: IndexedLog[]; counts: WriteCounts }> {
    const logs: IndexedLog[] = [];
    const counts: WriteCounts = { artists: 0, supporters: 0, pools: 0, votes: 0 };
    const range = { address: this.contract, fromBlock, toBlock } as const;

    const artists = await this.client.getLogs({ ...range, event: artistRegisteredEvent });
    this.logger.log(`ArtistRegistered: ${artists.length}`);
    for (const log of artists) {
      const artistId = Number(log.args.artistId);
      const owner = log.args.owner;
      const uri = log.args.uri;
      if (owner === undefined || uri === undefined) {
        throw new Error(`Undecoded ArtistRegistered at block ${log.blockNumber?.toString() ?? '?'}`);
      }
      logs.push({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex ?? 0,
        apply: async (tx) => {
          const current = await tx.artist.findUnique({ where: { id: artistId } });
          const uriChanged = current !== null && current.metadataURI !== uri;
          await tx.artist.upsert({
            where: { id: artistId },
            create: {
              id: artistId,
              owner,
              metadataURI: uri,
              supporterCount: 0,
            },
            update: {
              owner,
              metadataURI: uri,
              ...(uriChanged
                ? { name: null, photo: null, bio: null, links: Prisma.DbNull }
                : {}),
            },
          });
          counts.artists += 1;
        },
      });
    }

    const beliefs = await this.client.getLogs({ ...range, event: beliefSignedEvent });
    this.logger.log(`BeliefSigned: ${beliefs.length}`);
    for (const log of beliefs) {
      const artistId = Number(log.args.artistId);
      const address = log.args.supporter?.toLowerCase();
      const rank = Number(log.args.rank);
      const weight = Number(log.args.weight);
      if (!address) {
        throw new Error(`Undecoded BeliefSigned at block ${log.blockNumber?.toString() ?? '?'}`);
      }
      logs.push({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex ?? 0,
        apply: async (tx, signedAt) => {
          await tx.supporter.upsert({
            where: { artistId_address: { artistId, address } },
            create: { artistId, address, rank, weight, signedAt, stakeWei: '0' },
            update: { rank, weight, signedAt },
          });
          await tx.artist.update({
            where: { id: artistId },
            data: { supporterCount: rank },
          });
          counts.supporters += 1;
        },
      });
    }

    const pools = await this.client.getLogs({ ...range, event: poolOpenedEvent });
    this.logger.log(`PoolOpened: ${pools.length}`);
    for (const log of pools) {
      const poolId = Number(log.args.poolId);
      const artistId = Number(log.args.artistId);
      const amount = log.args.amount;
      const milestoneHash = log.args.milestoneHash;
      const deadline = log.args.deadline;
      if (amount === undefined || milestoneHash === undefined || deadline === undefined) {
        throw new Error(`Undecoded PoolOpened at block ${log.blockNumber?.toString() ?? '?'}`);
      }
      const snapshot = await this.readPoolSnapshot(BigInt(poolId));
      logs.push({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex ?? 0,
        apply: async (tx) => {
          await tx.pool.upsert({
            where: { id: poolId },
            create: {
              id: poolId,
              artistId,
              amountWei: amount.toString(),
              milestoneHash,
              deadline: new Date(Number(deadline) * 1000),
              supportersAtOpen: snapshot.supportersAtOpen,
              totalWeightAtOpen: snapshot.totalWeightAtOpen,
              status: 'Open',
            },
            update: {
              artistId,
              amountWei: amount.toString(),
              milestoneHash,
              deadline: new Date(Number(deadline) * 1000),
              supportersAtOpen: snapshot.supportersAtOpen,
              totalWeightAtOpen: snapshot.totalWeightAtOpen,
            },
          });
          counts.pools += 1;
        },
      });
    }

    const claims = await this.client.getLogs({ ...range, event: milestoneClaimedEvent });
    this.logger.log(`MilestoneClaimed: ${claims.length}`);
    for (const log of claims) {
      const poolId = Number(log.args.poolId);
      const evidenceURI = log.args.evidenceURI ?? '';
      const voteEnd = log.args.voteEnd;
      if (voteEnd === undefined) {
        throw new Error(`Undecoded MilestoneClaimed at block ${log.blockNumber?.toString() ?? '?'}`);
      }
      logs.push({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex ?? 0,
        apply: async (tx) => {
          await tx.pool.update({
            where: { id: poolId },
            data: {
              evidenceURI,
              voteEnd: new Date(Number(voteEnd) * 1000),
              status: 'Claimed',
            },
          });
          counts.pools += 1;
        },
      });
    }

    const votes = await this.client.getLogs({ ...range, event: votedEvent });
    this.logger.log(`Voted: ${votes.length}`);
    for (const log of votes) {
      const poolId = Number(log.args.poolId);
      const address = log.args.supporter?.toLowerCase();
      const approve = log.args.approve;
      const weight = log.args.weight;
      if (!address || approve === undefined || weight === undefined) {
        throw new Error(`Undecoded Voted at block ${log.blockNumber?.toString() ?? '?'}`);
      }
      logs.push({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex ?? 0,
        apply: async (tx, votedAt) => {
          await tx.vote.upsert({
            where: { poolId_address: { poolId, address } },
            create: { poolId, address, approve, weight: weight.toString(), votedAt },
            update: { approve, weight: weight.toString(), votedAt },
          });
          counts.votes += 1;
        },
      });
    }

    const finals = await this.client.getLogs({ ...range, event: poolFinalizedEvent });
    this.logger.log(`PoolFinalized: ${finals.length}`);
    for (const log of finals) {
      const poolId = Number(log.args.poolId);
      const statusIndex = Number(log.args.status);
      const status = POOL_STATUSES[statusIndex];
      if (!status) {
        throw new Error(`Unknown pool status ${statusIndex} for pool ${poolId}`);
      }
      logs.push({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex ?? 0,
        apply: async (tx) => {
          await tx.pool.update({
            where: { id: poolId },
            data: { status },
          });
          counts.pools += 1;
        },
      });
    }

    const rewards = await this.client.getLogs({ ...range, event: rewardClaimedEvent });
    this.logger.log(`RewardClaimed: ${rewards.length}`);
    for (const log of rewards) {
      this.logger.log(
        `RewardClaimed pool=${log.args.poolId?.toString() ?? '?'} supporter=${log.args.supporter ?? '?'} amount=${log.args.amount?.toString() ?? '?'}`,
      );
    }

    const reclaimed = await this.client.getLogs({ ...range, event: poolReclaimedEvent });
    this.logger.log(`PoolReclaimed: ${reclaimed.length}`);
    for (const log of reclaimed) {
      this.logger.log(
        `PoolReclaimed pool=${log.args.poolId?.toString() ?? '?'} artist=${log.args.artist ?? '?'} amount=${log.args.amount?.toString() ?? '?'}`,
      );
    }

    const withdrawn = await this.client.getLogs({ ...range, event: stakeWithdrawnEvent });
    this.logger.log(`StakeWithdrawn: ${withdrawn.length}`);
    for (const log of withdrawn) {
      this.logger.log(
        `StakeWithdrawn artist=${log.args.artistId?.toString() ?? '?'} supporter=${log.args.supporter ?? '?'} amount=${log.args.amount?.toString() ?? '?'}`,
      );
    }

    return { logs, counts };
  }

  private async readPoolSnapshot(
    poolId: bigint,
  ): Promise<{ supportersAtOpen: number; totalWeightAtOpen: string }> {
    const pool = await this.client.readContract({
      address: this.contract,
      abi: poolOfAbi,
      functionName: 'poolOf',
      args: [poolId],
    });
    return {
      supportersAtOpen: Number(pool.supportersAtOpen),
      totalWeightAtOpen: pool.totalWeightAtOpen.toString(),
    };
  }
}
