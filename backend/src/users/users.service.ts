import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailVerificationService } from '../auth/email-verification.service';
import { LoginHistoryService } from '../auth/login-history.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailVerification: EmailVerificationService,
    private loginHistory: LoginHistoryService,
  ) {}

  async findPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      // Never select passwordHash here — this method is the public-facing lookup.
      select: { id: true, displayName: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // The authenticated caller's own full profile — still never returns
  // passwordHash or twoFactorSecret, but includes fields only the account
  // owner should see (email, verification status, 2FA status).
  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const data: { displayName?: string; email?: string; emailVerifiedAt?: null } = {};

    if (dto.displayName !== undefined) data.displayName = dto.displayName;

    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('That email is already in use');
      }
      data.email = dto.email;
      data.emailVerifiedAt = null; // changing email means the new address is unverified again
    }

    const user = await this.prisma.user.update({ where: { id }, data });

    if (dto.email !== undefined) {
      await this.emailVerification.requestVerification(user.id, user.email);
    }

    return this.findMe(id);
  }

  async updateAvatar(id: string, avatarUrl: string) {
    await this.prisma.user.update({ where: { id }, data: { avatarUrl } });
    return this.findMe(id);
  }

  async getLoginHistory(id: string) {
    return this.loginHistory.list(id);
  }
}
