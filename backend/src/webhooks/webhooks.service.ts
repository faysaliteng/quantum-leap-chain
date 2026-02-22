import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  list(merchantId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { merchant_id: merchantId },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(merchantId: string, data: { url: string; events: string[] }) {
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    return this.prisma.webhookEndpoint.create({
      data: {
        merchant_id: merchantId,
        url: data.url,
        events: data.events,
        secret,
      },
    });
  }

  async remove(merchantId: string, id: string) {
    const wh = await this.prisma.webhookEndpoint.findFirst({ where: { id, merchant_id: merchantId } });
    if (!wh) throw new NotFoundException();
    await this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  async test(merchantId: string, id: string) {
    const wh = await this.prisma.webhookEndpoint.findFirst({ where: { id, merchant_id: merchantId } });
    if (!wh) throw new NotFoundException();
    // Dispatch a test webhook delivery
    await this.prisma.webhookDelivery.create({
      data: {
        webhook_id: id,
        event_type: 'charge.created',
        event_id: crypto.randomUUID(),
        payload: { test: true },
      },
    });
    return { ok: true };
  }

  deliveries(merchantId: string, webhookId: string) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhook_id: webhookId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  /**
   * Sign a webhook payload using HMAC-SHA256.
   */
  static sign(payload: string, secret: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${payload}`;
    return `sha256=${crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')}`;
  }
}
