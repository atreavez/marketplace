import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  // rawBody: true is required so payment webhook handlers can verify Stripe/BTCPay
  // signatures against the exact bytes received — a JSON.stringify of the parsed
  // body will not reproduce the same signature and silently breaks verification.
  // bufferLogs holds early log lines until the Pino logger below takes over, so
  // nothing from bootstrap is lost or printed with Nest's default (non-JSON) logger.
  // NestExpressApplication (rather than the default) is needed for useStaticAssets below.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields — closes a common mass-assignment hole
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serves uploaded avatars (see users/avatar-upload.config.ts). Local disk
  // storage — see that file's comment for the production object-storage
  // swap path. Excluded from the API prefix/versioning like health checks,
  // since these are static files, not API resources.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // URI versioning with defaultVersion '1' + prefix 'api' reproduces the exact
  // same route surface as before (/api/v1/...) since no controller declares
  // its own @Controller({ version }) yet — this only adds the ability for a
  // future controller to opt into /api/v2/... without an app-wide migration.
  app.setGlobalPrefix('api', { exclude: ['health', 'health/live'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const config = new DocumentBuilder()
    .setTitle('Universal Marketplace API')
    .setDescription('Auth, Listings, Search, Deals, Payments (Stripe + BTCPay)')
    .setVersion('0.3')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Ensures Prisma's connection closes only after Nest's own shutdown sequence
  // (draining in-flight requests, closing other modules) completes — see the
  // comment on PrismaService.enableShutdownHooks for why this ordering matters.
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  app.get(Logger).log(`API running on :${port} — docs at /api/docs, health at /health`);
}
bootstrap();
