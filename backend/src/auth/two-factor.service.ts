import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const BACKUP_CODE_COUNT = 10;

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  // Step 1: generate a secret and return it as a QR code (data URL) the user
  // scans with an authenticator app. Stored on the user record immediately
  // but twoFactorEnabled stays false until `enable` confirms the user can
  // actually produce valid codes with it — otherwise a typo'd scan could
  // permanently lock someone out.
  async setup(userId: string, email: string) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

    const otpauthUrl = authenticator.keyuri(email, 'B13', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  // Step 2: confirm the user's authenticator app actually produces valid
  // codes before flipping twoFactorEnabled on. Issues backup codes once,
  // shown to the user exactly this one time (only hashes are stored).
  async enable(userId: string, code: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Call /auth/2fa/setup first');
    }
    if (!authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      randomBytes(5).toString('hex'),
    );

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } }),
      this.prisma.twoFactorBackupCode.createMany({
        data: await Promise.all(
          backupCodes.map(async (code) => ({
            userId,
            codeHash: await argon2.hash(code),
          })),
        ),
      }),
    ]);

    return backupCodes;
  }

  async disable(userId: string, code: string) {
    const verified = await this.verifyCodeOrBackup(userId, code);
    if (!verified) throw new UnauthorizedException('Invalid authenticator or backup code');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      }),
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
    ]);
  }

  // Used both by /auth/2fa/verify (completing login) and /auth/2fa/disable.
  // Accepts either a live TOTP code or a single-use backup code.
  async verifyCodeOrBackup(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return false;

    if (authenticator.check(code, user.twoFactorSecret)) return true;

    const unusedBackupCodes = await this.prisma.twoFactorBackupCode.findMany({
      where: { userId, usedAt: null },
    });
    for (const backup of unusedBackupCodes) {
      if (await argon2.verify(backup.codeHash, code).catch(() => false)) {
        await this.prisma.twoFactorBackupCode.update({
          where: { id: backup.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }
}
