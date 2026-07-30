import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedLocationDto, UpdateSavedLocationDto } from './dto/saved-location.dto';

@Injectable()
export class SavedLocationsService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.savedLocation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(userId: string, dto: CreateSavedLocationDto) {
    return this.prisma.savedLocation.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: UpdateSavedLocationDto) {
    await this.assertOwnership(userId, id);
    return this.prisma.savedLocation.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.savedLocation.delete({ where: { id } });
  }

  private async assertOwnership(userId: string, id: string) {
    const location = await this.prisma.savedLocation.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Saved location not found');
    if (location.userId !== userId) throw new ForbiddenException('Not your saved location');
  }
}
