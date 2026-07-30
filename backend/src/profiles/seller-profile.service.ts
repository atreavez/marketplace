import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSellerProfileDto } from './dto/seller-profile.dto';

@Injectable()
export class SellerProfileService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (existing) return existing;

    // Integration point with Module 2's identity model: becoming a seller
    // for the first time upgrades role BUYER -> BOTH so existing
    // role-based logic elsewhere (RBAC, future seller-only features) sees
    // this account as a seller without a separate manual "switch role" step.
    // A user who registered directly as SELLER or already has BOTH is left
    // as-is — this only ever widens access, never narrows it.
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.create({ data: { userId } });
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user?.role === 'BUYER') {
        await tx.user.update({ where: { id: userId }, data: { role: 'BOTH' } });
      }
      return profile;
    });
  }

  async update(userId: string, dto: UpdateSellerProfileDto) {
    await this.getOrCreate(userId);
    return this.prisma.sellerProfile.update({ where: { userId }, data: dto });
  }

  async findByUserId(userId: string) {
    return this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { businessProfile: true },
    });
  }
}
