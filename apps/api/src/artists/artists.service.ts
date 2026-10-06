import { mkdir, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { contentHash, writeAuthMessage, type WriteAction } from '@cazatalentos/shared';
import { verifyMessage, type Address, type Hex } from 'viem';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

const MAX_POSTS = 30;
const MAX_REELS = 12;
const SIGNATURE_TTL_MS = 5 * 60 * 1000;

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
  cover: string | null;
  bio: string | null;
  bioWash: string | null;
  bioInk: string | null;
  nameFont: string | null;
  country: string | null;
  region: string | null;
  promoRank: number;
  links: Record<string, string> | null;
};

export type ArtistReelView = {
  id: number;
  caption: string;
  overlayText: string;
  filter: string;
  textPlace: 'top' | 'middle' | 'bottom';
  src: string;
  createdAt: string;
};

const REEL_DIR = join(process.cwd(), 'uploads', 'reels');
const POST_DIR = join(process.cwd(), 'uploads', 'posts');
const ARTIST_DIR = join(process.cwd(), 'uploads', 'artists');
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_REEL_BYTES = 8 * 1024 * 1024;

export type ArtistPostView = {
  id: number;
  body: string;
  media: string | null;
  mediaKind: 'photo' | 'gif' | null;
  createdAt: string;
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

  async findOwned(owner: string): Promise<{ id: number } | null> {
    if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) return null;
    const artist = await this.prisma.artist.findFirst({
      where: { owner: { equals: owner, mode: 'insensitive' } },
      select: { id: true },
    });
    return artist;
  }

  async listForExplore(raw: Record<string, unknown>): Promise<{
    items: Array<{
      id: number;
      nombre: string;
      ciudad: string;
      generos: string[];
      pioneros: number;
      patrocinado: boolean;
      portada: string | null;
      pozo: { montoWei: string; metaWei: null; cupoMaximo: null; cierraEn: string; abierto: true } | null;
    }>;
    total: number;
    pagina: number;
    tamano: number;
    ciudades: string[];
  }> {
    const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 80) : '';
    const ciudades = asStrings(raw.ciudad).slice(0, 12);
    const estados = asStrings(raw.estado).filter((item) =>
      item === 'cupo' || item === 'ultimos' || item === 'pronto' || item === 'cerrado',
    );
    const orden = ['meta', 'cierra', 'pioneros', 'nuevos', 'az'].includes(String(raw.orden))
      ? String(raw.orden)
      : 'az';
    const pagina = Math.max(1, Math.min(500, Number(raw.pagina) || 1));
    const tamano = 12;
    const rows = await this.prisma.artist.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { region: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(ciudades.length > 0 ? { region: { in: ciudades } } : {}),
      },
      include: { pools: { where: { status: 'Open' }, orderBy: { deadline: 'asc' }, take: 1 } },
    });
    const ciudadesTodas = await this.prisma.artist.findMany({
      where: { region: { not: null } },
      select: { region: true },
      distinct: ['region'],
    });
    const now = Date.now();
    const mapped = rows.map((row) => {
      const open = row.pools[0];
      const pronto = open ? open.deadline.getTime() - now < 3 * 24 * 60 * 60 * 1000 : false;
      return {
        id: row.id,
        nombre: row.name || row.metadataURI,
        ciudad: row.region || 'Sin ciudad',
        generos: [] as string[],
        pioneros: row.supporterCount,
        patrocinado: row.promoRank > 0,
        portada: row.cover ? `/api/media/artists/${row.id}/cover` : null,
        pozo: open
          ? {
              montoWei: open.amountWei,
              metaWei: null,
              cupoMaximo: null,
              cierraEn: open.deadline.toISOString(),
              abierto: true as const,
            }
          : null,
        pronto,
        creado: row.createdAt.getTime(),
      };
    });
    const filtered = estados.length === 0
      ? mapped
      : mapped.filter((row) =>
          estados.some((estado) => {
            if (estado === 'cerrado') return row.pozo === null;
            if (estado === 'cupo') return row.pozo !== null;
            if (estado === 'pronto') return row.pronto;
            return false;
          }),
        );
    const sorted = [...filtered].sort((a, b) => {
      if (orden === 'pioneros') return b.pioneros - a.pioneros;
      if (orden === 'nuevos') return b.creado - a.creado;
      if (orden === 'cierra') return (a.pozo ? Date.parse(a.pozo.cierraEn) : Number.MAX_SAFE_INTEGER) - (b.pozo ? Date.parse(b.pozo.cierraEn) : Number.MAX_SAFE_INTEGER);
      if (orden === 'meta') return b.pioneros - a.pioneros;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
    const placed = placeSponsored(sorted);
    const start = (pagina - 1) * tamano;
    return {
      items: placed.slice(start, start + tamano).map(({ pronto: _pronto, creado: _creado, ...item }) => item),
      total: placed.length,
      pagina,
      tamano,
      ciudades: ciudadesTodas.map((row) => row.region).filter((region): region is string => Boolean(region)),
    };
  }

  async getArtist(id: number): Promise<ArtistProfile> {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      throw new NotFoundException();
    }

    const resolved = await this.resolveMetadata(artist);
    const photo = await this.materializeArtistImage(resolved.id, 'photo', resolved.photo);
    const cover = await this.materializeArtistImage(resolved.id, 'cover', resolved.cover);
    return {
      id: resolved.id,
      owner: resolved.owner,
      metadataURI: resolved.metadataURI,
      supporterCount: resolved.supporterCount,
      displayName: resolved.name ?? resolved.metadataURI,
      photo,
      cover,
      bio: resolved.bio,
      bioWash: resolved.bioWash,
      bioInk: resolved.bioInk,
      nameFont: resolved.nameFont,
      country: resolved.country,
      region: resolved.region,
      promoRank: resolved.promoRank,
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

  async updateProfile(
    id: number,
    input: {
      issuedAt: number;
      signature: string;
      bio?: string;
      photo?: string;
      cover?: string;
      bioWash?: string;
      bioInk?: string;
      nameFont?: string;
      country?: string;
      region?: string;
    },
  ): Promise<ArtistProfile> {
    const bio = input.bio?.trim();
    const country = input.country?.trim().toUpperCase() ?? '';
    const region = input.region?.trim() ?? '';
    if (input.bioWash && input.bioInk && contrastRatio(input.bioWash, input.bioInk) < 4.5) {
      throw new BadRequestException('El color del nombre no se lee sobre ese fondo.');
    }
    const artist = await this.requireSigned(id, 'profile', input.issuedAt, input.signature, {
      ...(bio !== undefined ? { bio } : {}),
      ...(input.photo !== undefined ? { photo: input.photo } : {}),
      ...(input.cover !== undefined ? { cover: input.cover } : {}),
      ...(input.bioWash !== undefined ? { bioWash: input.bioWash } : {}),
      ...(input.bioInk !== undefined ? { bioInk: input.bioInk } : {}),
      ...(input.nameFont !== undefined ? { nameFont: input.nameFont } : {}),
      ...(input.country !== undefined ? { country } : {}),
      ...(input.region !== undefined ? { region } : {}),
    });
    await this.prisma.artist.update({
      where: { id: artist.id },
      data: {
        ...(bio !== undefined ? { bio } : {}),
        ...(input.photo !== undefined ? { photo: await this.writeArtistImage(artist.id, 'photo', input.photo) } : {}),
        ...(input.cover !== undefined ? { cover: await this.writeArtistImage(artist.id, 'cover', input.cover) } : {}),
        ...(input.bioWash !== undefined ? { bioWash: input.bioWash } : {}),
        ...(input.bioInk !== undefined ? { bioInk: input.bioInk } : {}),
        ...(input.nameFont !== undefined ? { nameFont: input.nameFont } : {}),
        ...(input.country !== undefined ? { country: country || null } : {}),
        ...(input.region !== undefined ? { region: region || null } : {}),
      },
    });
    return this.getArtist(id);
  }

  async listReels(artistId: number): Promise<ArtistReelView[]> {
    await this.requireArtist(artistId);
    const rows = await this.prisma.artistReel.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((row) => this.toReel(row));
  }

  async createReel(
    artistId: number,
    input: {
      issuedAt: number;
      signature: string;
      caption?: string;
      overlayText?: string;
      filter?: string;
      textPlace?: string;
      video: string;
    },
  ): Promise<ArtistReelView> {
    const count = await this.prisma.artistReel.count({ where: { artistId } });
    if (count >= MAX_REELS) throw new BadRequestException('Este artista ya tiene el máximo de reels');
    const caption = input.caption?.trim() ?? '';
    const overlayText = input.overlayText?.trim() ?? '';
    const filter = input.filter ?? 'none';
    const textPlace = input.textPlace === 'top' || input.textPlace === 'bottom' ? input.textPlace : 'middle';
    const match = /^data:(video\/(?:mp4|webm));base64,([A-Za-z0-9+/=\s]+)$/.exec(input.video);
    if (!match) throw new BadRequestException('El reel tiene que ser MP4 o WebM');
    const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (bytes.length > MAX_REEL_BYTES) {
      throw new BadRequestException('El reel pesa más de 8 MB');
    }
    const artist = await this.requireSigned(artistId, 'reel', input.issuedAt, input.signature, {
      caption,
      overlayText,
      filter,
      textPlace,
      video: input.video,
    });
    const ext = match[1] === 'video/webm' ? 'webm' : 'mp4';
    const row = await this.prisma.artistReel.create({
      data: {
        artistId: artist.id,
        caption,
        overlayText,
        filter,
        textPlace,
        fileName: 'pending',
      },
    });
    const fileName = `${row.id}.${ext}`;
    await mkdir(REEL_DIR, { recursive: true });
    await writeFile(join(REEL_DIR, fileName), bytes);
    const saved = await this.prisma.artistReel.update({
      where: { id: row.id },
      data: { fileName },
    });
    return this.toReel(saved);
  }

  async streamReelFile(id: number): Promise<StreamableFile> {
    const row = await this.prisma.artistReel.findUnique({ where: { id } });
    if (!row || row.fileName === 'pending') throw new NotFoundException();
    const type = row.fileName.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    return new StreamableFile(createReadStream(join(REEL_DIR, row.fileName)), { type });
  }

  async listPosts(artistId: number): Promise<ArtistPostView[]> {
    await this.requireArtist(artistId);
    const rows = await this.prisma.artistPost.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return Promise.all(rows.map((row) => this.toPost(row)));
  }

  async createPost(
    artistId: number,
    input: { issuedAt: number; signature: string; body: string; media?: string },
  ): Promise<ArtistPostView> {
    const count = await this.prisma.artistPost.count({ where: { artistId } });
    if (count >= MAX_POSTS) throw new BadRequestException('Este artista ya tiene el máximo de publicaciones');
    const body = input.body.trim();
    if (!body && !input.media) {
      throw new BadRequestException('La publicación necesita texto o una imagen');
    }
    const artist = await this.requireSigned(artistId, 'post', input.issuedAt, input.signature, {
      body,
      ...(input.media !== undefined ? { media: input.media } : {}),
    });
    const row = await this.prisma.artistPost.create({
      data: {
        artistId: artist.id,
        body,
        media: null,
        mediaKind: input.media ? mediaKind(input.media) : null,
      },
    });
    if (input.media) {
      const fileName = await this.writeImageFile(POST_DIR, String(row.id), input.media);
      const saved = await this.prisma.artistPost.update({
        where: { id: row.id },
        data: { media: fileName },
      });
      return this.toPost(saved);
    }
    return this.toPost(row);
  }

  async streamPostFile(id: number): Promise<StreamableFile> {
    const row = await this.prisma.artistPost.findUnique({ where: { id } });
    if (!row?.media || row.media.startsWith('data:')) throw new NotFoundException();
    return this.streamFile(POST_DIR, row.media);
  }

  async streamArtistImage(id: number, kind: 'photo' | 'cover'): Promise<StreamableFile> {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    const name = kind === 'photo' ? artist?.photo : artist?.cover;
    if (!name || name.startsWith('data:')) throw new NotFoundException();
    return this.streamFile(ARTIST_DIR, name);
  }

  private toReel(row: {
    id: number;
    caption: string;
    overlayText: string;
    filter: string;
    textPlace: string;
    createdAt: Date;
  }): ArtistReelView {
    return {
      id: row.id,
      caption: row.caption,
      overlayText: row.overlayText,
      filter: row.filter,
      textPlace: row.textPlace === 'top' || row.textPlace === 'bottom' ? row.textPlace : 'middle',
      src: toReelSrc(row.id),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async toPost(row: {
    id: number;
    body: string;
    media: string | null;
    mediaKind: string | null;
    createdAt: Date;
  }): Promise<ArtistPostView> {
    let media = row.media;
    if (media?.startsWith('data:')) {
      const fileName = await this.writeImageFile(POST_DIR, String(row.id), media);
      await this.prisma.artistPost.update({ where: { id: row.id }, data: { media: fileName } });
      media = fileName;
    }
    return {
      id: row.id,
      body: row.body,
      media: media && !media.startsWith('data:') ? `/api/media/posts/${row.id}` : null,
      mediaKind: row.mediaKind === 'gif' || row.mediaKind === 'photo' ? row.mediaKind : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async materializeArtistImage(
    id: number,
    kind: 'photo' | 'cover',
    current: string | null,
  ): Promise<string | null> {
    if (!current) return null;
    if (!current.startsWith('data:')) return `/api/media/artists/${id}/${kind}`;
    const fileName = await this.writeArtistImage(id, kind, current);
    await this.prisma.artist.update({ where: { id }, data: { [kind]: fileName } });
    return `/api/media/artists/${id}/${kind}`;
  }

  private async writeArtistImage(id: number, kind: 'photo' | 'cover', dataUrl: string): Promise<string> {
    return this.writeImageFile(ARTIST_DIR, `${id}-${kind}`, dataUrl);
  }

  private async writeImageFile(dir: string, baseName: string, dataUrl: string): Promise<string> {
    const match = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
    if (!match) throw new BadRequestException('La imagen tiene que ser JPEG, PNG, WebP o GIF');
    const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (bytes.length > MAX_IMAGE_BYTES) throw new BadRequestException('La imagen pesa más de 1.5 MB');
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const fileName = `${baseName}.${ext}`;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), bytes);
    return fileName;
  }

  private streamFile(dir: string, fileName: string): StreamableFile {
    if (!/^[\w.-]+$/.test(fileName)) throw new NotFoundException();
    const type =
      fileName.endsWith('.png') ? 'image/png'
      : fileName.endsWith('.webp') ? 'image/webp'
      : fileName.endsWith('.gif') ? 'image/gif'
      : fileName.endsWith('.webm') ? 'video/webm'
      : fileName.endsWith('.mp4') ? 'video/mp4'
      : 'image/jpeg';
    return new StreamableFile(createReadStream(join(dir, fileName)), { type });
  }

  private async requireArtist(id: number) {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) throw new NotFoundException();
    return artist;
  }

  private async requireSigned(
    id: number,
    action: WriteAction,
    issuedAt: number,
    signature: string,
    parts: Record<string, string>,
  ) {
    const artist = await this.requireArtist(id);
    if (Math.abs(Date.now() - issuedAt) > SIGNATURE_TTL_MS) {
      throw new ForbiddenException('La firma venció. Volvé a intentar.');
    }
    const message = writeAuthMessage(id, action, issuedAt, contentHash(parts));
    const matches = await verifyMessage({
      address: artist.owner as Address,
      message,
      signature: signature as Hex,
    });
    if (!matches) throw new ForbiddenException('Solo el artista puede editar este perfil');
    try {
      await this.prisma.usedSignature.create({ data: { signature: signature.toLowerCase() } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('Esa firma ya se usó');
      }
      throw error;
    }
    return artist;
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
    cover: string | null;
    bio: string | null;
    bioWash: string | null;
    bioInk: string | null;
    nameFont: string | null;
    country: string | null;
    region: string | null;
    promoRank: number;
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

function asStrings(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return list.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 40));
}

function placeSponsored<T extends { patrocinado: boolean }>(items: T[]): T[] {
  const placed: T[] = [];
  const waiting: T[] = [];
  for (const item of items) {
    const block = Math.floor(placed.length / 8);
    const sponsoredInBlock = placed.slice(block * 8).filter((row) => row.patrocinado).length;
    if (item.patrocinado && sponsoredInBlock >= 1) waiting.push(item);
    else placed.push(item);
  }
  return [...placed, ...waiting];
}

function toReelSrc(id: number): string {
  return `/api/media/reels/${id}`;
}

function mediaKind(dataUrl: string): 'gif' | 'photo' {
  return dataUrl.startsWith('data:image/gif') ? 'gif' : 'photo';
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function contrastRatio(wash: string, ink: string): number {
  const luminance = (hex: string) => {
    const channels = [0, 2, 4].map((offset) => {
      const value = Number.parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const [r = 0, g = 0, b = 0] = channels;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const lighter = Math.max(luminance(wash), luminance(ink));
  const darker = Math.min(luminance(wash), luminance(ink));
  return (lighter + 0.05) / (darker + 0.05);
}

function asLinks(value: Prisma.JsonValue | null): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const links: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') links[key] = entry;
  }
  return Object.keys(links).length > 0 ? links : null;
}
