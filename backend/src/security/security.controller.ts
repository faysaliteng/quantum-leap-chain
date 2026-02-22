import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { SecurityService } from './security.service';
import { CurrentUser } from '../common/auth/decorators';

@Controller('v1/security')
export class SecurityController {
  constructor(private securityService: SecurityService) {}

  @Get('settings')
  getSettings(@CurrentUser() user: any) {
    return this.securityService.getSettings(user.sub);
  }

  @Post('2fa/setup')
  setup2fa(@CurrentUser() user: any) {
    return this.securityService.setup2fa(user.sub);
  }

  @Post('2fa/enable')
  enable2fa(@CurrentUser() user: any, @Body() body: { totp_code: string }) {
    return this.securityService.enable2fa(user.sub, body.totp_code);
  }

  @Post('2fa/disable')
  disable2fa(@CurrentUser() user: any, @Body() body: { totp_code: string }) {
    return this.securityService.disable2fa(user.sub, body.totp_code);
  }

  @Put('email-verification')
  toggleEmailVerification(@CurrentUser() user: any, @Body() body: { enabled: boolean }) {
    return this.securityService.toggleEmailVerification(user.sub, body.enabled);
  }

  @Post('backup-codes')
  regenerateBackupCodes(@CurrentUser() user: any) {
    return this.securityService.regenerateBackupCodes(user.sub);
  }

  @Delete('sessions/:id')
  revokeSession(@Param('id') id: string) {
    return this.securityService.revokeSession(id);
  }

  @Delete('sessions')
  revokeAllSessions(@CurrentUser() user: any) {
    return this.securityService.revokeAllSessions(user.sub);
  }

  @Put('password')
  changePassword(@CurrentUser() user: any, @Body() body: { current_password: string; new_password: string }) {
    return this.securityService.changePassword(user.sub, body);
  }
}
