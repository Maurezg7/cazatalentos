import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

const remoteProfileSchema = z.object({
  name: z.string().min(1),
  photo: z.string().optional(),
  bio: z.string().optional(),
  links: z.record(z.string(), z.string()).optional(),
});

export type ArtistProfile = {
  id: number;
  owner: string;
  metadataURI: string;
  supporterCount: number;
  displayName: string;
  photo: string | null;
  bio: string | null;
  links: Record<string, string> | null;
};

export type SupporterPage = {
  items: Array<{
    address: string;
    rank: number;
    weight: number;
    signedAt: string;
    stakeWei: string;
  }>;
  limit: number;
  offset: number;
  total: number;
};

@Injectable()
export class ArtistsService {
  private readonly logger = new Logger(ArtistsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getArtist(id: number): Promise<ArtistProfile> {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      throw new NotFoundException();
    }

    const resolved = await this.resolveMetadata(artist);
    return {
      id: resolved.id,
      owner: resolved.owner,
      metadataURI: resolved.metadataURI,
      supporterCount: resolved.supporterCount,
      displayName: resolved.name ?? resolved.metadataURI,
      photo: resolved.photo,
      bio: resolved.bio,
      links: asLinks(resolved.links),
    };
  }

  async listSupporters(artistId: number, limit: number, offset: number): Promise<SupporterPage> {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) {
      throw new NotFoundException();
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supporter.count({ where: { artistId } }),
      this.prisma.supporter.findMany({
        where: { artistId },
        orderBy: { rank: 'asc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        address: row.address,
        rank: row.rank,
        weight: row.weight,
        signedAt: row.signedAt.toISOString(),
        stakeWei: row.stakeWei,
      })),
      limit,
      offset,
      total,
    };
  }

  private async resolveMetadata(artist: {
    id: number;
    metadataURI: string;
    name: string | null;
    photo: string | null;
    bio: string | null;
  }): Promise<{
    id: number;
    owner: string;
    metadataURI: string;
    supporterCount: number;
    name: string | null;
    photo: string | null;
    bio: string | null;
    links: Prisma.JsonValue | null;
  }> {
    const current = await this.prisma.artist.findUniqueOrThrow({ where: { id: artist.id } });
    if (!isHttpUrl(current.metadataURI) || current.name) {
      return current;
    }

    try {
      const response = await fetch(current.metadataURI, { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) {
        this.logger.warn(`Metadata fetch failed for artist ${current.id}: HTTP ${response.status}`);
        return current;
      }
      const json: unknown = await response.json();
      const parsed = remoteProfileSchema.safeParse(json);
      if (!parsed.success) {
        this.logger.warn(`Metadata JSON invalid for artist ${current.id}`);
        return current;
      }
      return await this.prisma.artist.update({
        where: { id: current.id },
        data: {
          name: parsed.data.name,
          photo: parsed.data.photo ?? null,
          bio: parsed.data.bio ?? null,
          links: parsed.data.links ?? Prisma.DbNull,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'metadata fetch failed';
      this.logger.warn(`Metadata fetch failed for artist ${current.id}: ${message}`);
      return current;
    }
  }
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function asLinks(value: Prisma.JsonValue | null): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const links: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') links[key] = entry;
  }
  return Object.keys(links).length > 0 ? links : null;
}
