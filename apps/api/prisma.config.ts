import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const text = readFileSync(resolve(__dirname, '.env'), 'utf8');
  const line = text.split('\n').find((row) => row.startsWith('DATABASE_URL='));
  const value = line?.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  if (!value) {
    throw new Error('DATABASE_URL is required');
  }
  return value;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl(),
  },
});
