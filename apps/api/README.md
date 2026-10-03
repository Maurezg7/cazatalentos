# API

Indexa eventos del contrato, resuelve el perfil del artista y, en testnet, puede enviar un poco de MON para pruebas.

## Postgres local

Creá la base y el usuario (una sola vez):

```bash
sudo -u postgres psql -c "CREATE USER cazatalentos WITH PASSWORD 'devpassword';"
sudo -u postgres psql -c "CREATE DATABASE cazatalentos OWNER cazatalentos;"
```

Copiá `apps/api/.env.example` a `apps/api/.env` y completá los valores. Ese archivo no se sube al repositorio.

Prisma 7 no acepta `url` en `schema.prisma`. La conexión de migrate está en `prisma.config.ts` y el cliente usa `@prisma/adapter-pg`.

## Arranque

```bash
cd apps/api
pnpm install
pnpm prisma migrate dev --name init
pnpm prisma generate
pnpm dev
```

El servidor escucha en el puerto 3001.

## Pruebas rápidas

```bash
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/indexer/sync
curl http://localhost:3001/api/artists/1
curl "http://localhost:3001/api/artists/1/supporters?limit=50&offset=0"
```

El faucet (`POST /api/faucet/request`) responde 503 si `FAUCET_PRIVATE_KEY` está vacío. La clave es solo de testnet y no se loguea.
