import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  // ── Core CRUD ──
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

  // ── Portfolio & Assets ──
  @Get('portfolio')
  portfolio(@CurrentUser() user: any) {
    return this.walletsService.portfolio(user.merchant_id);
  }

  @Get('assets')
  assets(@CurrentUser() user: any) {
    return this.walletsService.assets(user.merchant_id);
  }

  // ── Deposit ──
  @Get('deposit/:chain')
  depositInfo(@CurrentUser() user: any, @Param('chain') chain: string) {
    return this.walletsService.depositInfo(user.merchant_id, chain);
  }

  // ── Send / Withdraw ──
  @Post(':id/send')
  send(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.walletsService.send(user.merchant_id, id, body);
  }

  @Post(':id/estimate-fee')
  estimateFee(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    const wallet = { chain: '' }; // Will be resolved in service
    return this.walletsService.estimateFee(id, body.chain || 'eth', body);
  }

  // ── Swap / Convert ──
  @Post('swap/quote')
  swapQuote(@CurrentUser() user: any, @Body() body: any) {
    return this.walletsService.swapQuote(user.merchant_id, body);
  }

  @Post('swap/execute')
  swapExecute(@CurrentUser() user: any, @Body() body: any) {
    return this.walletsService.swapExecute(user.merchant_id, body);
  }

  @Get('swap/history')
  swapHistory(@CurrentUser() user: any, @Query() query: any) {
    return this.walletsService.swapHistory(user.merchant_id, query);
  }

  // ── Market Data ──
  @Get('market')
  market() {
    return this.walletsService.market_tickers();
  }

  @Get('orderbook/:pair')
  orderBook(@Param('pair') pair: string) {
    return this.walletsService.orderBook(pair);
  }

  // ── Transactions ──
  @Get('transactions')
  transactions(@CurrentUser() user: any, @Query() query: any) {
    return this.walletsService.transactions(user.merchant_id, query);
  }
}
