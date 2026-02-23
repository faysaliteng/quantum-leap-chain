import { Module } from '@nestjs/common';
import { WatcherService } from './watcher.service';
import { ReorgHandler } from './reorg-handler';
import { BalanceSyncWorker } from './balance-sync.worker';

@Module({
  providers: [WatcherService, ReorgHandler, BalanceSyncWorker],
  exports: [WatcherService, ReorgHandler, BalanceSyncWorker],
})
export class BlockchainModule {}
