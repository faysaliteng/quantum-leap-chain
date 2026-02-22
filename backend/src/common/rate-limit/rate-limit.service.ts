import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger('RateLimit');

  constructor(private redis: RedisService) {}

  /**
   * Check rate limit for a given key.
   * Returns true if allowed, false if rate-limited.
   */
  async check(key: string, limit: number, windowSec: number): Promise<boolean> {
    const current = await this.redis.client.incr(key);
    if (current === 1) {
      await this.redis.client.expire(key, windowSec);
    }
    return current <= limit;
  }
}
