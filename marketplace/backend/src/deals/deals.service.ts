import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/deal.dto';

// Slice-2 state machine. Two separate transition tables on purpose:
// - CLIENT_TRANSITIONS: reachable via the authenticated PATCH endpoint (buyer/seller actions)
// - SYSTEM_TRANSITIONS: reachable only from server-side code that has independently
//   verified something external (a payment webhook, a moderator decision) — never
//   from a client request body. This is what stops "fake payment confirmed" fraud:
//   a client can ask to move ACCEPTED -> AWAITING_PAYMENT, but nothing in the client-facing
//   controller can ever set a deal to PAID.
const CLIENT_TRANSITIONS: Record<string, string[]> = {
  INQUIRY: ['NEGOTIATION', 'CANCELLED'],
  NEGOTIATION: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['CANCELLED'],
  PAID: ['DISPUTED'], // buyer/seller can raise a dispute; release/refund are system-only
  RELEASED: [],
  DISPUTED: [],
  REFUNDED: [],
  CANCELLED: [],
};

const SYSTEM_TRANSITIONS: Record<string, string[]> = {
  AWAITING_PAYMENT: ['PAID'],       // only from a verified payment webhook
  PAID: ['RELEASED', 'REFUNDED'],   // from auto-release timer, admin resolution, or refund webhook
  DISPUTED: ['RELEASED', 'REFUNDED'], // from admin dispute resolution only
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

  // Client-facing transition — buyer or seller only, restricted to CLIENT_TRANSITIONS.
  async transition(dealId: string, actorId: string, toStage: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');
    if (actorId !== deal.buyerId && actorId !== deal.sellerId) {
      throw new ForbiddenException('Not a party to this deal');
    }

    const allowed = CLIENT_TRANSITIONS[deal.stage] ?? [];
    if (!allowed.includes(toStage)) {
      throw new BadRequestException(`Cannot move from ${deal.stage} to ${toStage}`);
    }

    return this.applyTransition(dealId, deal.stage, toStage, actorId);
  }

  // System-only transition — called exclusively from verified webhook handlers
  // (PaymentsService) or admin/dispute-resolution code. No controller exposes this
  // directly to a client request body.
  async systemTransition(dealId: string, toStage: string, actorId = 'system') {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const allowed = SYSTEM_TRANSITIONS[deal.stage] ?? [];
    if (!allowed.includes(toStage)) {
      throw new BadRequestException(`System cannot move deal from ${deal.stage} to ${toStage}`);
    }

    return this.applyTransition(dealId, deal.stage, toStage, actorId);
  }

  private async applyTransition(dealId: string, fromStage: string, toStage: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id: dealId },
        data: { stage: toStage as any },
      });
      await tx.dealEvent.create({
        data: { dealId, fromStage: fromStage as any, toStage: toStage as any, actorId },
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
