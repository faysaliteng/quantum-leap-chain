import { Module, Global } from '@nestjs/common';
import { MarketService } from './market.service';

@Global()
@Module({
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
