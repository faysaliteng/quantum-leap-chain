import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.dashboardService.getStats(user.merchant_id);
  }
}
