import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicProfileService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        email: true,
        createdAt: true,
        sellerProfile: { include: { businessProfile: true } },
        socialLinks: { where: { isPublic: true } },
        privacySettings: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Default to PUBLIC when no privacy row exists yet (matches the
    // schema's own default) rather than treating an unconfigured account as
    // private by accident.
    const visibility = user.privacySettings?.profileVisibility ?? 'PUBLIC';

    if (visibility === 'PRIVATE') {
      // Identity basics stay visible (same fields the pre-existing
      // GET /users/:id already exposes) — "private" hides the profile
      // *extras* this module adds, not the base account's existence.
      return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        memberSince: user.createdAt,
        visibility: 'PRIVATE' as const,
      };
    }

    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      memberSince: user.createdAt,
      visibility: 'PUBLIC' as const,
      ...(user.privacySettings?.showEmailPublicly ? { email: user.email } : {}),
      seller: user.sellerProfile
        ? {
            storeName: user.sellerProfile.storeName,
            bio: user.sellerProfile.bio,
            responseTimeHours: user.sellerProfile.responseTimeHours,
            ratingAvg: user.sellerProfile.ratingAvg,
            ratingCount: user.sellerProfile.ratingCount,
            verificationStatus: user.sellerProfile.verificationStatus,
            business: user.sellerProfile.businessProfile
              ? {
                  legalName: user.sellerProfile.businessProfile.legalName,
                  businessType: user.sellerProfile.businessProfile.businessType,
                  verificationStatus: user.sellerProfile.businessProfile.verificationStatus,
                }
              : null,
          }
        : null,
      socialLinks: user.socialLinks.map((l) => ({ platform: l.platform, url: l.url })),
    };
  }
}
