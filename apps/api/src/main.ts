import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const rawEnv = validateEnv(process.env as Record<string, unknown>);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 12 * 1024 * 1024 }),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  const webOrigins = [
    ...String(rawEnv.WEB_ORIGIN)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  app.enableCors({
    origin: [...new Set(webOrigins)],
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-request-id', 'x-indexer-secret'],
    exposedHeaders: ['x-request-id'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(rawEnv.PORT as number, '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
