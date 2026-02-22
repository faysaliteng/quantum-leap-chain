import { Controller, Post, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../common/auth/decorators';

@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('signup')
  signup(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.signup(body.name, body.email, body.password);
  }

  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.sub);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: { session_token: string; code: string }) {
    return this.authService.verifyEmailCode(body.session_token, body.code);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  verify2fa(@Body() body: { session_token: string; totp_code: string }) {
    return this.authService.verify2fa(body.session_token, body.totp_code);
  }

  @Public()
  @Post('resend-email-code')
  @HttpCode(HttpStatus.OK)
  resendEmailCode(@Body() body: { session_token: string }) {
    return this.authService.resendEmailCode(body.session_token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: { token: string; new_password: string }) {
    return this.authService.resetPassword(body.token, body.new_password);
  }
}
