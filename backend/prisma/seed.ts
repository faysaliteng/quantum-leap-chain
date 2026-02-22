import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashOptions: argon2.Options & { raw?: false } = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  };

  // ── 1. Super Admin User ──
  const adminPassword = await argon2.hash('Ff01817018512', hashOptions);

  const adminUser = await prisma.user.upsert({
    where: { email: 'primox2014@gmail.com' },
    update: { password: adminPassword, role: 'admin', name: 'Super Admin' },
    create: {
      email: 'primox2014@gmail.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email} (id: ${adminUser.id})`);

  // ── 2. Merchant User ──
  const merchantPassword = await argon2.hash('Ff01817018512', hashOptions);

  const merchant = await prisma.merchant.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Example Merchant',
      email: 'user@example.com',
      status: 'active',
    },
  });

  const merchantUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { password: merchantPassword, merchant_id: merchant.id },
    create: {
      email: 'user@example.com',
      name: 'Merchant User',
      password: merchantPassword,
      role: 'merchant',
      merchant_id: merchant.id,
    },
  });
  console.log(`✅ Merchant user created: ${merchantUser.email} (id: ${merchantUser.id})`);

  // ── 3. Default Chain Configs ──
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
  console.log('✅ Chain configs seeded');

  // ── 4. Super Admin Role ──
  const superAdminRole = await prisma.adminRole.upsert({
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

  // ── 5. Assign Super Admin Role to Admin User ──
  await prisma.adminUserRole.upsert({
    where: { admin_user_id: adminUser.id },
    update: { role_id: superAdminRole.id },
    create: {
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      role_id: superAdminRole.id,
    },
  });
  console.log('✅ Super Admin role assigned');

  // ── 6. Default Security Policies ──
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
  console.log('✅ Security policies seeded');

  // ── 7. Default CMS Pages ──
  const pages = ['home', 'pricing', 'blog', 'faq', 'contact', 'privacy', 'terms'];
  for (const slug of pages) {
    await prisma.cMSPage.upsert({
      where: { slug },
      update: {},
      create: { slug, title: slug.charAt(0).toUpperCase() + slug.slice(1), description: `${slug} page` },
    });
  }
  console.log('✅ CMS pages seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  LOGIN CREDENTIALS                          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  ADMIN (Super Admin Panel):                 ║');
  console.log('║  Email: primox2014@gmail.com                ║');
  console.log('║  Password: Ff01817018512                    ║');
  console.log('║                                             ║');
  console.log('║  MERCHANT (Dashboard):                      ║');
  console.log('║  Email: user@example.com                    ║');
  console.log('║  Password: Ff01817018512                    ║');
  console.log('╚══════════════════════════════════════════════╝');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
