import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Validates X-Edge-Signature header from Cloudflare Worker gateway.
 * Only enforced when EDGE_SECRET env var is set.
 * Signature format: "t=<timestamp>,v1=<hmac>"
 */
@Injectable()
export class EdgeSignatureGuard implements CanActivate {
  private readonly edgeSecret: string | undefined;
  private readonly maxAge = 300; // 5 minutes

  constructor(private config: ConfigService) {
    this.edgeSecret = this.config.get<string>('EDGE_SECRET');
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.edgeSecret) return true; // Not configured = dev mode, allow all

    const req = context.switchToHttp().getRequest();
    const sig = req.headers['x-edge-signature'];
    if (!sig) throw new ForbiddenException('Missing edge signature');

    const parts = sig.split(',');
    const timestamp = parts.find((p: string) => p.startsWith('t='))?.substring(2);
    const hash = parts.find((p: string) => p.startsWith('v1='))?.substring(3);

    if (!timestamp || !hash) throw new ForbiddenException('Invalid edge signature format');

    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (Math.abs(now - ts) > this.maxAge) throw new ForbiddenException('Edge signature expired');

    const expected = crypto
      .createHmac('sha256', this.edgeSecret)
      .update(`${timestamp}.${req.method}.${req.originalUrl}`)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'))) {
      throw new ForbiddenException('Invalid edge signature');
    }

    return true;
  }
}
