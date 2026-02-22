import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { envValidation } from './config/env.validation';

// Shared
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { ChargesModule } from './charges/charges.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SettlementModule } from './settlement/settlement.module';
import { AddressesModule } from './addresses/addresses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WalletsModule } from './wallets/wallets.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SecurityPoliciesModule } from './security-policies/security-policies.module';
import { ExportsModule } from './exports/exports.module';
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: envValidation,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    HealthModule,
    UsersModule,
    ChargesModule,
    CheckoutModule,
    ApiKeysModule,
    WebhooksModule,
    SettlementModule,
    AddressesModule,
    DashboardModule,
    WalletsModule,
    InvoicesModule,
    AdminModule,
    NotificationsModule,
    SecurityPoliciesModule,
    ExportsModule,
    BlockchainModule,
  ],
})
export class AppModule {}
