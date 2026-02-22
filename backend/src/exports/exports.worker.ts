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

      // TODO: Generate actual export based on exportJob.kind
      fs.writeFileSync(filePath, '[]');

      const stats = fs.statSync(filePath);
      await this.prisma.dataExportJob.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          file_path: filePath,
          size_bytes: stats.size,
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
