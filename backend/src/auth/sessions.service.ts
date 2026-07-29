import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateOpaqueToken, hashToken } from './tokens.util';

interface DeviceContext {
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches the previous stateless refresh token's lifetime

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  // Creates a new device session and returns the raw refresh token — the raw
  // value is only ever available at creation/rotation time, never stored or
  // retrievable again (only its hash is kept).
  async create(userId: string, ctx: DeviceContext) {
    const rawToken = generateOpaqueToken();
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashToken(rawToken),
        deviceLabel: ctx.deviceLabel,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return { session, rawToken };
  }

  // Validates and rotates a refresh token in one step. Returns the new raw
  // token for the same session (device identity persists across rotation —
  // this is what makes "list my devices" show one stable entry per device
  // instead of a new one every 15 minutes).
  async rotate(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: tokenHash } });

    if (session) {
      if (session.revokedAt || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired or revoked');
      }
      const newRawToken = generateOpaqueToken();
      const updated = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: hashToken(newRawToken),
          previousTokenHash: tokenHash,
          lastUsedAt: new Date(),
        },
      });
      return { session: updated, rawToken: newRawToken };
    }

    // Not the current token for any session — check whether it's a
    // previously-rotated-away token being replayed. That's a strong signal
    // the refresh token was stolen and both the thief and the legitimate
    // client are now racing to use it, so the defensive move is to kill the
    // whole session rather than just deny this one request.
    const reused = await this.prisma.session.findFirst({ where: { previousTokenHash: tokenHash } });
    if (reused && !reused.revokedAt) {
      await this.prisma.session.update({ where: { id: reused.id }, data: { revokedAt: new Date() } });
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  async revoke(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async revokeAll(userId: string, exceptSessionId?: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByRawToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async listActive(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceLabel: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
  }

  async isActive(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    return !!session && !session.revokedAt && session.expiresAt > new Date();
  }
}
