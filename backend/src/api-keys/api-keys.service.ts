import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async list(merchantId: string) {
    return this.prisma.apiKey.findMany({
      where: { merchant_id: merchantId, revoked: false },
      select: { id: true, merchant_id: true, name: true, prefix: true, scopes: true, last_used_at: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(merchantId: string, data: { name: string; scopes: string[] }) {
    const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = rawKey.substring(0, 10);
    const keyHash = await argon2.hash(rawKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        merchant_id: merchantId,
        name: data.name,
        prefix,
        key_hash: keyHash,
        scopes: data.scopes,
      },
    });

    return {
      id: apiKey.id,
      merchant_id: apiKey.merchant_id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      scopes: apiKey.scopes,
      created_at: apiKey.created_at,
      key: rawKey, // Only returned once
    };
  }

  async revoke(merchantId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, merchant_id: merchantId } });
    if (!key) throw new NotFoundException();
    await this.prisma.apiKey.update({ where: { id }, data: { revoked: true } });
  }
}
