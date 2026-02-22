import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.invoicesService.list(user.merchant_id, query);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.findOne(user.merchant_id, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.invoicesService.create(user.merchant_id, body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.invoicesService.update(user.merchant_id, id, body);
  }

  @Post(':id/send')
  send(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.send(user.merchant_id, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.cancel(user.merchant_id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.remove(user.merchant_id, id);
  }

  @Get(':id/pdf')
  downloadPdf(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.generatePdf(user.merchant_id, id);
  }
}
