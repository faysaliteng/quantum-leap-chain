import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SettlementService {
  constructor(private prisma: PrismaService) {}

  getConfig(merchantId: string) {
    return this.prisma.settlementConfig.findMany({ where: { merchant_id: merchantId } });
  }

  async updateConfig(merchantId: string, data: any) {
    await this.prisma.settlementConfig.upsert({
      where: { merchant_id_chain_asset: { merchant_id: merchantId, chain: data.chain, asset: data.asset } },
      create: { merchant_id: merchantId, ...data },
      update: data,
    });
  }

  listSweeps(merchantId: string) {
    return this.prisma.sweep.findMany({
      where: { charge: { merchant_id: merchantId } },
      orderBy: { created_at: 'desc' },
    });
  }
}
