import { Controller, Get, Post, Param, Query, Body, Headers } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { CurrentUser } from '../common/auth/decorators';
import { CreateChargeDto } from './dto/create-charge.dto';

@Controller('v1/charges')
export class ChargesController {
  constructor(private chargesService: ChargesService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: CreateChargeDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.chargesService.create(user.merchant_id, body, idempotencyKey);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chargesService.findOne(user.merchant_id, id);
  }

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.chargesService.findAll(user.merchant_id, query);
  }

  @Get(':chargeId/transactions')
  getTransactions(@CurrentUser() user: any, @Param('chargeId') chargeId: string) {
    return this.chargesService.getTransactions(user.merchant_id, chargeId);
  }
}
