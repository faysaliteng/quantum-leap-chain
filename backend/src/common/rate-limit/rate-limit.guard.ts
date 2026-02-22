import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rl:${ip}:${req.method}:${req.path}`;

    const allowed = await this.rateLimitService.check(key, 100, 60);
    if (!allowed) {
      throw new HttpException('Too many requests', 429);
    }
    return true;
  }
}
