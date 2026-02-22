import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

const DEFAULT_POLICIES = {
  password: { min_length: 8, require_uppercase: true, require_number: true, require_symbol: true, history_count: 5, expiry_days: 90 },
  session: { access_token_ttl_minutes: 15, refresh_token_ttl_days: 7, max_sessions: 5, mandatory_2fa_admin: true, idle_timeout_minutes: 30 },
  access: { maintenance_mode: false, bypass_ips: [], ip_allowlist_enabled: false, ip_allowlist: [], geo_block_enabled: false, geo_blocked_countries: [] },
  rate_limit: { public_rpm: 60, auth_rpm: 10, merchant_api_rpm: 200, webhook_delivery_rpm: 100 },
};

@Injectable()
export class SecurityPoliciesService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const record = await this.prisma.securityPolicy.findFirst();
    return record ? record.config : DEFAULT_POLICIES;
  }

  async update(userId: string, data: any) {
    const existing = await this.prisma.securityPolicy.findFirst();
    if (existing) {
      return this.prisma.securityPolicy.update({
        where: { id: existing.id },
        data: { config: { ...(existing.config as any), ...data }, updated_by: userId },
      });
    }
    return this.prisma.securityPolicy.create({
      data: { config: { ...DEFAULT_POLICIES, ...data }, updated_by: userId },
    });
  }
}
