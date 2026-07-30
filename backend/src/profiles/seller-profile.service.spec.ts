import { Test, TestingModule } from '@nestjs/testing';
import { SellerProfileService } from './seller-profile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SellerProfileService — Module 2 role integration', () => {
  let service: SellerProfileService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      sellerProfile: {
        findUnique: jest.fn(),
        create: jest.fn(async ({ data }: any) => ({ id: 'sp-1', ...data })),
        update: jest.fn(async ({ where, data }: any) => ({ id: 'sp-1', userId: where.userId, ...data })),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SellerProfileService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SellerProfileService);
  });

  it('upgrades a BUYER to BOTH when they create their first seller profile', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'BUYER' });

    await service.getOrCreate('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'BOTH' },
    });
  });

  it('does not touch role if the user already registered as SELLER', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', role: 'SELLER' });

    await service.getOrCreate('user-2');

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not touch role if the user is already BOTH', async () => {
    prisma.sellerProfile.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-3', role: 'BOTH' });

    await service.getOrCreate('user-3');

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not re-create or touch role if a seller profile already exists', async () => {
    const existing = { id: 'sp-1', userId: 'user-4' };
    prisma.sellerProfile.findUnique.mockResolvedValue(existing);

    const result = await service.getOrCreate('user-4');

    expect(result).toBe(existing);
    expect(prisma.sellerProfile.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
