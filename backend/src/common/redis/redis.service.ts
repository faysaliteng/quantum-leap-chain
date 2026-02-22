import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;
  private readonly logger = new Logger('Redis');

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>('redis.url') || 'redis://localhost:6379');
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
