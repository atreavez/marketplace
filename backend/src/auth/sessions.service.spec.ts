import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionsService — refresh token rotation & reuse detection', () => {
  let service: SessionsService;
  let store: Map<string, any>;
  let prisma: any;

  beforeEach(async () => {
    store = new Map();
    let counter = 0;

    prisma = {
      session: {
        create: jest.fn(async ({ data }: any) => {
          const id = `session-${++counter}`;
          const row = { id, revokedAt: null, previousTokenHash: null, ...data };
          store.set(id, row);
          return row;
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          if (where.id) return store.get(where.id) ?? null;
          if (where.refreshTokenHash) {
            return [...store.values()].find((r) => r.refreshTokenHash === where.refreshTokenHash) ?? null;
          }
          return null;
        }),
        findFirst: jest.fn(async ({ where }: any) => {
          return [...store.values()].find((r) => r.previousTokenHash === where.previousTokenHash) ?? null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = store.get(where.id);
          const updated = { ...row, ...data };
          store.set(where.id, updated);
          return updated;
        }),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SessionsService);
  });

  it('creates a session and returns a usable raw refresh token', async () => {
    const { session, rawToken } = await service.create('user-1', { ip: '1.2.3.4' });
    expect(session.userId).toBe('user-1');
    expect(rawToken).toEqual(expect.any(String));
  });

  it('rotates the refresh token on use, invalidating the old one', async () => {
    const { rawToken } = await service.create('user-1', {});
    const { rawToken: rotated } = await service.rotate(rawToken);

    expect(rotated).not.toEqual(rawToken);
    // The original token must no longer work — it's been rotated away.
    await expect(service.rotate(rawToken)).rejects.toThrow();
  });

  it('detects reuse of an already-rotated token and revokes the session', async () => {
    const { session, rawToken } = await service.create('user-1', {});
    const { rawToken: rotated } = await service.rotate(rawToken);

    // Simulate token theft: someone replays the original (now stale) token.
    await expect(service.rotate(rawToken)).rejects.toThrow(UnauthorizedException);

    // The legitimate, already-rotated token must now be dead too — the whole
    // session was killed defensively, not just the stale request denied.
    await expect(service.rotate(rotated)).rejects.toThrow(UnauthorizedException);
    expect(store.get(session.id).revokedAt).not.toBeNull();
  });

  it('rejects rotation of an unknown token', async () => {
    await expect(service.rotate('not-a-real-token')).rejects.toThrow(UnauthorizedException);
  });
});
