import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(merchantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCharges, pendingPayments, confirmedToday, wallets] = await Promise.all([
      this.prisma.charge.count({ where: { merchant_id: merchantId } }),
      this.prisma.charge.count({ where: { merchant_id: merchantId, status: 'PENDING' } }),
      this.prisma.charge.count({
        where: { merchant_id: merchantId, status: 'CONFIRMED', updated_at: { gte: today } },
      }),
      this.prisma.walletConfig.findMany({
        where: { merchant_id: merchantId, status: 'active' },
        select: { balance_usd: true },
      }),
    ]);

    // Compute real total volume from confirmed charge payments
    const volumeAgg = await this.prisma.chargePayment.aggregate({
      _sum: { value_usd: true },
      where: { charge: { merchant_id: merchantId, status: 'CONFIRMED' } },
    });
    const totalVolumeUsd = volumeAgg._sum.value_usd ?? 0;

    // Total wallet balance
    const totalBalanceUsd = wallets.reduce((sum, w) => sum + (w.balance_usd ?? 0), 0);

    return {
      total_charges: totalCharges,
      pending_payments: pendingPayments,
      confirmed_today: confirmedToday,
      total_volume_usd: totalVolumeUsd.toFixed(2),
      total_balance_usd: totalBalanceUsd.toFixed(2),
    };
  }
}
