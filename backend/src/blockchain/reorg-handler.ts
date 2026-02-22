import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReorgHandler {
  private readonly logger = new Logger('ReorgHandler');

  constructor(private prisma: PrismaService) {}

  async handleReorg(chain: string, reorgBlock: number) {
    this.logger.warn(`Reorg detected on ${chain} at block ${reorgBlock}`);

    // Mark affected payments as reorged
    await this.prisma.chargePayment.updateMany({
      where: { chain, block_number: { gte: reorgBlock } },
      data: { status: 'reorged' },
    });

    // Reset checkpoint to before reorg
    await this.prisma.watcherCheckpoint.update({
      where: { chain },
      data: { current_block: reorgBlock - 1 },
    });
  }
}
