import { Module } from '@nestjs/common';
import { WatcherService } from './watcher.service';

@Module({
  providers: [WatcherService],
})
export class BlockchainModule {}
