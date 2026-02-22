import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/auth/decorators';

@Controller('v1/health')
export class HealthController {
  private readonly startTime = Date.now();

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
