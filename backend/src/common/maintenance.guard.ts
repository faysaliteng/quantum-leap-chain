import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { IS_PUBLIC_KEY } from './auth/decorators';

/**
 * Enforces maintenance mode and IP allowlist from security policies.
 * Caches policy for 60 seconds in Redis.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
  private readonly CACHE_KEY = 'security_policies:access';
  private readonly CACHE_TTL = 60;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    let policies: any;
    const cached = await this.redis.client.get(this.CACHE_KEY);
    if (cached) {
      policies = JSON.parse(cached);
    } else {
      const record = await this.prisma.securityPolicy.findFirst();
      policies = record?.config ? (record.config as any).access : null;
      if (policies) {
        await this.redis.client.set(this.CACHE_KEY, JSON.stringify(policies), 'EX', this.CACHE_TTL);
      }
    }

    if (!policies) return true;

    // Health endpoint always allowed
    if (req.originalUrl?.includes('/v1/health')) return true;

    // Maintenance mode
    if (policies.maintenance_mode) {
      const bypassIps: string[] = policies.bypass_ips || [];
      if (!bypassIps.includes(clientIp)) {
        throw new ServiceUnavailableException({
          error: { code: 'MAINTENANCE_MODE', message: 'Service is under maintenance' },
        });
      }
    }

    // IP allowlist
    if (policies.ip_allowlist_enabled && policies.ip_allowlist?.length > 0) {
      if (!policies.ip_allowlist.includes(clientIp)) {
        throw new ForbiddenException({
          error: { code: 'IP_BLOCKED', message: 'Your IP is not allowed' },
        });
      }
    }

    return true;
  }
}
