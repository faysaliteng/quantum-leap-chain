import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.walletsService.list(user.merchant_id);
  }

  @Post()
  add(@CurrentUser() user: any, @Body() body: any) {
    return this.walletsService.add(user.merchant_id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.walletsService.remove(user.merchant_id, id);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: any, @Query() query: any) {
    return this.walletsService.transactions(user.merchant_id, query);
  }
}
