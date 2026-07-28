import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true is required so payment webhook handlers can verify Stripe/BTCPay
  // signatures against the exact bytes received — a JSON.stringify of the parsed
  // body will not reproduce the same signature and silently breaks verification.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());
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
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Universal Marketplace API — Slice 1')
    .setDescription('Auth, Listings, Search, Deal Inquiry')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API running on :${port} — docs at /api/docs`);
}
bootstrap();
