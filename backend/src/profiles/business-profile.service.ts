import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBusinessProfileDto } from './dto/business-profile.dto';

@Injectable()
export class BusinessProfileService {
  constructor(private prisma: PrismaService) {}

  async upsert(userId: string, dto: UpdateBusinessProfileDto) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!sellerProfile) {
      throw new BadRequestException(
        'Create a seller profile first — a business profile extends it, not the base account.',
      );
    }

    return this.prisma.businessProfile.upsert({
      where: { sellerProfileId: sellerProfile.id },
      create: { sellerProfileId: sellerProfile.id, ...dto },
      update: dto,
    });
  }

  async findByUserId(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!sellerProfile) return null;
    return this.prisma.businessProfile.findUnique({ where: { sellerProfileId: sellerProfile.id } });
  }
}
