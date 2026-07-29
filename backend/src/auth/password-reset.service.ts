import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer/mailer.service';
import { SessionsService } from './sessions.service';
import { generateOpaqueToken, hashToken } from './tokens.util';
import { ARGON2ID_OPTIONS } from './password.util';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour — shorter than email verification since this grants account access

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
    private sessions: SessionsService,
  ) {}

  // Always resolves the same way whether or not the email exists — the
  // caller (AuthService) returns an identical response either way, so an
  // attacker can't use this endpoint to enumerate registered emails.
  async requestReset(email: string, requestIp?: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const token = generateOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        requestIp,
      },
    });
    await this.mailer.sendPasswordResetEmail(email, token);
    return token; // returned only so AuthService can expose it in non-prod responses for local testing
  }

  async confirmReset(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword, ARGON2ID_OPTIONS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
    ]);

    // A password reset is almost always triggered by "I think someone else
    // has my password" — force every device to re-authenticate, not just
    // the one completing the reset.
    await this.sessions.revokeAll(record.userId);
  }
}
