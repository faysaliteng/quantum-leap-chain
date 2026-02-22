import { Controller, Get } from '@nestjs/common';
import { Public, Roles, RequirePermissions } from '../common/auth/decorators';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Controller('v1/health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('system')
  @Roles('admin')
  @RequirePermissions('monitoring.view')
  async systemHealth() {
    const checks: Record<string, any> = {};

    // Database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch (e: any) {
      checks.database = { status: 'error', message: e.message };
    }

    // Redis
    try {
      const pong = await this.redis.client.ping();
      checks.redis = { status: pong === 'PONG' ? 'ok' : 'error' };
    } catch (e: any) {
      checks.redis = { status: 'error', message: e.message };
    }

    // Memory
    const mem = process.memoryUsage();
    checks.memory = {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    };

    // Watcher checkpoints
    const watchers = await this.prisma.watcherCheckpoint.findMany();
    checks.watchers = watchers;

    // Queues (summary from Redis)
    try {
      const webhookPending = await this.redis.client.llen('bull:webhook-dispatch:wait') || 0;
      const webhookFailed = await this.redis.client.llen('bull:webhook-dispatch:failed') || 0;
      checks.queues = { webhook: { pending: webhookPending, failed: webhookFailed } };
    } catch {
      checks.queues = { webhook: { pending: 0, failed: 0 } };
    }

    return {
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }
}
