import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const perPage = parseInt(query.per_page) || 20;
    const where: any = { user_id: userId };
    if (query.category) where.category = query.category;
    if (query.read === 'true') where.read_at = { not: null };
    if (query.read === 'false') where.read_at = null;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { user_id: userId, read_at: null } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, user_id: userId }, data: { read_at: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { user_id: userId, read_at: null }, data: { read_at: new Date() } });
  }

  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, user_id: userId } });
  }

  async getPreferences(userId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({ where: { user_id: userId } });
    return pref || { user_id: userId, categories_enabled: ['system', 'charge', 'invoice', 'webhook', 'security', 'wallet', 'admin'], email_enabled: true };
  }

  async updatePreferences(userId: string, data: any) {
    return this.prisma.notificationPreference.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });
  }

  /** Helper to create a notification from other services */
  async create(userId: string, data: { type: string; category: string; title: string; body: string; data?: any }) {
    return this.prisma.notification.create({ data: { user_id: userId, ...data } });
  }
}
