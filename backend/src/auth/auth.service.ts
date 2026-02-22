import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import { authenticator } from 'otplib';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Check if email verification is needed
    if (user.email_verify_enabled) {
      const sessionToken = uuid();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.redis.client.set(`email_verify:${sessionToken}`, JSON.stringify({ userId: user.id, code }), 'EX', 600);
      this.logger.log(`Email verification code for ${email}: ${code}`);
      return { requires_email_verification: true, session_token: sessionToken };
    }

    // Check if 2FA is needed
    if (user.two_factor_enabled) {
      const sessionToken = uuid();
      await this.redis.client.set(`2fa:${sessionToken}`, user.id, 'EX', 600);
      return { requires_2fa: true, session_token: sessionToken };
    }

    return this.issueTokens(user);
  }

  async signup(name: string, email: string, password: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({ data: { name, email } });
      const user = await tx.user.create({
        data: { name, email, password: hash, merchant_id: merchant.id },
      });
      return user;
    });

    return this.issueTokens(result);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });
  }

  async verifyEmailCode(sessionToken: string, code: string) {
    const raw = await this.redis.client.get(`email_verify:${sessionToken}`);
    if (!raw) throw new UnauthorizedException('Session expired');

    const data = JSON.parse(raw);
    if (data.code !== code) throw new UnauthorizedException('Invalid verification code');

    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new UnauthorizedException();

    if (user.two_factor_enabled) {
      const newToken = uuid();
      await this.redis.client.set(`2fa:${newToken}`, user.id, 'EX', 600);
      await this.redis.client.del(`email_verify:${sessionToken}`);
      return { requires_2fa: true, session_token: newToken };
    }

    await this.redis.client.del(`email_verify:${sessionToken}`);
    return this.issueTokens(user);
  }

  async verify2fa(sessionToken: string, totpCode: string) {
    const userId = await this.redis.client.get(`2fa:${sessionToken}`);
    if (!userId) throw new UnauthorizedException('Session expired');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.two_factor_secret) throw new UnauthorizedException();

    // Verify TOTP code
    const valid = authenticator.verify({ token: totpCode, secret: user.two_factor_secret });
    if (!valid) {
      // Try backup codes
      let backupValid = false;
      for (let i = 0; i < user.backup_codes.length; i++) {
        try {
          if (await argon2.verify(user.backup_codes[i], totpCode)) {
            backupValid = true;
            const remaining = [...user.backup_codes];
            remaining.splice(i, 1);
            await this.prisma.user.update({ where: { id: userId }, data: { backup_codes: remaining } });
            break;
          }
        } catch { /* not a match */ }
      }
      if (!backupValid) throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.redis.client.del(`2fa:${sessionToken}`);
    return this.issueTokens(user);
  }

  async resendEmailCode(sessionToken: string) {
    const raw = await this.redis.client.get(`email_verify:${sessionToken}`);
    if (!raw) throw new UnauthorizedException('Session expired');

    const data = JSON.parse(raw);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.client.set(
      `email_verify:${sessionToken}`,
      JSON.stringify({ ...data, code }),
      'EX',
      600,
    );
    this.logger.log(`Resent email verification code: ${code}`);
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = uuid();
      await this.redis.client.set(`pwd_reset:${token}`, user.id, 'EX', 3600);
      this.logger.log(`Password reset token for ${email}: ${token}`);
    }
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redis.client.get(`pwd_reset:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired reset token');

    const hash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
    await this.redis.client.del(`pwd_reset:${token}`);
    return { ok: true };
  }

  async refreshToken(refreshToken: string) {
    // Find matching refresh token
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revoked: false, expires_at: { gt: new Date() } },
    });

    let matchedToken: any = null;
    for (const t of tokens) {
      try {
        if (await argon2.verify(t.token_hash, refreshToken)) {
          matchedToken = t;
          break;
        }
      } catch { /* not a match */ }
    }

    if (!matchedToken) {
      // Potential reuse attack — revoke entire family if token was already revoked
      const revokedTokens = await this.prisma.refreshToken.findMany({ where: { revoked: true } });
      for (const rt of revokedTokens) {
        try {
          if (await argon2.verify(rt.token_hash, refreshToken)) {
            // Reuse detected! Revoke entire family
            await this.prisma.refreshToken.updateMany({
              where: { family: rt.family },
              data: { revoked: true },
            });
            this.logger.warn(`Refresh token reuse detected for family ${rt.family}`);
            break;
          }
        } catch { /* not a match */ }
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({ where: { id: matchedToken.user_id } });
    if (!user) throw new UnauthorizedException();

    return this.issueTokens(user, matchedToken.family);
  }

  private async issueTokens(user: any, existingFamily?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      merchant_id: user.merchant_id,
    };

    const token = await this.jwt.signAsync(payload);

    const family = existingFamily || uuid();
    const refreshToken = uuid();
    const refreshHash = await argon2.hash(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: refreshHash,
        family,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        merchant_id: user.merchant_id,
      },
    };
  }
}
