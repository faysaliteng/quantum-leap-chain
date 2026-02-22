import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  list(merchantId: string) {
    return this.prisma.walletConfig.findMany({ where: { merchant_id: merchantId }, orderBy: { created_at: 'desc' } });
  }

  add(merchantId: string, data: any) {
    return this.prisma.walletConfig.create({
      data: { merchant_id: merchantId, label: data.label, chain: data.chain, address: data.address, type: data.type },
    });
  }

  async remove(merchantId: string, id: string) {
    const wallet = await this.prisma.walletConfig.findFirst({ where: { id, merchant_id: merchantId } });
    if (!wallet) throw new NotFoundException();
    await this.prisma.walletConfig.delete({ where: { id } });
  }

  async transactions(merchantId: string, query: any) {
    const page = 1;
    const perPage = parseInt(query.per_page) || 20;
    const where: any = {};
    if (query.wallet_id) where.wallet_id = query.wallet_id;
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;

    // Filter by merchant's wallets
    const walletIds = await this.prisma.walletConfig.findMany({
      where: { merchant_id: merchantId },
      select: { id: true },
    });
    where.wallet_id = { in: walletIds.map((w) => w.id) };

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({ where, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }
}
