import { Module, Global } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor, MetricsService } from './metrics.interceptor';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsInterceptor],
  exports: [MetricsService],
})
export class MetricsModule {}
