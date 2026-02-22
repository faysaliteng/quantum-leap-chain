import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(merchantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCharges, pendingPayments, confirmedToday] = await Promise.all([
      this.prisma.charge.count({ where: { merchant_id: merchantId } }),
      this.prisma.charge.count({ where: { merchant_id: merchantId, status: 'PENDING' } }),
      this.prisma.charge.count({
        where: { merchant_id: merchantId, status: 'CONFIRMED', updated_at: { gte: today } },
      }),
    ]);

    return {
      total_charges: totalCharges,
      pending_payments: pendingPayments,
      confirmed_today: confirmedToday,
      total_volume_usd: '0',
    };
  }
}
