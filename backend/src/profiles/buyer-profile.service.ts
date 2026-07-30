import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBuyerProfileDto } from './dto/buyer-profile.dto';

@Injectable()
export class BuyerProfileService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const existing = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.buyerProfile.create({ data: { userId } });
  }

  async update(userId: string, dto: UpdateBuyerProfileDto) {
    await this.getOrCreate(userId); // ensures a row exists before upsert-style update
    return this.prisma.buyerProfile.update({ where: { userId }, data: dto });
  }
}
