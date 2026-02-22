import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await argon2.hash('admin123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { email: 'admin@cryptoniumpay.com' },
    update: {},
    create: {
      email: 'admin@cryptoniumpay.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  // Create default chain configs
  const chains = [
    { chain: 'btc', name: 'Bitcoin', confirmation_threshold: 3 },
    { chain: 'eth', name: 'Ethereum', confirmation_threshold: 12 },
    { chain: 'polygon', name: 'Polygon', confirmation_threshold: 30 },
    { chain: 'arbitrum', name: 'Arbitrum', confirmation_threshold: 12 },
    { chain: 'optimism', name: 'Optimism', confirmation_threshold: 12 },
  ];

  for (const c of chains) {
    await prisma.chainConfig.upsert({
      where: { chain: c.chain },
      update: {},
      create: c,
    });
  }

  // Create default admin role
  await prisma.adminRole.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full access to all admin features',
      permissions: [
        'wallets.view', 'wallets.withdraw', 'wallets.approve',
        'fees.view', 'fees.edit', 'chains.view', 'chains.edit',
        'cms.view', 'cms.edit', 'merchants.view', 'merchants.manage',
        'audit.view', 'revenue.view', 'monitoring.view',
        'security.view', 'security.edit', 'roles.view', 'roles.manage',
        'notifications.manage',
      ],
      is_system: true,
    },
  });

  // Default security policies
  await prisma.securityPolicy.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      config: {
        password: { min_length: 8, require_uppercase: true, require_number: true, require_symbol: true, history_count: 5, expiry_days: 90 },
        session: { access_token_ttl_minutes: 15, refresh_token_ttl_days: 7, max_sessions: 5, mandatory_2fa_admin: true, idle_timeout_minutes: 30 },
        access: { maintenance_mode: false, bypass_ips: [], ip_allowlist_enabled: false, ip_allowlist: [], geo_block_enabled: false, geo_blocked_countries: [] },
        rate_limit: { public_rpm: 60, auth_rpm: 10, merchant_api_rpm: 200, webhook_delivery_rpm: 100 },
      },
    },
  });

  // Default CMS pages
  const pages = ['home', 'pricing', 'blog', 'faq', 'contact', 'privacy', 'terms'];
  for (const slug of pages) {
    await prisma.cMSPage.upsert({
      where: { slug },
      update: {},
      create: { slug, title: slug.charAt(0).toUpperCase() + slug.slice(1), description: `${slug} page` },
    });
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
