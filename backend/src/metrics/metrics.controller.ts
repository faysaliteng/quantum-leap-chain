import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/auth/decorators';
import { MetricsService } from './metrics.interceptor';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Public()
  @Get()
  getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(this.metricsService.serialize());
  }
}
