import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WatcherService implements OnModuleInit {
  private readonly logger = new Logger('WatcherService');
  private running = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.ENABLE_WATCHER === 'true') {
      this.start();
    }
  }

  private async start() {
    this.running = true;
    this.logger.log('Blockchain watcher started');

    while (this.running) {
      try {
        const chains = await this.prisma.chainConfig.findMany({ where: { enabled: true } });

        for (const chain of chains) {
          await this.processChain(chain.chain);
        }
      } catch (err) {
        this.logger.error('Watcher error', err);
      }

      // Poll interval
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  private async processChain(chain: string) {
    const checkpoint = await this.prisma.watcherCheckpoint.findUnique({ where: { chain } });
    if (!checkpoint) return;

    // TODO: Use chain adapter to scan blocks
    // 1. Get latest block from RPC
    // 2. Scan blocks currentBlock+1 to latestBlock for monitored addresses
    // 3. Upsert charge_payments for detected txs
    // 4. Update checkpoint
    this.logger.debug(`Scanning ${chain} from block ${checkpoint.current_block}`);
  }

  stop() {
    this.running = false;
  }
}
