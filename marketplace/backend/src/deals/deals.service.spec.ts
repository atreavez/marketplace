import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DealsService — state machine', () => {
  let service: DealsService;
  let prisma: {
    deal: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      deal: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(async (cb) =>
        cb({
          deal: { update: jest.fn((args) => ({ id: 'deal-1', stage: args.data.stage })) },
          dealEvent: { create: jest.fn() },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DealsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DealsService);
  });

  describe('transition (client-facing)', () => {
    it('allows INQUIRY -> NEGOTIATION for a party to the deal', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        stage: 'INQUIRY',
      });

      const result = await service.transition('deal-1', 'buyer-1', 'NEGOTIATION');
      expect(result.stage).toBe('NEGOTIATION');
    });

    it('rejects a transition not in the client transition table', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        stage: 'INQUIRY',
      });

      await expect(service.transition('deal-1', 'buyer-1', 'PAID')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a transition from someone who is not a party to the deal', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        stage: 'INQUIRY',
      });

      await expect(service.transition('deal-1', 'stranger', 'NEGOTIATION')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('never allows a client transition directly to PAID — this is the core fraud guard', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        stage: 'AWAITING_PAYMENT',
      });

      await expect(service.transition('deal-1', 'buyer-1', 'PAID')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('systemTransition (webhook-only)', () => {
    it('allows AWAITING_PAYMENT -> PAID (the only legitimate path to PAID)', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        stage: 'AWAITING_PAYMENT',
      });

      const result = await service.systemTransition('deal-1', 'PAID', 'webhook:stripe');
      expect(result.stage).toBe('PAID');
    });

    it('rejects a system transition not in the system transition table', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        stage: 'INQUIRY',
      });

      await expect(service.systemTransition('deal-1', 'PAID')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
