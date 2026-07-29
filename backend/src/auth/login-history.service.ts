import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface LoginAttemptContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LoginHistoryService {
  constructor(private prisma: PrismaService) {}

  async record(userId: string, success: boolean, reason: string, ctx: LoginAttemptContext) {
    await this.prisma.loginHistoryEntry.create({
      data: { userId, success, reason, ip: ctx.ip, userAgent: ctx.userAgent },
    });
  }

  async list(userId: string, take = 20) {
    return this.prisma.loginHistoryEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
