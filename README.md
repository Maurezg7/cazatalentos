# Cazatalentos

Cazatalentos es el registro de quién creyó primero. Este monorepo junta el proyecto del hackathon de Monad: contratos en Solidity, una aplicación web y una API.

## Instalación

```bash
pnpm install
```

Copiá `.env.example` a `.env` y completá los valores en tu máquina. Ese archivo no se sube al repositorio.

## Web

```bash
pnpm --filter @cazatalentos/web dev
```

## API

```bash
pnpm --filter @cazatalentos/api dev
```

## Contratos

```bash
cd contracts && forge test
```

## Documentación

La documentación del proyecto está en [`docs/`](docs/).
