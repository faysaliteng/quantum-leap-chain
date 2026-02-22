import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const sessions = await this.prisma.refreshToken.findMany({
      where: { user_id: userId, revoked: false, expires_at: { gt: new Date() } },
      orderBy: { created_at: 'desc' },
    });

    return {
      two_factor_enabled: user.two_factor_enabled,
      email_verification_enabled: user.email_verify_enabled,
      active_sessions: sessions.map((s) => ({
        id: s.id,
        device: 'Unknown',
        ip_address: '',
        last_active: s.created_at.toISOString(),
      })),
      backup_codes_remaining: user.backup_codes?.length || 0,
    };
  }

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.two_factor_enabled) throw new BadRequestException('2FA is already enabled');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Cryptoniumpay', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not yet enabled)
    await this.prisma.user.update({
      where: { id: userId },
      data: { two_factor_secret: secret },
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    const hashedCodes = await Promise.all(backupCodes.map((c) => argon2.hash(c)));
    await this.prisma.user.update({
      where: { id: userId },
      data: { backup_codes: hashedCodes },
    });

    return {
      secret,
      otpauth_url: otpauthUrl,
      qr_code_data_url: qrCodeDataUrl,
      backup_codes: backupCodes,
    };
  }

  async enable2fa(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.two_factor_secret) throw new BadRequestException('Run 2FA setup first');

    const valid = authenticator.verify({ token: totpCode, secret: user.two_factor_secret });
    if (!valid) throw new UnauthorizedException('Invalid TOTP code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { two_factor_enabled: true },
    });
    return { ok: true };
  }

  async disable2fa(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.two_factor_secret) throw new BadRequestException('2FA is not enabled');

    const valid = authenticator.verify({ token: totpCode, secret: user.two_factor_secret });
    if (!valid) throw new UnauthorizedException('Invalid TOTP code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { two_factor_enabled: false, two_factor_secret: null, backup_codes: [] },
    });
    return { ok: true };
  }

  async toggleEmailVerification(userId: string, enabled: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { email_verify_enabled: enabled },
    });
    return { ok: true };
  }

  async regenerateBackupCodes(userId: string) {
    const codes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    const hashed = await Promise.all(codes.map((c) => argon2.hash(c)));
    await this.prisma.user.update({
      where: { id: userId },
      data: { backup_codes: hashed },
    });
    return { backup_codes: codes };
  }

  async revokeSession(id: string) {
    await this.prisma.refreshToken.update({ where: { id }, data: { revoked: true } });
    return { ok: true };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });
    return { ok: true };
  }

  async changePassword(userId: string, data: { current_password: string; new_password: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await argon2.verify(user.password, data.current_password);
    if (!valid) throw new UnauthorizedException('Invalid current password');

    if (data.new_password.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const hash = await argon2.hash(data.new_password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });

    // Revoke all sessions to force re-login
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });

    return { ok: true };
  }
}
