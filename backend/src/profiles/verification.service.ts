import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVerificationRequestDto } from './dto/verification.dto';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async request(userId: string, dto: CreateVerificationRequestDto) {
    const pending = await this.prisma.verificationRequest.findFirst({
      where: { userId, type: dto.type, status: 'PENDING' },
    });
    if (pending) {
      throw new BadRequestException(`A ${dto.type} verification request is already pending`);
    }

    const request = await this.prisma.verificationRequest.create({
      data: { userId, type: dto.type, notes: dto.notes, status: 'PENDING' },
    });

    await this.setDenormalizedStatus(userId, dto.type, 'PENDING');
    return request;
  }

  async listForUser(userId: string) {
    return this.prisma.verificationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Not exposed on any route yet — this is the operation a future admin
  // review module will call. Included now so the data model and the state
  // transition it implies are already correct, rather than bolted on later.
  async resolve(requestId: string, status: 'VERIFIED' | 'REJECTED', reviewedBy: string, notes?: string) {
    const request = await this.prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new BadRequestException('Verification request not found');

    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status, reviewedBy, reviewedAt: new Date(), notes: notes ?? request.notes },
    });
    await this.setDenormalizedStatus(request.userId, request.type, status);
  }

  private async setDenormalizedStatus(
    userId: string,
    type: 'IDENTITY' | 'SELLER' | 'BUSINESS',
    status: 'PENDING' | 'VERIFIED' | 'REJECTED',
  ) {
    // IDENTITY verification doesn't have its own denormalized field yet (no
    // dedicated identity-profile model exists) — SELLER and BUSINESS write
    // through to their respective profile rows for fast reads without a join.
    if (type === 'SELLER') {
      await this.prisma.sellerProfile.updateMany({
        where: { userId },
        data: { verificationStatus: status },
      });
    }
    if (type === 'BUSINESS') {
      const sellerProfile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
      if (sellerProfile) {
        await this.prisma.businessProfile.updateMany({
          where: { sellerProfileId: sellerProfile.id },
          data: { verificationStatus: status },
        });
      }
    }
  }
}
