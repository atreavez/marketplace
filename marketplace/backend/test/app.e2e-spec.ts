import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Requires DATABASE_URL and REDIS_URL to point at real (test) instances —
    // see README for `docker compose up -d` before running `npm run test:e2e`.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api', { exclude: ['health', 'health/live'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 when the process is up', () => {
    return request(app.getHttpServer()).get('/health/live').expect(200);
  });

  it('GET /health returns 200 when dependencies are reachable', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /api/docs-json serves the OpenAPI document', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect((res) => {
        if (!res.body.openapi) throw new Error('Expected an OpenAPI document');
      });
  });

  it('unauthenticated POST /api/v1/listings is rejected', () => {
    return request(app.getHttpServer())
      .post('/api/v1/listings')
      .send({ title: 'Test', description: 'Test' })
      .expect(401);
  });

  it('every response carries an X-Request-Id header', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect((res) => {
        if (!res.headers['x-request-id']) throw new Error('Missing X-Request-Id header');
      });
  });
});
