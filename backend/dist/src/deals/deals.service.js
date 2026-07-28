"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const CLIENT_TRANSITIONS = {
    INQUIRY: ['NEGOTIATION', 'CANCELLED'],
    NEGOTIATION: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['AWAITING_PAYMENT', 'CANCELLED'],
    AWAITING_PAYMENT: ['CANCELLED'],
    PAID: ['DISPUTED'],
    RELEASED: [],
    DISPUTED: [],
    REFUNDED: [],
    CANCELLED: [],
};
const SYSTEM_TRANSITIONS = {
    AWAITING_PAYMENT: ['PAID'],
    PAID: ['RELEASED', 'REFUNDED'],
    DISPUTED: ['RELEASED', 'REFUNDED'],
};
let DealsService = class DealsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInquiry(buyerId, dto) {
        const listing = await this.prisma.listing.findFirst({
            where: { id: dto.listingId, status: 'ACTIVE', deletedAt: null },
        });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found or not active');
        if (listing.sellerId === buyerId) {
            throw new common_1.BadRequestException('Cannot open a deal on your own listing');
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
    async transition(dealId, actorId, toStage) {
        const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        if (actorId !== deal.buyerId && actorId !== deal.sellerId) {
            throw new common_1.ForbiddenException('Not a party to this deal');
        }
        const allowed = CLIENT_TRANSITIONS[deal.stage] ?? [];
        if (!allowed.includes(toStage)) {
            throw new common_1.BadRequestException(`Cannot move from ${deal.stage} to ${toStage}`);
        }
        return this.applyTransition(dealId, deal.stage, toStage, actorId);
    }
    async systemTransition(dealId, toStage, actorId = 'system') {
        const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        const allowed = SYSTEM_TRANSITIONS[deal.stage] ?? [];
        if (!allowed.includes(toStage)) {
            throw new common_1.BadRequestException(`System cannot move deal from ${deal.stage} to ${toStage}`);
        }
        return this.applyTransition(dealId, deal.stage, toStage, actorId);
    }
    async applyTransition(dealId, fromStage, toStage, actorId) {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.deal.update({
                where: { id: dealId },
                data: { stage: toStage },
            });
            await tx.dealEvent.create({
                data: { dealId, fromStage: fromStage, toStage: toStage, actorId },
            });
            return updated;
        });
    }
    async findForUser(userId) {
        return this.prisma.deal.findMany({
            where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
            include: { listing: { select: { id: true, title: true } }, events: true },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.DealsService = DealsService;
exports.DealsService = DealsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealsService);
//# sourceMappingURL=deals.service.js.map