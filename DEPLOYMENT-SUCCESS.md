# Cryptoniumpay — Complete Deployment Guide (Atomic Detail)

> **Last Updated:** February 23, 2026 (verified working — full redeploy completed)  
> **VPS Provider:** DigitalOcean  
> **Droplet Spec:** 1 vCPU, 2GB RAM, Ubuntu 24.04  
> **VPS IP:** 139.59.56.210  
> **Frontend URL:** https://cryptoniumpay.pages.dev  
> **API Gateway URL:** https://cryptoniumpay-api-gateway.mailg.workers.dev/api  
> **Backend Origin:** http://139-59-56-210.sslip.io (port 80 via Nginx → port 3000 API)  
> **Prisma CLI:** Pinned to v5 (`npx prisma@5`) — Prisma 7 removed `url` from schema.prisma

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [VPS Initial Setup](#2-vps-initial-setup)
3. [Install Docker](#3-install-docker)
4. [Clone the Repository](#4-clone-the-repository)
5. [Generate Secrets](#5-generate-secrets)
6. [Configure Backend .env](#6-configure-backend-env)
7. [Configure Docker Compose .env](#7-configure-docker-compose-env)
8. [Build & Start Containers](#8-build--start-containers)
9. [Run Database Migration & Seed](#9-run-database-migration--seed)
10. [Verify Backend Health](#10-verify-backend-health)
11. [Deploy Cloudflare Worker Gateway](#11-deploy-cloudflare-worker-gateway)
12. [Deploy Frontend to Cloudflare Pages](#12-deploy-frontend-to-cloudflare-pages)
13. [Configure Frontend CSP Headers](#13-configure-frontend-csp-headers)
14. [End-to-End Verification](#14-end-to-end-verification)
15. [Login Credentials](#15-login-credentials)
16. [Container Reference](#16-container-reference)
17. [File Locations on VPS](#17-file-locations-on-vps)
18. [Useful Commands](#18-useful-commands)
19. [Updating the Application](#19-updating-the-application)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  USER BROWSER                                                    │
│  https://cryptoniumpay.pages.dev                                │
└──────────────┬───────────────────────────────────────────────────┘
               │ All API calls go to:
               │ https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/*
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE WORKER GATEWAY                                       │
│  Name: cryptoniumpay-api-gateway                                │
│                                                                  │
│  ✦ HMAC-SHA256 edge signature (X-Edge-Signature header)         │
│  ✦ Per-IP rate limiting (100 RPM default, in-memory)            │
│  ✦ Request size limit (10MB)                                    │
│  ✦ CORS validation (ALLOWED_ORIGINS whitelist)                  │
│  ✦ Maintenance mode toggle                                      │
│  ✦ Only proxies /api/* paths (everything else → 404)            │
│                                                                  │
│  Secrets (set via wrangler secret put):                          │
│    EDGE_SECRET = shared HMAC key                                │
│  Vars (wrangler.toml):                                          │
│    BACKEND_ORIGIN = http://139-59-56-210.sslip.io               │
│    ALLOWED_ORIGINS = https://cryptoniumpay.pages.dev            │
│    RATE_LIMIT_RPM = 100                                         │
│    MAX_BODY_BYTES = 10485760                                    │
│    MAINTENANCE_MODE = false                                     │
└──────────────┬───────────────────────────────────────────────────┘
               │ Proxies request to BACKEND_ORIGIN + path
               │ Adds X-Edge-Signature, X-Forwarded-For, X-Real-IP
               │ Forwards: content-type, authorization, accept,
               │   accept-language, idempotency-key, x-request-id, user-agent
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  VPS: 139.59.56.210 (DigitalOcean, Ubuntu 24.04, 2GB RAM)      │
│  Hostname via sslip.io: 139-59-56-210.sslip.io                 │
│                                                                  │
│  ┌────────────────────────────────────────────────┐              │
│  │  NGINX (nginx:alpine)                          │              │
│  │  Ports: 80, 443                                │              │
│  │  Rate limits:                                  │              │
│  │    /api/v1/auth/* → 5 req/s (burst 10)        │              │
│  │    /api/*         → 30 req/s (burst 50)       │              │
│  │  Max body: 10MB                                │              │
│  │  Security headers: X-Frame-Options DENY,       │              │
│  │    X-Content-Type-Options nosniff,             │              │
│  │    X-XSS-Protection, Referrer-Policy           │              │
│  │  SSL: Certbot auto-renewal (12h cycle)         │              │
│  └────────┬───────────────────────────────────────┘              │
│           │ proxy_pass http://api:3000                           │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────┐              │
│  │  API (node:20-alpine, NestJS)                  │              │
│  │  Port: 3000 (bound to 127.0.0.1 only)         │              │
│  │  Memory limit: 512MB                           │              │
│  │  Healthcheck: GET /api/v1/health (30s interval)│              │
│  │  env_file: ../backend/.env                     │              │
│  │  Validates X-Edge-Signature (EdgeSignatureGuard)│             │
│  │    → Rejects if missing/invalid/expired (>5min) │             │
│  │  Auth: JWT + Argon2id + RBAC                   │              │
│  └────────┬──────────────┬────────────────────────┘              │
│           │              │                                       │
│  ┌────────▼──────┐  ┌───▼─────────┐                             │
│  │  PostgreSQL   │  │  Redis      │                              │
│  │  16-alpine    │  │  7-alpine   │                              │
│  │  Port: 5432   │  │  Port: 6379 │                              │
│  │  Memory: 512MB│  │  Memory:192M│                              │
│  │  User: crypto │  │  Max: 128MB │                              │
│  │  niumpay      │  │  LRU evict  │                              │
│  │  DB: crypto   │  │             │                              │
│  │  niumpay      │  │  Healthcheck│                              │
│  │  Data: pgdata │  │  redis-cli  │                              │
│  │  volume       │  │  ping (10s) │                              │
│  │  Healthcheck: │  └─────────────┘                              │
│  │  pg_isready   │                                               │
│  │  (10s)        │  ┌─────────────┐                              │
│  └───────────────┘  │  Worker     │                              │
│                     │  (BullMQ)   │                              │
│                     │  Memory:384M│                              │
│                     │  ENABLE_    │                              │
│                     │  WATCHER=   │                              │
│                     │  true       │                              │
│                     │  Blockchain │                              │
│                     │  watcher +  │                              │
│                     │  export jobs│                              │
│                     └─────────────┘                              │
│                                                                  │
│  Volumes: pgdata, redisdata, exports, certbot-conf, certbot-www │
└──────────────────────────────────────────────────────────────────┘
```

**Why sslip.io?** Cloudflare Workers cannot `fetch()` raw IP addresses (Error 1003). `139-59-56-210.sslip.io` resolves to `139.59.56.210` but satisfies Cloudflare's hostname requirement.

**Why API port 127.0.0.1:3000?** The API is NOT exposed to the internet directly. Only Nginx on port 80/443 is public. Nginx proxies to `api:3000` internally via Docker network.

---

## 2. VPS Initial Setup

```bash
ssh root@139.59.56.210
```

Create 1GB swap (prevents OOM on 2GB droplet during Docker builds):
```bash
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Verify:
```bash
free -h
# Should show ~1GB swap
```

---

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
docker --version
# Docker version 29.x.x
```

Docker Compose is included with modern Docker (no separate install needed).

---

## 4. Clone the Repository

```bash
cd /opt
git clone https://github.com/faysaliteng/quantum-leap-chain.git cryptoniumpay
cd cryptoniumpay
```

Project structure on VPS:
```
/opt/cryptoniumpay/
├── backend/               ← NestJS API source + Dockerfile + .env
│   ├── .env               ← Backend secrets (you create this)
│   ├── .env.example       ← Template
│   ├── Dockerfile         ← Multi-stage: node:20-alpine builder → runner
│   ├── prisma/
│   │   ├── schema.prisma  ← 42 models, 733 lines (includes wallet, swap, market, signer tables)
│   │   └── seed.ts        ← Creates admin + merchant users + chain configs
│   └── src/               ← NestJS modules
├── infra/
│   ├── docker-compose.prod.yml  ← Production orchestration (6 containers)
│   ├── .env                     ← POSTGRES_PASSWORD only (you create this)
│   ├── nginx/nginx.conf         ← Reverse proxy config
│   └── scripts/
│       └── gen-secrets.sh       ← Secret generator helper
├── cloudflare/
│   └── worker-gateway/
│       ├── src/index.ts         ← Cloudflare Worker source
│       └── wrangler.toml        ← Worker config (BACKEND_ORIGIN, etc.)
├── src/                         ← React frontend source
├── public/
│   ├── _headers                 ← CSP + security headers for Cloudflare Pages
│   └── _redirects               ← SPA routing
└── dist/                        ← Built frontend (after npm run build)
```

---

## 5. Generate Secrets

```bash
cd /opt/cryptoniumpay
bash infra/scripts/gen-secrets.sh
```

Output (example — yours will be different):
```
JWT_SECRET=e50eb9b946dfe343f6b46c9ec834bca51a39f8828e644304947d34df9df354b9
SIGNER_SECRET=d139a2eb7a9d3ee740043f833262c57fca1492db4a4a29d27fa170473bfb9ba6
POSTGRES_PASSWORD=VpVCMmnGE1ELhmyHKl2jpI56id8gKYmQ
DATABASE_URL=postgresql://cryptoniumpay:VpVCMmnGE1ELhmyHKl2jpI56id8gKYmQ@db:5432/cryptoniumpay?schema=public
```

**⚠️ Copy these values — you need them in the next 2 steps.**

Also generate an EDGE_SECRET for the Cloudflare Worker ↔ Backend HMAC signing:
```bash
openssl rand -hex 32
# Example: a7b3c1d4e5f6...  ← save this too
```

---

## 6. Configure Backend .env

```bash
cd /opt/cryptoniumpay/backend
cp .env.example .env
nano .env
```

Fill in with your generated values:
```env
# ── Core ──
NODE_ENV=production
PORT=3000

# ── Database ──
DATABASE_URL=postgresql://cryptoniumpay:YOUR_PG_PASS@db:5432/cryptoniumpay?schema=public

# ── Redis ──
REDIS_URL=redis://redis:6379

# ── JWT ──
JWT_SECRET=YOUR_JWT_SECRET
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# ── Signer Service ──
SIGNER_URL=http://signer:3001
SIGNER_SECRET=YOUR_SIGNER_SECRET

# ── CORS (your Cloudflare Pages domain) ──
CORS_ORIGINS=https://cryptoniumpay.pages.dev

# ── Edge Signature (must match Worker's EDGE_SECRET) ──
EDGE_SECRET=YOUR_EDGE_SECRET

# ── Blockchain Watcher ──
ENABLE_WATCHER=true

# ── Exports ──
EXPORT_DIR=/data/exports

# ── Postgres (used by docker-compose) ──
POSTGRES_USER=cryptoniumpay
POSTGRES_PASSWORD=YOUR_PG_PASS
POSTGRES_DB=cryptoniumpay
```

Save: `Ctrl+X` → `Y` → `Enter`

**Critical notes:**
- `DATABASE_URL` hostname must be `db` (Docker service name), NOT `localhost`
- `REDIS_URL` hostname must be `redis` (Docker service name)
- `CORS_ORIGINS` must exactly match your frontend URL (no trailing slash)
- `EDGE_SECRET` must match the secret you set on the Cloudflare Worker

---

## 7. Configure Docker Compose .env

```bash
echo "POSTGRES_PASSWORD=YOUR_PG_PASS" > /opt/cryptoniumpay/infra/.env
```

Replace `YOUR_PG_PASS` with the exact same password from Step 5. This is used by the `db` container's `${POSTGRES_PASSWORD}` variable.

---

## 8. Build & Start Containers

```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml up -d --build
```

**First build takes 5-10 minutes** (downloads base images, installs npm deps, compiles TypeScript).

### What gets created (6 containers):

| Container | Image | Port | Memory Limit | Healthcheck |
|-----------|-------|------|--------------|-------------|
| `infra-db-1` | postgres:16-alpine | 5432 (internal) | 512MB | `pg_isready` every 10s |
| `infra-redis-1` | redis:7-alpine | 6379 (internal) | 192MB | `redis-cli ping` every 10s |
| `infra-api-1` | Built from `backend/Dockerfile` | 127.0.0.1:3000 | 512MB | `wget /api/v1/health` every 30s |
| `infra-worker-1` | Same image as API | None | 384MB | None |
| `infra-nginx-1` | nginx:alpine | **80**, **443** | 64MB | None |
| `infra-certbot-1` | certbot/certbot | None | — | Auto-renews SSL every 12h |

### Docker volumes:

| Volume | Purpose |
|--------|---------|
| `pgdata` | PostgreSQL data (persistent) |
| `redisdata` | Redis dump (persistent) |
| `exports` | CSV/JSON export files |
| `certbot-conf` | SSL certificates |
| `certbot-www` | ACME challenge files |

Verify all running:
```bash
docker compose -f docker-compose.prod.yml ps
```

✅ All containers should show `Up` or `Up (healthy)`.

---

## 9. Run Database Migration & Seed

### ⚠️ CRITICAL: Prisma Version

**You MUST use Prisma v5** for all CLI commands. Prisma 7 removed the `url` property from `schema.prisma` and will fail with error `P1012`. Always use `npx prisma@5` instead of `npx prisma`.

### 9a. Apply Schema to Database (Prisma db push)

**Method 1 — Via Docker `run` (recommended, works even if API is crash-looping):**
```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma@5 db push --accept-data-loss
```

**Method 2 — Via Docker `exec` (only works if API container is running):**
```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml exec api npx prisma@5 db push
```

**⚠️ Why NOT `prisma migrate deploy`?** This project uses `prisma db push` (schema-push workflow) instead of migration files. There are no `.sql` migration files in `prisma/migrations/`. The `db push` command compares your `schema.prisma` to the live database and applies differences directly.

**⚠️ `EACCES: permission denied` warning** after `db push` is harmless — it's just the Prisma client generator trying to write inside a read-only container layer. Ignore it.

This creates all 42 tables from `schema.prisma`:
- Core: merchants, users, charges, charge_payments, deposit_addresses
- Wallets: wallet_configs, wallet_transactions, wallet_balances, wallet_deposit_addresses
- Market: market_tickers, order_book_entries, swap_orders
- Security: encrypted_keys, security_policies, roles, permissions, role_assignments
- CMS: cms_pages, cms_blog_posts, cms_announcements, cms_faq_entries, cms_contacts, cms_social_links
- Infra: chain_configs, rpc_endpoints, asset_configs, watcher_checkpoints, audit_log_entries, api_keys, webhook_endpoints, webhook_deliveries, settlement_configs, sweeps, address_pool_entries, export_jobs, notifications

### 9b. Seed the Database

```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml exec api npx tsx prisma/seed.ts
```

**⚠️ Note:** Use `npx tsx prisma/seed.ts` (NOT `npx prisma db seed`). The `package.json` does not have a `prisma.seed` config entry.

**What the seed creates:**

| Resource | Details |
|----------|---------|
| **Admin User** | `primox2014@gmail.com` / `Ff01817018512` / role: `admin` / no merchant_id |
| **Merchant** | `Example Merchant` / email: `user@example.com` / status: `active` |
| **Merchant User** | `user@example.com` / `Ff01817018512` / role: `merchant` / linked to merchant |
| **Chain Configs** | BTC (3 conf), ETH (12 conf), Polygon (30 conf), Arbitrum (12 conf), Optimism (12 conf) |
| **Super Admin Role** | 19 permissions: `wallets.view`, `wallets.withdraw`, `wallets.approve`, `fees.view`, `fees.edit`, `chains.view`, `chains.edit`, `cms.view`, `cms.edit`, `merchants.view`, `merchants.manage`, `audit.view`, `revenue.view`, `monitoring.view`, `security.view`, `security.edit`, `roles.view`, `roles.manage`, `notifications.manage` |
| **Role Assignment** | Admin user → Super Admin role |
| **Security Policy** | Password policy (8+ chars, uppercase, number, symbol), session policy (15min access, 7d refresh, max 5 sessions), rate limits |
| **CMS Pages** | home, pricing, blog, faq, contact, privacy, terms |

Passwords are hashed with **Argon2id** (memoryCost: 64MB, timeCost: 3, parallelism: 4).

---

## 10. Verify Backend Health

### From VPS:
```bash
# Health endpoint (no auth required)
curl http://localhost:3000/api/v1/health
# ✅ Expected: {"status":"ok"} or similar

# Test admin login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"primox2014@gmail.com","password":"Ff01817018512"}' | head -c 200
# ✅ Expected: JSON with "token" field

# Test merchant login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Ff01817018512"}' | head -c 200
# ✅ Expected: JSON with "token" field + user.merchant_id populated
```

### From outside (via Nginx on port 80):
```bash
curl http://139.59.56.210/api/v1/health
# ✅ Expected: {"status":"ok"}
```

---

## 11. Deploy Cloudflare Worker Gateway

### 11a. Install Wrangler (on your LOCAL machine, not VPS)

```bash
npm install -g wrangler
wrangler login
```

### 11b. Set the EDGE_SECRET

```bash
cd cloudflare/worker-gateway
wrangler secret put EDGE_SECRET
# Paste the same EDGE_SECRET value you put in backend/.env
```

### 11c. Verify wrangler.toml

File: `cloudflare/worker-gateway/wrangler.toml`
```toml
name = "cryptoniumpay-api-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
BACKEND_ORIGIN = "http://139-59-56-210.sslip.io"
RATE_LIMIT_RPM = "100"
MAX_BODY_BYTES = "10485760"
MAINTENANCE_MODE = "false"
ALLOWED_ORIGINS = "https://cryptoniumpay.pages.dev"
```

**Key settings:**
- `BACKEND_ORIGIN`: Uses sslip.io (not raw IP) because Cloudflare Workers block `fetch()` to raw IPs (Error 1003)
- `ALLOWED_ORIGINS`: Must match your Cloudflare Pages domain exactly
- `EDGE_SECRET`: Set as a secret (not in toml) — shared with backend for HMAC verification

### 11d. Deploy the Worker

```bash
cd cloudflare/worker-gateway
npm install
wrangler deploy
```

✅ **Result:** Worker live at `https://cryptoniumpay-api-gateway.mailg.workers.dev`

### 11e. Verify Worker → Backend connectivity

```bash
curl https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/health
# ✅ Expected: {"status":"ok"}
```

---

## 12. Deploy Frontend to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. Connect GitHub repo: `faysaliteng/quantum-leap-chain`
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave empty)
4. Environment variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://cryptoniumpay-api-gateway.mailg.workers.dev/api`
5. Click **Save and Deploy**

### Option B: Via Wrangler CLI

```bash
# On your LOCAL machine
cd /path/to/quantum-leap-chain

# Set the API URL for the build (MUST end with /api — NOT /api/v1)
export VITE_API_BASE_URL=https://cryptoniumpay-api-gateway.mailg.workers.dev/api

npm run build
npx wrangler pages deploy dist --project-name=cryptoniumpay
```

✅ **Result:** Frontend live at `https://cryptoniumpay.pages.dev`

---

## 13. Configure Frontend CSP Headers

The file `public/_headers` controls Content Security Policy for Cloudflare Pages. The `connect-src` directive must whitelist the Worker gateway URL:

```
/*
  Content-Security-Policy: ... connect-src 'self' https://api.coingecko.com https://cryptoniumpay-api-gateway.mailg.workers.dev; ...
```

**If you change the Worker URL or add a custom domain**, update this file and redeploy the frontend.

---

## 14. End-to-End Verification

### Full request flow test:

```bash
# 1. Frontend → Worker → Backend health
curl -v https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/health
# Check response headers include:
#   Access-Control-Allow-Origin: https://cryptoniumpay.pages.dev
#   X-Content-Type-Options: nosniff
#   X-Frame-Options: DENY

# 2. Login as admin via gateway
curl -s -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://cryptoniumpay.pages.dev" \
  -d '{"email":"primox2014@gmail.com","password":"Ff01817018512"}'
# ✅ Expected: {"token":"eyJ...","user":{"role":"admin",...}}

# 3. Login as merchant via gateway
curl -s -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://cryptoniumpay.pages.dev" \
  -d '{"email":"user@example.com","password":"Ff01817018512"}'
# ✅ Expected: {"token":"eyJ...","user":{"role":"merchant","merchant_id":"clx...",...}}
```

### Browser test:
1. Open `https://cryptoniumpay.pages.dev`
2. Click Login → Enter admin creds → Should redirect to `/admin`
3. Logout → Login with merchant creds → Should redirect to `/dashboard`

---

## 15. Login Credentials

| Role | Email | Password | Redirects to | Has merchant_id |
|------|-------|----------|-------------|-----------------|
| **Super Admin** | primox2014@gmail.com | Ff01817018512 | `/admin` | ❌ No |
| **Merchant** | user@example.com | Ff01817018512 | `/dashboard` | ✅ Yes |

**⚠️ CHANGE THESE PASSWORDS AFTER FIRST LOGIN via Settings → Security!**

**Why admin has no merchant_id:** Admin accounts are platform-level. They manage ALL merchants. Merchant dashboard endpoints require `merchant_id` in the JWT — that's why admin must NOT access `/dashboard` (it would error). The `ProtectedRoute` component enforces this separation.

---

## 16. Container Reference

### Dockerfile (backend/Dockerfile) — Multi-stage build:

```
Stage 1 (builder): node:20-alpine
  → Installs deps (npm install)
  → Installs extra: @nestjs/websockets, socket.io, @nestjs/bullmq
  → Runs: npx prisma generate
  → Runs: npm run build (TypeScript → dist/)

Stage 2 (runner): node:20-alpine
  → Copies: dist/, node_modules/, package.json, prisma/
  → Runs as: USER node (not root)
  → Entrypoint: dumb-init → node dist/main
  → Exposes: 3000
```

### Startup dependency chain:
```
db (postgres) ──healthy──┐
                          ├──→ api (NestJS)
redis ────────healthy────┘     │
                               └──→ nginx (reverse proxy)
                          
db ────────healthy──┐
                     ├──→ worker (BullMQ + blockchain watcher)
redis ──healthy─────┘
```

---

## 17. File Locations on VPS

| File | Purpose |
|------|---------|
| `/opt/cryptoniumpay/backend/.env` | All backend secrets (JWT, DB, Redis, CORS, Edge) |
| `/opt/cryptoniumpay/infra/.env` | Just `POSTGRES_PASSWORD` for docker-compose |
| `/opt/cryptoniumpay/infra/docker-compose.prod.yml` | Production orchestration |
| `/opt/cryptoniumpay/infra/nginx/nginx.conf` | Nginx reverse proxy + rate limiting |
| `/opt/cryptoniumpay/backend/prisma/schema.prisma` | Database schema (42 models, 733 lines) |
| `/opt/cryptoniumpay/backend/prisma/seed.ts` | Database seeder |

---

## 18. Useful Commands

### Logs
```bash
cd /opt/cryptoniumpay/infra

# All containers
docker compose -f docker-compose.prod.yml logs -f

# Specific container
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Container management
```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific
docker compose -f docker-compose.prod.yml restart api worker

# Stop all (keeps data)
docker compose -f docker-compose.prod.yml down

# Stop all + DELETE ALL DATA
docker compose -f docker-compose.prod.yml down -v
```

### Database access
```bash
# PostgreSQL shell
docker compose -f docker-compose.prod.yml exec db psql -U cryptoniumpay -d cryptoniumpay

# Prisma Studio (web GUI for database)
docker compose -f docker-compose.prod.yml exec api npx prisma studio
# Then visit http://139.59.56.210:5555 (if port is exposed)

# Run raw SQL
docker compose -f docker-compose.prod.yml exec db psql -U cryptoniumpay -d cryptoniumpay -c "SELECT email, role FROM users;"
```

### Redis
```bash
docker compose -f docker-compose.prod.yml exec redis redis-cli
> INFO memory
> DBSIZE
> KEYS *
```

### Check resource usage
```bash
docker stats --no-stream
free -h
df -h
```

---

## 19. Updating the Application

### Backend update (on VPS):
```bash
cd /opt/cryptoniumpay
git pull origin main

# If schema.prisma changed, push new tables BEFORE rebuilding:
cd infra
docker compose -f docker-compose.prod.yml up -d db   # ensure DB is running
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma@5 db push --accept-data-loss

# Rebuild and restart
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Verify health (note the /api prefix)
sleep 15
curl http://localhost:3000/api/v1/health
# ✅ Expected: {"status":"ok","version":"1.0.0","uptime":...}
```

### Frontend update (on local machine — Windows PowerShell):
```powershell
cd F:\quantum-leap-chain-main\quantum-leap-chain-main
$env:VITE_API_BASE_URL="https://cryptoniumpay-api-gateway.mailg.workers.dev/api"
npm run build
npx wrangler pages deploy dist --project-name=cryptoniumpay
```

### Frontend update (on local machine — macOS/Linux):
```bash
cd /path/to/quantum-leap-chain
export VITE_API_BASE_URL="https://cryptoniumpay-api-gateway.mailg.workers.dev/api"
npm run build
npx wrangler pages deploy dist --project-name=cryptoniumpay
```

### Worker gateway update (on local machine):
```bash
cd cloudflare/worker-gateway
npx wrangler deploy
```

---

## 20. Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs <container-name> --tail 100
```

### Database connection error
- Verify `DATABASE_URL` in `backend/.env` uses `db` as hostname (not `localhost` or `127.0.0.1`)
- Verify `POSTGRES_PASSWORD` matches in BOTH `backend/.env` AND `infra/.env`
- Check db is healthy: `docker compose -f docker-compose.prod.yml ps db`

### API returns 403 Forbidden
- Edge signature validation failed
- Check `EDGE_SECRET` matches between Worker (`wrangler secret`) and backend (`backend/.env`)
- Check clock skew < 5 minutes between Cloudflare and VPS: `date -u` on VPS

### API returns 500
```bash
docker compose -f docker-compose.prod.yml logs api --tail 50
```

### CORS errors in browser console
- Check `CORS_ORIGINS` in `backend/.env` matches exactly: `https://cryptoniumpay.pages.dev`
- Check `ALLOWED_ORIGINS` in `wrangler.toml` matches exactly
- Check `connect-src` in `public/_headers` includes the Worker URL

### Frontend loads but API calls fail
- Open browser DevTools → Network tab
- Check requests go to `https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/*`
- If going elsewhere, check `VITE_API_BASE_URL` env var on Cloudflare Pages

### Worker returns 502 Bad Gateway
- Backend is down or unreachable from Cloudflare
- Verify: `curl http://139-59-56-210.sslip.io/api/v1/health` works
- Check VPS firewall allows port 80 inbound

### Out of memory (OOM)
```bash
free -h
docker stats --no-stream
# If swap is full, add more:
fallocate -l 2G /swapfile2
chmod 600 /swapfile2
mkswap /swapfile2
swapon /swapfile2
```

### Clean up disk space
```bash
df -h
docker system prune -a    # Remove unused images/containers
docker volume prune        # ⚠️ Removes unused volumes (careful!)
```

### Need to completely reset
```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml down -v   # ⚠️ DELETES ALL DATA
docker compose -f docker-compose.prod.yml up -d --build
# Wait for containers to be healthy, then push schema + seed:
sleep 30
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma@5 db push --accept-data-loss
docker compose -f docker-compose.prod.yml exec api npx tsx prisma/seed.ts
docker compose -f docker-compose.prod.yml restart api worker
```

### Prisma version mismatch errors
If you see error `P1012` mentioning "url is no longer supported", you accidentally ran Prisma 7. Fix:
```bash
# Always pin to v5:
npx prisma@5 db push
# NOT: npx prisma db push  ← this installs latest (v7) which breaks
```

### API container crash-looping (can't exec into it)
If `docker compose exec api ...` fails with "container is restarting":
```bash
# Use `run` instead of `exec` — creates a fresh temporary container:
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma@5 db push --accept-data-loss
# Then restart:
docker compose -f docker-compose.prod.yml restart api worker
```

### Database port not accessible from host
The PostgreSQL port (5432) is NOT exposed to the host — it's internal to Docker. You CANNOT run `prisma db push` from the VPS host directly. Always use Docker `run` or `exec` to run Prisma commands inside the Docker network where `db:5432` resolves.
