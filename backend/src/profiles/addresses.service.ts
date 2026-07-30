import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.clearExistingDefault(userId);
    }
    return this.prisma.address.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.assertOwnership(userId, id);
    if (dto.isDefault) {
      await this.clearExistingDefault(userId);
    }
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.address.delete({ where: { id } });
  }

  // Prisma doesn't enforce "at most one true per user" at the schema level
  // (that needs a partial unique index Prisma can't express directly), so
  // it's enforced here: setting a new default always clears any existing one
  // first, inside the same logical operation.
  private async clearExistingDefault(userId: string) {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private async assertOwnership(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Not your address');
  }
}
