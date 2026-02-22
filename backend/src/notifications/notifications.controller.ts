import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.notificationsService.list(user.sub, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: any) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.remove(user.sub, id);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Put('preferences')
  updatePreferences(@CurrentUser() user: any, @Body() body: any) {
    return this.notificationsService.updatePreferences(user.sub, body);
  }
}
