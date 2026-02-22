import { Controller, Post, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../common/auth/decorators';
import {
  LoginDto, SignupDto, VerifyEmailDto, Verify2faDto,
  ResendEmailCodeDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto,
} from './dto/login.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('signup')
  signup(@Body() body: SignupDto) {
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
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmailCode(body.session_token, body.code);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  verify2fa(@Body() body: Verify2faDto) {
    return this.authService.verify2fa(body.session_token, body.totp_code);
  }

  @Public()
  @Post('resend-email-code')
  @HttpCode(HttpStatus.OK)
  resendEmailCode(@Body() body: ResendEmailCodeDto) {
    return this.authService.resendEmailCode(body.session_token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.new_password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refresh_token);
  }
}
