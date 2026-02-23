import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { configuration } from './config/configuration';
import { envValidation } from './config/env.validation';

// Shared
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { MaintenanceGuard } from './common/maintenance.guard';

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
import { SecurityModule } from './security/security.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { SignerModule } from './signer/signer.module';
import { MarketModule } from './market/market.module';
import { SwapModule } from './swap/swap.module';

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
    SecurityModule,
    MetricsModule,
    SignerModule,
    MarketModule,
    SwapModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: MaintenanceGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
