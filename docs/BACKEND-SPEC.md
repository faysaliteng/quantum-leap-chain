# Cryptonpay — Backend Specification

> Complete NestJS backend specification aligned with the frontend API client (`src/lib/api-client.ts`).
> This document is the blueprint for building the backend. Every endpoint, table, queue, and module is specified here.

**Version:** 1.0.0
**Last updated:** 2026-02-22

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module Structure](#2-module-structure)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
4. [API Endpoints (33 Total)](#4-api-endpoints-33-total)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [BullMQ Queues](#6-bullmq-queues)
7. [Middleware Chain](#7-middleware-chain)
8. [Error Response Format](#8-error-response-format)
9. [Webhook Signing](#9-webhook-signing)
10. [Blockchain Watchers](#10-blockchain-watchers)
11. [Signer Service](#11-signer-service)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      NestJS Application                      │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Auth   │  │ Charges  │  │ Webhooks │  │   Admin     │  │
│  │ Module  │  │  Module  │  │  Module  │  │   Module    │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬───────┘  │
│       │            │             │               │          │
│  ┌────▼────────────▼─────────────▼───────────────▼───────┐  │
│  │                   Prisma ORM Layer                     │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                   PostgreSQL 16                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │   Redis / BullMQ │  │  Signer Service (separate)      │  │
│  │   Job Queues     │  │  Private key isolation           │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Module Structure

```
backend/src/
├── main.ts                          # Bootstrap + Swagger setup
├── app.module.ts                    # Root module
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # POST /v1/auth/login, POST /v1/auth/signup, DELETE /v1/auth/logout
│   │   ├── auth.service.ts          # JWT generation, password hashing (argon2id)
│   │   ├── auth.guard.ts            # JwtAuthGuard
│   │   ├── roles.guard.ts           # RolesGuard (admin/merchant)
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── signup.dto.ts
│   ├── charges/
│   │   ├── charges.module.ts
│   │   ├── charges.controller.ts    # CRUD for /v1/charges
│   │   ├── charges.service.ts
│   │   └── dto/
│   │       └── create-charge.dto.ts
│   ├── checkout/
│   │   ├── checkout.module.ts
│   │   ├── checkout.controller.ts   # GET /v1/checkout/:id (public)
│   │   └── checkout.service.ts
│   ├── api-keys/
│   │   ├── api-keys.module.ts
│   │   ├── api-keys.controller.ts   # CRUD for /v1/api-keys
│   │   ├── api-keys.service.ts
│   │   └── dto/
│   │       └── create-api-key.dto.ts
│   ├── webhooks/
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.controller.ts   # CRUD for /v1/webhooks
│   │   ├── webhooks.service.ts
│   │   ├── webhook-dispatcher.ts    # BullMQ processor
│   │   └── dto/
│   │       └── create-webhook.dto.ts
│   ├── settlement/
│   │   ├── settlement.module.ts
│   │   ├── settlement.controller.ts # GET/PUT /v1/settlement, GET /v1/sweeps
│   │   └── settlement.service.ts
│   ├── addresses/
│   │   ├── addresses.module.ts
│   │   ├── addresses.controller.ts  # GET /v1/addresses, POST /v1/addresses/upload, GET /v1/addresses/stats
│   │   └── addresses.service.ts
│   ├── dashboard/
│   │   ├── dashboard.module.ts
│   │   ├── dashboard.controller.ts  # GET /v1/dashboard/stats
│   │   └── dashboard.service.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts      # All /v1/admin/* endpoints
│   │   ├── admin.service.ts
│   │   └── dto/
│   │       └── update-merchant.dto.ts
│   ├── blockchain/
│   │   ├── blockchain.module.ts
│   │   ├── watcher.service.ts       # Chain watcher loop
│   │   ├── adapters/
│   │   │   ├── chain-adapter.interface.ts
│   │   │   ├── bitcoin.adapter.ts
│   │   │   └── evm.adapter.ts
│   │   └── reorg-handler.ts
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts     # GET /v1/health
├── shared/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── errors/
│   │   └── http-exception.filter.ts
│   ├── dto/
│   │   └── pagination.dto.ts
│   └── utils/
│       ├── hmac.ts
│       └── crypto.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── config/
    ├── app.config.ts
    └── jwt.config.ts
```

---

## 3. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── 1. Merchants ──
model Merchant {
  id         String   @id @default(cuid())
  name       String
  email      String   @unique
  status     String   @default("active") // active | disabled
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  users              User[]
  charges            Charge[]
  api_keys           ApiKey[]
  webhook_endpoints  WebhookEndpoint[]
  settlement_configs SettlementConfig[]
  deposit_addresses  DepositAddress[]

  @@map("merchants")
}

// ── 2. Users ──
model User {
  id           String   @id @default(cuid())
  merchant_id  String?
  email        String   @unique
  password     String   // argon2id hash
  name         String
  role         String   @default("merchant") // merchant | admin
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  merchant     Merchant? @relation(fields: [merchant_id], references: [id])
  audit_logs   AuditLog[]
  refresh_tokens RefreshToken[]

  @@map("users")
}

// ── 3. Refresh Tokens ──
model RefreshToken {
  id         String   @id @default(cuid())
  user_id    String
  token_hash String   @unique
  family     String   // for rotation + reuse detection
  expires_at DateTime
  revoked    Boolean  @default(false)
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([family])
  @@map("refresh_tokens")
}

// ── 4. Charges ──
model Charge {
  id              String   @id @default(cuid())
  merchant_id     String
  name            String
  description     String?
  pricing_type    String   // fixed_price | no_price
  local_amount    String?
  local_currency  String?
  crypto_chain    String?
  crypto_asset    String?
  crypto_amount   String?
  status          String   @default("NEW") // NEW|PENDING|CONFIRMED|PAID|EXPIRED|CANCELED|UNDERPAID|OVERPAID
  hosted_url      String
  expires_at      DateTime
  metadata        Json?
  redirect_url    String?
  cancel_url      String?
  idempotency_key String?  @unique
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  merchant          Merchant          @relation(fields: [merchant_id], references: [id])
  payment_addresses PaymentAddress[]
  charge_payments   ChargePayment[]
  sweeps            Sweep[]

  @@index([merchant_id])
  @@index([status])
  @@index([created_at])
  @@map("charges")
}

// ── 5. Payment Addresses ──
model PaymentAddress {
  id        String @id @default(cuid())
  charge_id String
  chain     String
  asset     String
  address   String
  amount    String

  charge Charge @relation(fields: [charge_id], references: [id], onDelete: Cascade)

  @@index([charge_id])
  @@map("payment_addresses")
}

// ── 6. Charge Payments (inbound transactions) ──
model ChargePayment {
  id                     String   @id @default(cuid())
  charge_id              String
  chain                  String
  asset                  String
  tx_hash                String
  amount                 String
  confirmations          Int      @default(0)
  required_confirmations Int
  block_number           Int?
  block_hash             String?
  status                 String   @default("detected") // detected|confirming|confirmed|reorged
  created_at             DateTime @default(now())

  charge Charge @relation(fields: [charge_id], references: [id])

  @@unique([tx_hash, charge_id])
  @@index([charge_id])
  @@map("charge_payments")
}

// ── 7. Deposit Addresses (pre-generated pool) ──
model DepositAddress {
  id               String   @id @default(cuid())
  merchant_id      String
  chain            String
  address          String   @unique
  status           String   @default("available") // available|allocated|exhausted
  charge_id        String?
  derivation_index Int?
  created_at       DateTime @default(now())

  merchant Merchant @relation(fields: [merchant_id], references: [id])

  @@index([merchant_id, chain, status])
  @@map("deposit_addresses")
}

// ── 8. Sweeps ──
model Sweep {
  id           String   @id @default(cuid())
  charge_id    String
  chain        String
  asset        String
  from_address String
  to_address   String
  amount       String
  tx_hash      String?
  status       String   @default("pending") // pending|initiated|confirmed|failed
  created_at   DateTime @default(now())

  charge Charge @relation(fields: [charge_id], references: [id])

  @@index([charge_id])
  @@map("sweeps")
}

// ── 9. API Keys ──
model ApiKey {
  id           String    @id @default(cuid())
  merchant_id  String
  name         String
  prefix       String    // first 8 chars for display
  key_hash     String    @unique // argon2id hash of full key
  scopes       String[]  // ["read", "write", "admin"]
  last_used_at DateTime?
  revoked      Boolean   @default(false)
  created_at   DateTime  @default(now())

  merchant Merchant @relation(fields: [merchant_id], references: [id])

  @@index([merchant_id])
  @@map("api_keys")
}

// ── 10. Webhook Endpoints ──
model WebhookEndpoint {
  id          String   @id @default(cuid())
  merchant_id String
  url         String
  secret      String   // HMAC signing secret
  events      String[] // event types subscribed
  active      Boolean  @default(true)
  created_at  DateTime @default(now())

  merchant   Merchant          @relation(fields: [merchant_id], references: [id])
  deliveries WebhookDelivery[]

  @@index([merchant_id])
  @@map("webhook_endpoints")
}

// ── 11. Webhook Deliveries ──
model WebhookDelivery {
  id            String    @id @default(cuid())
  webhook_id    String
  event_type    String
  event_id      String
  status_code   Int?
  latency_ms    Int?
  attempt       Int       @default(1)
  max_attempts  Int       @default(5)
  next_retry_at DateTime?
  payload       Json?
  created_at    DateTime  @default(now())

  webhook WebhookEndpoint @relation(fields: [webhook_id], references: [id], onDelete: Cascade)

  @@index([webhook_id])
  @@map("webhook_deliveries")
}

// ── 12. Settlement Configs ──
model SettlementConfig {
  id                  String @id @default(cuid())
  merchant_id         String
  chain               String
  asset               String
  address             String
  sweep_mode          String @default("immediate") // immediate|batched
  min_sweep_threshold String @default("0")

  merchant Merchant @relation(fields: [merchant_id], references: [id])

  @@unique([merchant_id, chain, asset])
  @@map("settlement_configs")
}

// ── 13. Chain Configs ──
model ChainConfig {
  id                     String @id @default(cuid())
  chain                  String @unique
  name                   String
  enabled                Boolean @default(true)
  confirmation_threshold Int     @default(6)

  rpc_endpoints RpcEndpoint[]
  asset_configs AssetConfig[]

  @@map("chain_configs")
}

// ── 14. RPC Endpoints ──
model RpcEndpoint {
  id         String @id @default(cuid())
  chain_id   String
  url        String
  priority   Int    @default(0)
  status     String @default("healthy") // healthy|degraded|down
  latency_ms Int?

  chain ChainConfig @relation(fields: [chain_id], references: [id], onDelete: Cascade)

  @@map("rpc_endpoints")
}

// ── 15. Asset Configs ──
model AssetConfig {
  id               String  @id @default(cuid())
  chain_id         String
  symbol           String
  name             String
  contract_address String?
  decimals         Int
  enabled          Boolean @default(true)

  chain ChainConfig @relation(fields: [chain_id], references: [id], onDelete: Cascade)

  @@unique([chain_id, symbol])
  @@map("asset_configs")
}

// ── 16. Watcher Checkpoints ──
model WatcherCheckpoint {
  id           String   @id @default(cuid())
  chain        String   @unique
  current_block Int
  latest_block  Int
  lag           Int
  last_updated  DateTime @updatedAt

  @@map("watcher_checkpoints")
}

// ── 17. Audit Log ──
model AuditLog {
  id            String   @id @default(cuid())
  actor_id      String
  actor_email   String?
  action        String
  resource_type String
  resource_id   String
  details       Json?
  ip_address    String?
  created_at    DateTime @default(now())

  actor User @relation(fields: [actor_id], references: [id])

  @@index([actor_id])
  @@index([action])
  @@index([created_at])
  @@map("audit_logs")
}

// ── 18. Idempotency Keys ──
model IdempotencyKey {
  id         String   @id @default(cuid())
  key        String   @unique
  response   Json
  status     Int
  expires_at DateTime
  created_at DateTime @default(now())

  @@map("idempotency_keys")
}
```

**Total tables: 18**

---

## 4. API Endpoints (33 Total)

### Namespace 1: Auth (3 endpoints)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 1 | POST | `/v1/auth/login` | ❌ | `{ email, password }` | `{ token, user: { id, email, role, merchant_id? } }` |
| 2 | POST | `/v1/auth/signup` | ❌ | `{ name, email, password }` | `{ token, user: { id, email, role, merchant_id? } }` |
| 3 | DELETE | `/v1/auth/logout` | ✅ | — | `204 No Content` |

### Namespace 2: Charges (4 endpoints)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 4 | POST | `/v1/charges` | ✅ | `CreateChargeRequest` + `Idempotency-Key` header | `Charge` |
| 5 | GET | `/v1/charges/:id` | ✅ | — | `Charge` |
| 6 | GET | `/v1/charges` | ✅ | `?status&from&to&asset&page&per_page` | `PaginatedResponse<Charge>` |
| 7 | GET | `/v1/charges/:chargeId/transactions` | ✅ | — | `ChargePayment[]` |

### Namespace 3: Checkout (1 endpoint)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 8 | GET | `/v1/checkout/:id` | ❌ | — | `Charge` (public) |

### Namespace 4: API Keys (3 endpoints)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 9 | GET | `/v1/api-keys` | ✅ | — | `ApiKey[]` |
| 10 | POST | `/v1/api-keys` | ✅ | `{ name, scopes }` | `ApiKeyCreated` (includes full key) |
| 11 | DELETE | `/v1/api-keys/:id` | ✅ | — | `204 No Content` |

### Namespace 5: Webhooks (5 endpoints)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 12 | GET | `/v1/webhooks` | ✅ | — | `WebhookEndpoint[]` |
| 13 | POST | `/v1/webhooks` | ✅ | `{ url, events }` | `WebhookEndpoint` |
| 14 | DELETE | `/v1/webhooks/:id` | ✅ | — | `204 No Content` |
| 15 | POST | `/v1/webhooks/:id/test` | ✅ | — | `200 OK` |
| 16 | GET | `/v1/webhooks/:id/deliveries` | ✅ | — | `WebhookDelivery[]` |

### Namespace 6: Settlement (3 endpoints)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 17 | GET | `/v1/settlement` | ✅ | — | `SettlementConfig[]` |
| 18 | PUT | `/v1/settlement` | ✅ | `SettlementConfig` | `200 OK` |
| 19 | GET | `/v1/sweeps` | ✅ | — | `Sweep[]` |

### Namespace 7: Deposit Addresses (3 endpoints)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 20 | GET | `/v1/addresses/stats` | ✅ | — | `AddressPoolStats[]` |
| 21 | POST | `/v1/addresses/upload` | ✅ | `{ chain, addresses }` | `201 Created` |
| 22 | GET | `/v1/addresses` | ✅ | `?chain` | `DepositAddress[]` |

### Namespace 8: Dashboard (1 endpoint)

| # | Method | Path | Auth | Body / Params | Response |
|---|--------|------|------|--------------|----------|
| 23 | GET | `/v1/dashboard/stats` | ✅ | — | `DashboardStats` |

### Namespace 9: Admin (8 endpoints)

| # | Method | Path | Auth | Role | Response |
|---|--------|------|------|------|----------|
| 24 | GET | `/v1/admin/stats` | ✅ | admin | `AdminStats` |
| 25 | GET | `/v1/admin/merchants` | ✅ | admin | `Merchant[]` |
| 26 | GET | `/v1/admin/merchants/:id` | ✅ | admin | `Merchant` |
| 27 | PATCH | `/v1/admin/merchants/:id` | ✅ | admin | `200 OK` |
| 28 | GET | `/v1/admin/chains` | ✅ | admin | `ChainConfig[]` |
| 29 | PUT | `/v1/admin/chains/:chain` | ✅ | admin | `200 OK` |
| 30 | GET | `/v1/admin/assets` | ✅ | admin | `AssetConfig[]` |
| 31 | PATCH | `/v1/admin/assets/:chain/:symbol` | ✅ | admin | `200 OK` |
| 32 | GET | `/v1/admin/health` | ✅ | admin | `SystemHealth` |
| 33 | GET | `/v1/admin/audit-log` | ✅ | admin | `PaginatedResponse<AuditLogEntry>` |

### Namespace 10: Health (1 endpoint)

| # | Method | Path | Auth | Response |
|---|--------|------|------|----------|
| 34 | GET | `/v1/health` | ❌ | `{ status, version, uptime }` |

**Note:** Total is 34 endpoints (33 authenticated + 1 health). The plan initially counted 33 because health was grouped separately.

---

## 5. Authentication & Authorization

### JWT Strategy

- **Access token:** 15 min expiry, signed with `JWT_SECRET` (HS256)
- **Refresh token:** 7 day expiry, stored as argon2id hash in `refresh_tokens` table
- **Token rotation:** Each refresh invalidates old token and issues new pair
- **Reuse detection:** If a revoked token is reused, entire family is invalidated

### Password Hashing

- Algorithm: `argon2id`
- Config: `memoryCost: 65536, timeCost: 3, parallelism: 4`

### RBAC

- `merchant` role: access to `/v1/charges`, `/v1/api-keys`, `/v1/webhooks`, `/v1/settlement`, `/v1/addresses`, `/v1/dashboard`, `/v1/sweeps`
- `admin` role: access to all above + `/v1/admin/*`

---

## 6. BullMQ Queues

| Queue Name | Purpose | Processor |
|-----------|---------|-----------|
| `webhook-dispatch` | Deliver webhook payloads | `WebhookDispatcher` |
| `charge-expiry` | Expire charges past deadline | `ChargeExpiryProcessor` |
| `sweep-execution` | Execute fund sweeps | `SweepProcessor` |
| `blockchain-events` | Process detected chain events | `BlockchainEventProcessor` |

### Retry Policy

- Webhooks: 5 attempts, exponential backoff (10s, 30s, 90s, 270s, 810s)
- Sweeps: 3 attempts, 60s backoff
- Chain events: 10 attempts, 5s backoff

---

## 7. Middleware Chain

```
Request
  → Helmet (security headers)
  → CORS (configurable origins)
  → Rate Limiter (per IP / per merchant)
  → Body Parser (10kb limit)
  → JWT Auth Guard (skip for public routes)
  → Roles Guard (check role for admin routes)
  → Validation Pipe (class-validator / Zod)
  → Controller
  → Service
  → Response
  → Exception Filter (standardized errors)
```

---

## 8. Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already registered",
    "details": { "field": "email" }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 9. Webhook Signing

### Signature Format

```
x-cryptonpay-signature: sha256=<hex_hmac>
x-cryptonpay-timestamp: <unix_seconds>
x-cryptonpay-event: charge.paid
```

### Verification (merchant side)

```javascript
const crypto = require('crypto');

function verify(payload, signature, timestamp, secret) {
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`));
}
```

### Replay Protection

- Reject if `timestamp` is older than 5 minutes

---

## 10. Blockchain Watchers

### Chain Adapter Interface

```typescript
interface ChainAdapter {
  chain: ChainId;
  getLatestBlock(): Promise<number>;
  getTransactions(fromBlock: number, toBlock: number, addresses: string[]): Promise<DetectedTx[]>;
  getConfirmations(txHash: string): Promise<number>;
}
```

### Watcher Loop

1. Read `watcher_checkpoints` for current block
2. Fetch latest block from RPC
3. Scan blocks `current + 1` to `latest` for monitored addresses
4. For each detected tx → upsert `charge_payments` + enqueue `blockchain-events`
5. Update checkpoint

### Reorg Handling

- On detection: mark affected `charge_payments` as `reorged`
- Re-scan from `current_block - confirmation_threshold`

---

## 11. Signer Service

### Architecture

- Separate NestJS microservice on isolated Docker network
- Only accessible by the worker service
- Health endpoint: `GET /health`

### Key Storage

- **Development:** AES-256-GCM encrypted keystore file, passphrase from env
- **Production:** Pluggable KMS interface (AWS KMS, HashiCorp Vault)

### Endpoints (internal only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Signer health check |
| POST | `/sign` | Sign a transaction |
| POST | `/derive-address` | Derive new deposit address |
