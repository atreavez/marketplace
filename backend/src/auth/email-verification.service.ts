import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer/mailer.service';
import { generateOpaqueToken, hashToken } from './tokens.util';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}

  async requestVerification(userId: string, email: string) {
    const token = generateOpaqueToken();
    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });
    await this.mailer.sendVerificationEmail(email, token);
    return token; // returned only so AuthService can expose it in non-prod responses for local testing
  }

  async confirm(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
  }
}
