import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async stats(merchantId: string) {
    const addresses = await this.prisma.depositAddress.groupBy({
      by: ['chain', 'status'],
      where: { merchant_id: merchantId },
      _count: true,
    });

    const statsMap: Record<string, any> = {};
    for (const a of addresses) {
      if (!statsMap[a.chain]) statsMap[a.chain] = { chain: a.chain, available: 0, allocated: 0, exhausted: 0, total: 0 };
      statsMap[a.chain][a.status] = a._count;
      statsMap[a.chain].total += a._count;
    }
    return Object.values(statsMap);
  }

  async upload(merchantId: string, data: { chain: string; addresses: string[] }) {
    await this.prisma.depositAddress.createMany({
      data: data.addresses.map((address) => ({
        merchant_id: merchantId,
        chain: data.chain,
        address,
      })),
      skipDuplicates: true,
    });
  }

  list(merchantId: string, chain?: string) {
    return this.prisma.depositAddress.findMany({
      where: { merchant_id: merchantId, ...(chain ? { chain } : {}) },
      orderBy: { created_at: 'desc' },
    });
  }
}
