import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const rawEnv = validateEnv(process.env as Record<string, unknown>);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );
  app.enableCors({
    origin: [rawEnv.WEB_ORIGIN as string, 'http://localhost:5173'],
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
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
  console.error(error);
  process.exit(1);
});
