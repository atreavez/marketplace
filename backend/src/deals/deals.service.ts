import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/deal.dto';

// Slice-1 state machine. PAID/SHIPPING/etc. stages are added in the Payments slice,
// where the only way to reach PAID is a verified provider webhook — never a client PATCH.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  INQUIRY: ['NEGOTIATION', 'CANCELLED'],
  NEGOTIATION: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: [],
  CANCELLED: [],
};

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async createInquiry(buyerId: string, dto: CreateInquiryDto) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: dto.listingId, status: 'ACTIVE', deletedAt: null },
    });
    if (!listing) throw new NotFoundException('Listing not found or not active');
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Cannot open a deal on your own listing');
    }

    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          listingId: listing.id,
          buyerId,
          sellerId: listing.sellerId,
          message: dto.message,
          stage: 'INQUIRY',
        },
      });
      await tx.dealEvent.create({
        data: { dealId: deal.id, fromStage: null, toStage: 'INQUIRY', actorId: buyerId },
      });
      return deal;
    });
  }

  async transition(dealId: string, actorId: string, toStage: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');
    if (actorId !== deal.buyerId && actorId !== deal.sellerId) {
      throw new ForbiddenException('Not a party to this deal');
    }

    const allowed = ALLOWED_TRANSITIONS[deal.stage] ?? [];
    if (!allowed.includes(toStage)) {
      throw new BadRequestException(`Cannot move from ${deal.stage} to ${toStage}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id: dealId },
        data: { stage: toStage as any },
      });
      await tx.dealEvent.create({
        data: { dealId, fromStage: deal.stage, toStage: toStage as any, actorId },
      });
      return updated;
    });
  }

  async findForUser(userId: string) {
    return this.prisma.deal.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: { listing: { select: { id: true, title: true } }, events: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
