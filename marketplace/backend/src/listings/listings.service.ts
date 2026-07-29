import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, SearchListingsDto } from './dto/listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(sellerId: string, dto: CreateListingDto) {
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

  async publish(id: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.deletedAt) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not your listing');

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { seller: { select: { id: true, displayName: true } }, category: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  // Slice-1 search: Postgres full-text search (to_tsvector) over active listings.
  // This is the placeholder that gets replaced by OpenSearch + AI semantic search
  // in a later slice — same query shape, so the API contract doesn't need to change.
  async search(params: SearchListingsDto) {
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
}
