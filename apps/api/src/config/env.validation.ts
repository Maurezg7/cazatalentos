import { z } from 'zod';

const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  MONAD_RPC_URL: z.string().url(),
  MONAD_CHAIN_ID: z.coerce.number().int().positive().default(10143),
  CAZATALENTOS_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  INDEXER_START_BLOCK: z.coerce.number().int().nonnegative().default(0),
  INDEXER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(8000),
  INDEXER_CHUNK_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  INDEXER_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  FAUCET_PRIVATE_KEY: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/)
      .optional(),
  ),
  FAUCET_AMOUNT_WEI: z.string().regex(/^\d+$/).default('100000000000000000'),
  FAUCET_DAILY_LIMIT_PER_ADDRESS: z.coerce.number().int().positive().default(3),
  WEB_ORIGIN: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return { ...config, ...parsed.data };
}
