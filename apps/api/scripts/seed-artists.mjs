/**
 * Enrich on-chain artists + add catalog artists with photos, covers, bios, links and posts.
 * Usage: pnpm --filter @cazatalentos/api seed:artists
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const text = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  const line = text.split('\n').find((row) => row.startsWith('DATABASE_URL='));
  const value = line?.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  if (!value) throw new Error('DATABASE_URL is required');
  return value;
}

/** Static files shipped with the web app at apps/web/public/artists/. */
function artistPhoto(id) {
  return `/artists/${id}-photo.jpg`;
}
function artistCover(id) {
  return `/artists/${id}-cover.jpg`;
}

const PLACEHOLDER_OWNER = '0x00000000000000000000000000000000000000c1';

/** Keep on-chain artists 1–2; catalog showcase uses high ids to avoid indexer clashes. */
const CATALOG = [
  {
    id: 1,
    keepOwner: true,
    name: 'Los Copleros del Valle',
    metadataURI: 'Los Copleros del Valle',
    photo: artistPhoto(1),
    cover: artistCover(1),
    bio: 'Folklore del valle. Cantamos lo que el cerro guarda antes de que se llene la peña.',
    bioWash: '#1c2416',
    bioInk: '#dbe2ce',
    nameFont: 'display',
    country: 'AR',
    region: 'Salta Capital',
    promoRank: 10,
    links: {
      instagram: 'https://www.instagram.com/',
      youtube: 'https://www.youtube.com/',
      spotify: 'https://open.spotify.com/',
    },
    posts: [
      'Ensayo en la peña del barrio. Si llegás temprano, hay mate y coplas nuevas.',
      'Abrimos fecha en Salta Capital. El número de pionero lo sigue dando el contrato.',
    ],
  },
  {
    id: 2,
    keepOwner: true,
    name: 'Mauro',
    metadataURI: 'Mauro',
    photo: artistPhoto(2),
    cover: artistCover(2),
    bio: 'Canción nueva del NOA. Quien llegó primero ya tiene número en el contrato.',
    bioWash: '#241c16',
    bioInk: '#f0e2d0',
    nameFont: 'serif',
    country: 'AR',
    region: 'Cafayate',
    promoRank: 8,
    links: {
      instagram: 'https://www.instagram.com/',
      bandcamp: 'https://bandcamp.com/',
    },
    posts: [
      'Zamba nueva grabada con el viento del valle de fondo.',
      'Gracias a quienes ya dejaron su marca. El pozo sigue abierto a la meta.',
    ],
  },
  {
    id: 1001,
    name: 'Zamba Lunar',
    metadataURI: 'Zamba Lunar',
    photo: artistPhoto(1001),
    cover: artistCover(1001),
    bio: 'Zambas de luna llena entre Cafayate y el camino al cerro.',
    bioWash: '#1a1c28',
    bioInk: '#e8e4f5',
    nameFont: 'display',
    country: 'AR',
    region: 'Cafayate',
    promoRank: 7,
    supporterCount: 148,
    links: { instagram: 'https://www.instagram.com/', youtube: 'https://www.youtube.com/' },
    posts: ['Ensayo abierto este viernes. Traé tu termo.', 'Subimos el vivo de la peña lunar.'],
    openPool: {
      id: 1001,
      amountWei: '250000000000000000',
      milestoneDescription: 'Grabar el EP “Luna sobre el valle” en estudio local.',
      days: 21,
      supportersAtOpen: 40,
    },
  },
  {
    id: 1002,
    name: 'El Chango Nublado',
    metadataURI: 'El Chango Nublado',
    photo: artistPhoto(1002),
    cover: artistCover(1002),
    bio: 'Chacareras nubladas y bombo legüero en Cachi.',
    bioWash: '#221810',
    bioInk: '#f3e6d4',
    nameFont: 'sans',
    country: 'AR',
    region: 'Cachi',
    promoRank: 6,
    supporterCount: 87,
    links: { instagram: 'https://www.instagram.com/' },
    posts: ['Nueva chacarera: “Nube sobre el adobe”.', 'Buscamos pioneros para la gira de pueblos.'],
    openPool: {
      id: 1002,
      amountWei: '180000000000000000',
      milestoneDescription: 'Llevar el show a tres pueblos de la Quebrada.',
      days: 28,
      supportersAtOpen: 22,
    },
  },
  {
    id: 1003,
    name: 'Dúo Algarrobal',
    metadataURI: 'Dúo Algarrobal',
    photo: artistPhoto(1003),
    cover: artistCover(1003),
    bio: 'Dos voces, una guitarra y el algarrobo como testigo.',
    bioWash: '#1e2418',
    bioInk: '#e4ecd8',
    nameFont: 'serif',
    country: 'AR',
    region: 'Rosario de Lerma',
    promoRank: 5,
    supporterCount: 41,
    links: { spotify: 'https://open.spotify.com/', youtube: 'https://www.youtube.com/' },
    posts: ['Estrenamos “Algarrobo en flor” en la peña del pueblo.'],
    openPool: {
      id: 1003,
      amountWei: '90000000000000000',
      milestoneDescription: 'Prensar 300 vinilos del primer disco.',
      days: 35,
      supportersAtOpen: 15,
    },
  },
  {
    id: 1004,
    name: 'Mate Eléctrico',
    metadataURI: 'Mate Eléctrico',
    photo: artistPhoto(1004),
    cover: artistCover(1004),
    bio: 'Folklore con pedales. Mate amargo, distorsión dulce.',
    bioWash: '#1c1820',
    bioInk: '#f0e8ff',
    nameFont: 'display',
    country: 'AR',
    region: 'Salta Capital',
    promoRank: 4,
    supporterCount: 23,
    links: { instagram: 'https://www.instagram.com/', bandcamp: 'https://bandcamp.com/' },
    posts: ['Sesión en vivo con pedales y bombo. Clip subido.', 'Pozo abierto para el próximo single.'],
    openPool: {
      id: 1004,
      amountWei: '120000000000000000',
      milestoneDescription: 'Mezclar y masterizar el single “Yerba y voltaje”.',
      days: 18,
      supportersAtOpen: 10,
    },
  },
  {
    id: 1005,
    name: 'Las Voces del Cerro',
    metadataURI: 'Las Voces del Cerro',
    photo: artistPhoto(1005),
    cover: artistCover(1005),
    bio: 'Coro de peña. Voces que suben más alto que el cerro.',
    bioWash: '#182018',
    bioInk: '#e6f0e4',
    nameFont: 'serif',
    country: 'AR',
    region: 'Tilcara',
    promoRank: 3,
    supporterCount: 64,
    links: { youtube: 'https://www.youtube.com/' },
    posts: ['Ensayo general del ciclo “Cerro adentro”.', 'Sumamos dos voces nuevas del pueblo.'],
  },
  {
    id: 1006,
    name: 'Huayra Nueva',
    metadataURI: 'Huayra Nueva',
    photo: artistPhoto(1006),
    cover: artistCover(1006),
    bio: 'Viento nuevo desde Jujuy. Copla, electrónica suave y camino.',
    bioWash: '#201818',
    bioInk: '#f5e8dc',
    nameFont: 'sans',
    country: 'AR',
    region: 'San Salvador de Jujuy',
    promoRank: 2,
    supporterCount: 19,
    links: { instagram: 'https://www.instagram.com/', spotify: 'https://open.spotify.com/' },
    posts: ['Demo de “Huayra” disponible. Comentá cuál verso te queda.'],
    openPool: {
      id: 1006,
      amountWei: '75000000000000000',
      milestoneDescription: 'Rodar el videoclip en la Quebrada de Humahuaca.',
      days: 40,
      supportersAtOpen: 8,
    },
  },
];

async function main() {
  const databaseUrl = loadDatabaseUrl();
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  console.log('Seeding artist catalog…');

  // Clear previous showcase rows (high ids) and all posts so the seed is idempotent.
  await prisma.vote.deleteMany({ where: { poolId: { gte: 1000 } } });
  await prisma.pool.deleteMany({ where: { id: { gte: 1000 } } });
  await prisma.supporter.deleteMany({ where: { artistId: { gte: 1000 } } });
  await prisma.artistPost.deleteMany({});
  await prisma.artistReel.deleteMany({ where: { artistId: { gte: 1000 } } });
  await prisma.artist.deleteMany({ where: { id: { gte: 1000 } } });

  for (const row of CATALOG) {
    const existing = await prisma.artist.findUnique({ where: { id: row.id } });
    const owner = row.keepOwner && existing ? existing.owner : PLACEHOLDER_OWNER;
    const supporterCount =
      row.keepOwner && existing ? existing.supporterCount : (row.supporterCount ?? 0);

    await prisma.artist.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        owner,
        metadataURI: row.metadataURI,
        supporterCount,
        name: row.name,
        photo: row.photo,
        cover: row.cover,
        bio: row.bio,
        bioWash: row.bioWash,
        bioInk: row.bioInk,
        nameFont: row.nameFont,
        country: row.country,
        region: row.region,
        promoRank: row.promoRank,
        links: row.links,
      },
      update: {
        name: row.name,
        metadataURI: row.metadataURI,
        photo: row.photo,
        cover: row.cover,
        bio: row.bio,
        bioWash: row.bioWash,
        bioInk: row.bioInk,
        nameFont: row.nameFont,
        country: row.country,
        region: row.region,
        promoRank: row.promoRank,
        links: row.links,
        ...(row.keepOwner ? {} : { owner, supporterCount }),
      },
    });

    for (const body of row.posts ?? []) {
      await prisma.artistPost.create({
        data: {
          artistId: row.id,
          body,
          media: null,
          mediaKind: null,
        },
      });
    }

    if (row.openPool) {
      const deadline = new Date(Date.now() + row.openPool.days * 24 * 60 * 60 * 1000);
      await prisma.pool.upsert({
        where: { id: row.openPool.id },
        create: {
          id: row.openPool.id,
          artistId: row.id,
          amountWei: row.openPool.amountWei,
          milestoneHash: `0x${row.openPool.id.toString(16).padStart(64, '0')}`,
          deadline,
          voteEnd: null,
          supportersAtOpen: row.openPool.supportersAtOpen,
          totalWeightAtOpen: '0',
          status: 'Open',
          evidenceURI: null,
          milestoneDescription: row.openPool.milestoneDescription,
        },
        update: {
          artistId: row.id,
          amountWei: row.openPool.amountWei,
          deadline,
          status: 'Open',
          milestoneDescription: row.openPool.milestoneDescription,
          supportersAtOpen: row.openPool.supportersAtOpen,
        },
      });
    }

    console.log(`  ✓ ${row.id} ${row.name}`);
  }

  const artists = await prisma.artist.count();
  const posts = await prisma.artistPost.count();
  const openPools = await prisma.pool.count({ where: { status: 'Open' } });
  console.log(`Done. artists=${artists} posts=${posts} openPools=${openPools}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
