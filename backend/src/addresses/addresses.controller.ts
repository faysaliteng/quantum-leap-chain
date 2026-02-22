import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/addresses')
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.addressesService.stats(user.merchant_id);
  }

  @Post('upload')
  upload(@CurrentUser() user: any, @Body() body: { chain: string; addresses: string[] }) {
    return this.addressesService.upload(user.merchant_id, body);
  }

  @Get()
  list(@CurrentUser() user: any, @Query('chain') chain?: string) {
    return this.addressesService.list(user.merchant_id, chain);
  }
}
