import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const POOL_STATUSES = ['Open', 'Claimed', 'Approved', 'Rejected', 'Reclaimed'] as const;

export type PoolStatusName = (typeof POOL_STATUSES)[number];

export type PoolVoteView = {
  address: string;
  approve: boolean;
  weight: string;
  votedAt: string;
};

export type PoolView = {
  id: number;
  artistId: number;
  amountWei: string;
  milestoneHash: string;
  deadline: string;
  voteEnd: string | null;
  supportersAtOpen: number;
  totalWeightAtOpen: string;
  status: PoolStatusName;
  evidenceURI: string | null;
  milestoneDescription: string | null;
  votes?: PoolVoteView[];
};

const STUB_HASH = `0x${'0'.repeat(64)}`;

type PoolRow = {
  id: number;
  artistId: number;
  amountWei: string;
  milestoneHash: string;
  deadline: Date;
  voteEnd: Date | null;
  supportersAtOpen: number;
  totalWeightAtOpen: string;
  status: string;
  evidenceURI: string | null;
  milestoneDescription: string | null;
};

@Injectable()
export class PoolsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async registerPool(dto: { poolId: number; artistId: number; description: string }): Promise<PoolView> {
    const artist = await this.prisma.artist.findUnique({ where: { id: dto.artistId } });
    if (!artist) {
      throw new BadRequestException('Artist is not indexed yet');
    }

    const pool = await this.prisma.pool.upsert({
      where: { id: dto.poolId },
      create: {
        id: dto.poolId,
        artistId: dto.artistId,
        amountWei: '0',
        milestoneHash: STUB_HASH,
        deadline: new Date(0),
        supportersAtOpen: 0,
        totalWeightAtOpen: '0',
        status: 'Open',
        milestoneDescription: dto.description,
      },
      update: { milestoneDescription: dto.description },
    });

    return toPoolView(pool);
  }

  async getPool(id: number): Promise<PoolView & { artist: { id: number; owner: string; metadataURI: string } }> {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: {
        votes: { orderBy: { votedAt: 'asc' } },
        artist: { select: { id: true, owner: true, metadataURI: true } },
      },
    });
    if (!pool) {
      throw new NotFoundException();
    }
    return {
      ...toPoolView(pool),
      artist: pool.artist,
      votes: pool.votes.map((vote) => ({
        address: vote.address,
        approve: vote.approve,
        weight: vote.weight,
        votedAt: vote.votedAt.toISOString(),
      })),
    };
  }

  async getArtistPools(artistId: number, status?: PoolStatusName): Promise<PoolView[]> {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) {
      throw new NotFoundException();
    }

    const rows = await this.prisma.pool.findMany({
      where: { artistId, ...(status ? { status } : {}) },
      orderBy: { deadline: 'desc' },
    });
    return rows.map(toPoolView);
  }
}

function toPoolView(pool: PoolRow): PoolView {
  return {
    id: pool.id,
    artistId: pool.artistId,
    amountWei: pool.amountWei,
    milestoneHash: pool.milestoneHash,
    deadline: pool.deadline.toISOString(),
    voteEnd: pool.voteEnd ? pool.voteEnd.toISOString() : null,
    supportersAtOpen: pool.supportersAtOpen,
    totalWeightAtOpen: pool.totalWeightAtOpen,
    status: asStatus(pool.status),
    evidenceURI: pool.evidenceURI,
    milestoneDescription: pool.milestoneDescription,
  };
}

function asStatus(value: string): PoolStatusName {
  if (value === 'Open' || value === 'Claimed' || value === 'Approved' || value === 'Rejected' || value === 'Reclaimed') {
    return value;
  }
  return 'Open';
}
