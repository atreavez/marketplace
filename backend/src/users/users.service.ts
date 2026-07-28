import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      // Never select passwordHash here — this method is the public-facing lookup.
      select: { id: true, displayName: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
