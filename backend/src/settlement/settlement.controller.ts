import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1')
export class SettlementController {
  constructor(private settlementService: SettlementService) {}

  @Get('settlement')
  getConfig(@CurrentUser() user: any) {
    return this.settlementService.getConfig(user.merchant_id);
  }

  @Put('settlement')
  updateConfig(@CurrentUser() user: any, @Body() body: any) {
    return this.settlementService.updateConfig(user.merchant_id, body);
  }

  @Get('sweeps')
  listSweeps(@CurrentUser() user: any) {
    return this.settlementService.listSweeps(user.merchant_id);
  }
}
