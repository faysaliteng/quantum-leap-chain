import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ChargesService {
  constructor(private prisma: PrismaService) {}

  async create(merchantId: string, data: any, idempotencyKey?: string) {
    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) return existing.response;
    }

    const charge = await this.prisma.charge.create({
      data: {
        merchant_id: merchantId,
        name: data.name,
        description: data.description,
        pricing_type: data.pricing_type,
        local_amount: data.local_price?.amount,
        local_currency: data.local_price?.currency,
        crypto_chain: data.requested_crypto?.chain,
        crypto_asset: data.requested_crypto?.asset,
        crypto_amount: data.requested_crypto?.amount,
        hosted_url: `/checkout/${uuid()}`,
        expires_at: new Date(Date.now() + (data.expires_in_minutes || 60) * 60 * 1000),
        metadata: data.metadata,
        redirect_url: data.redirect_url,
        cancel_url: data.cancel_url,
        idempotency_key: idempotencyKey,
        status: 'NEW',
      },
    });

    // Store idempotency key
    if (idempotencyKey) {
      await this.prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          response: charge as any,
          status: 201,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    return this.formatCharge(charge);
  }

  async findOne(merchantId: string, id: string) {
    const charge = await this.prisma.charge.findFirst({
      where: { id, merchant_id: merchantId },
      include: { payment_addresses: true },
    });
    if (!charge) throw new NotFoundException('Charge not found');
    return this.formatCharge(charge);
  }

  async findAll(merchantId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const perPage = parseInt(query.per_page) || 20;
    const where: any = { merchant_id: merchantId };
    if (query.status) where.status = query.status;
    if (query.from) where.created_at = { gte: new Date(query.from) };
    if (query.to) where.created_at = { ...where.created_at, lte: new Date(query.to) };

    const [data, total] = await Promise.all([
      this.prisma.charge.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.charge.count({ where }),
    ]);

    return {
      data: data.map((c) => this.formatCharge(c)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };
  }

  async getTransactions(merchantId: string, chargeId: string) {
    const charge = await this.prisma.charge.findFirst({
      where: { id: chargeId, merchant_id: merchantId },
    });
    if (!charge) throw new NotFoundException('Charge not found');

    return this.prisma.chargePayment.findMany({
      where: { charge_id: chargeId },
      orderBy: { created_at: 'desc' },
    });
  }

  private formatCharge(charge: any) {
    const addresses: Record<string, any> = {};
    if (charge.payment_addresses) {
      for (const pa of charge.payment_addresses) {
        addresses[`${pa.chain}_${pa.asset}`] = {
          chain: pa.chain,
          asset: pa.asset,
          address: pa.address,
          amount: pa.amount,
        };
      }
    }
    return {
      id: charge.id,
      merchant_id: charge.merchant_id,
      name: charge.name,
      description: charge.description,
      pricing_type: charge.pricing_type,
      local_price: charge.local_amount ? { amount: charge.local_amount, currency: charge.local_currency } : undefined,
      requested_crypto: charge.crypto_chain ? { chain: charge.crypto_chain, asset: charge.crypto_asset, amount: charge.crypto_amount } : undefined,
      status: charge.status,
      addresses,
      hosted_url: charge.hosted_url,
      expires_at: charge.expires_at.toISOString(),
      metadata: charge.metadata,
      redirect_url: charge.redirect_url,
      cancel_url: charge.cancel_url,
      created_at: charge.created_at.toISOString(),
      updated_at: charge.updated_at.toISOString(),
    };
  }
}
