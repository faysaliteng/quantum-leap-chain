import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, merchantId: string, data: any) {
    return this.prisma.dataExportJob.create({
      data: {
        scope: 'merchant',
        requested_by_user_id: userId,
        merchant_id: merchantId,
        kind: data.kind,
        file_format: data.format || 'csv',
        filters: data.filters || {},
      },
    });
  }

  async list(userId: string, query: any) {
    const limit = parseInt(query.limit) || 20;
    const where = { requested_by_user_id: userId, scope: 'merchant' as const };
    const [data, total] = await Promise.all([
      this.prisma.dataExportJob.findMany({ where, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.dataExportJob.count({ where }),
    ]);
    return { data, total, page: 1, per_page: limit, total_pages: Math.ceil(total / limit) };
  }

  async get(userId: string, id: string) {
    const job = await this.prisma.dataExportJob.findFirst({ where: { id, requested_by_user_id: userId } });
    if (!job) throw new NotFoundException();
    return job;
  }

  async download(userId: string, id: string) {
    const job = await this.prisma.dataExportJob.findFirst({ where: { id, requested_by_user_id: userId } });
    if (!job || !job.file_path) throw new NotFoundException();
    return fs.createReadStream(job.file_path);
  }
}
