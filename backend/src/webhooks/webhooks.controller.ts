import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.webhooksService.list(user.merchant_id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: { url: string; events: string[] }) {
    return this.webhooksService.create(user.merchant_id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.webhooksService.remove(user.merchant_id, id);
  }

  @Post(':id/test')
  test(@CurrentUser() user: any, @Param('id') id: string) {
    return this.webhooksService.test(user.merchant_id, id);
  }

  @Get(':id/deliveries')
  deliveries(@CurrentUser() user: any, @Param('id') id: string) {
    return this.webhooksService.deliveries(user.merchant_id, id);
  }
}
