import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto';

@Injectable()
export class SocialLinksService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.socialLink.findMany({ where: { userId } });
  }

  create(userId: string, dto: CreateSocialLinkDto) {
    return this.prisma.socialLink.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: UpdateSocialLinkDto) {
    await this.assertOwnership(userId, id);
    return this.prisma.socialLink.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.socialLink.delete({ where: { id } });
  }

  private async assertOwnership(userId: string, id: string) {
    const link = await this.prisma.socialLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('Social link not found');
    if (link.userId !== userId) throw new ForbiddenException('Not your social link');
  }
}
