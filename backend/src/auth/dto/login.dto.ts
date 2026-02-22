import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class SignupDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  session_token: string;

  @IsString()
  code: string;
}

export class Verify2faDto {
  @IsString()
  session_token: string;

  @IsString()
  totp_code: string;
}

export class ResendEmailCodeDto {
  @IsString()
  session_token: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  new_password: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;
}
