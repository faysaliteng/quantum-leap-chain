import { Module } from '@nestjs/common';
import { WatcherService } from './watcher.service';
import { ReorgHandler } from './reorg-handler';

@Module({
  providers: [WatcherService, ReorgHandler],
  exports: [WatcherService, ReorgHandler],
})
export class BlockchainModule {}
