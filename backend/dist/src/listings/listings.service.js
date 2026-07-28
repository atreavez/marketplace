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
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ListingsService = class ListingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(sellerId, dto) {
        return this.prisma.listing.create({
            data: {
                sellerId,
                title: dto.title,
                description: dto.description,
                price: dto.price,
                categoryId: dto.categoryId,
                customAttrs: dto.customAttrs ?? {},
                status: 'DRAFT',
            },
        });
    }
    async publish(id, sellerId) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing || listing.deletedAt)
            throw new common_1.NotFoundException('Listing not found');
        if (listing.sellerId !== sellerId)
            throw new common_1.ForbiddenException('Not your listing');
        return this.prisma.listing.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }
    async findOne(id) {
        const listing = await this.prisma.listing.findFirst({
            where: { id, deletedAt: null },
            include: { seller: { select: { id: true, displayName: true } }, category: true },
        });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        return listing;
    }
    async search(params) {
        const { q, categoryId, minPrice, maxPrice } = params;
        return this.prisma.listing.findMany({
            where: {
                status: 'ACTIVE',
                deletedAt: null,
                ...(categoryId ? { categoryId } : {}),
                ...(minPrice !== undefined || maxPrice !== undefined
                    ? { price: { gte: minPrice ?? undefined, lte: maxPrice ?? undefined } }
                    : {}),
                ...(q
                    ? {
                        OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { seller: { select: { id: true, displayName: true } } },
        });
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map