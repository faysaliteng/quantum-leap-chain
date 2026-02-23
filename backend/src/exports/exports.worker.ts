import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Processor('export-jobs')
export class ExportsWorker extends WorkerHost {
  private readonly logger = new Logger('ExportsWorker');

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    const { exportId } = job.data;
    this.logger.log(`Processing export ${exportId}`);

    try {
      await this.prisma.dataExportJob.update({ where: { id: exportId }, data: { status: 'running' } });

      const exportJob = await this.prisma.dataExportJob.findUnique({ where: { id: exportId } });
      if (!exportJob) return;

      const exportDir = process.env.EXPORT_DIR || '/tmp/exports';
      if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

      const filePath = path.join(exportDir, `${exportId}.${exportJob.file_format}`);

      // Fetch data based on export kind
      const filters = (exportJob.filters as Record<string, any>) || {};
      const where: Record<string, any> = {};
      if (filters.from) where.created_at = { ...(where.created_at || {}), gte: new Date(filters.from) };
      if (filters.to) where.created_at = { ...(where.created_at || {}), lte: new Date(filters.to) };
      if (filters.status) where.status = filters.status;

      // Add merchant_id scope for merchant exports
      if (exportJob.scope === 'merchant' && exportJob.requested_by_user_id) {
        where.merchant_id = exportJob.requested_by_user_id;
      }

      let records: any[] = [];

      switch (exportJob.kind) {
        case 'charges':
          records = await this.prisma.charge.findMany({ where, orderBy: { created_at: 'desc' }, take: 50000 });
          break;
        case 'invoices':
          records = await this.prisma.invoice.findMany({ where, orderBy: { created_at: 'desc' }, take: 50000 });
          break;
        case 'transactions':
          records = await this.prisma.walletTransaction.findMany({
            where: exportJob.scope === 'merchant' ? { wallet: { merchant_id: exportJob.requested_by_user_id } } : {},
            orderBy: { created_at: 'desc' }, take: 50000,
          });
          break;
        case 'audit-log':
          records = await this.prisma.auditLog.findMany({ where: {}, orderBy: { created_at: 'desc' }, take: 50000 });
          break;
        case 'webhook-deliveries':
          records = await this.prisma.webhookDelivery.findMany({ where: {}, orderBy: { created_at: 'desc' }, take: 50000 });
          break;
        default:
          records = [];
      }

      // Format output
      let content: string;
      if (exportJob.file_format === 'json') {
        content = JSON.stringify(records, null, 2);
      } else {
        // CSV format
        if (records.length === 0) {
          content = '';
        } else {
          const headers = Object.keys(records[0]);
          const csvRows = records.map(r =>
            headers.map(h => {
              const val = r[h];
              const str = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
              return `"${str.replace(/"/g, '""')}"`;
            }).join(',')
          );
          content = [headers.join(','), ...csvRows].join('\n');
        }
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      this.logger.log(`Export ${exportId}: wrote ${records.length} records (${exportJob.kind})`);

      const stats = fs.statSync(filePath);
      await this.prisma.dataExportJob.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          file_path: filePath,
          size_bytes: stats.size,
          row_count: records.length,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (err) {
      this.logger.error(`Export ${exportId} failed`, err);
      await this.prisma.dataExportJob.update({
        where: { id: exportId },
        data: { status: 'failed', error_message: (err as Error).message },
      });
    }
  }
}
