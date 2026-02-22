# Cryptoniumpay — Self-Hosted Crypto Payment Gateway

> Enterprise-grade, non-custodial cryptocurrency payment infrastructure. Accept BTC, ETH, and stablecoins with automatic on-chain verification, HMAC-signed webhooks, and instant settlement.

[![CI](https://github.com/your-org/cryptoniumpay/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/cryptoniumpay/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  React SPA → Axios → JWT Bearer Auth → Backend API          │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────▼──────────┐    ┌──────────────────────────┐
    │   Nginx (TLS)       │    │   Cloudflare CDN/Worker  │
    │   Reverse Proxy     │ OR │   Pages + Worker Gateway │
    └──────────┬──────────┘    └──────────┬───────────────┘
               │                          │
    ┌──────────▼──────────────────────────▼───────────────┐
    │                  Backend API (NestJS)                │
    │   Auth · Charges · Webhooks · Admin · Settlement    │
    └──────┬─────────────────────┬────────────────────────┘
           │                     │
    ┌──────▼──────┐    ┌────────▼────────┐
    │  PostgreSQL │    │   Redis/BullMQ  │
    │  16 Alpine  │    │   Job Queues    │
    └─────────────┘    └────────┬────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Worker Process      │
                    │   Watchers · Webhooks │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Isolated Signer     │
                    │   (separate network)  │
                    └───────────────────────┘
```

**Three isolated Docker networks:**
- `frontend_net` — Nginx + API (browser-facing)
- `backend_net` — API + Worker + PostgreSQL + Redis (no internet access)
- `signer_net` — Worker + Signer only (maximum isolation for private keys)

---

## ✨ Features

### For Merchants
- **23 Routes** — Landing, auth, dashboard, admin, checkout, docs
- **33 API Endpoints** — Fully typed Axios client across 10 namespaces
- **Charge Management** — Create, list, filter, export (CSV/JSON)
- **Hosted Checkout** — Public pay links with QR codes, countdown timer
- **Settlement** — Per-chain settlement addresses, sweep modes
- **API Keys** — Scoped (read/write/admin), masked display
- **Webhooks** — HMAC-signed, test delivery, delivery logs
- **Reports** — Date-range exports in CSV/JSON

### For Admins
- **System Monitoring** — Watcher lag, RPC health, webhook queue depth
- **Merchant Management** — Enable/disable merchants
- **Chain Config** — Enable/disable chains and assets, RPC management
- **Audit Log** — Append-only, filterable, expandable JSON details

### Security
- Non-custodial (XPUB-only on server)
- Isolated signer service (separate Docker network)
- HMAC-SHA256 webhook signatures with replay protection
- argon2id password and API key hashing
- JWT with refresh token rotation
- Redis-backed rate limiting
- Strict CSP, HSTS, and security headers

---

## 🚀 Quick Start (Frontend)

```bash
# Clone
git clone https://github.com/your-org/cryptoniumpay.git
cd cryptoniumpay

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:8080

# Run tests
npx vitest run

# Production build
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

---

## 📦 Deployment Options

| Option | Best For | Guide |
|--------|----------|-------|
| **Cloudflare Pages + Workers** | Global CDN, low latency, zero-ops frontend | [DEPLOYMENT.md §2](./DEPLOYMENT.md#2-option-a-cloudflare-pages--workers-gateway) |
| **VM + Docker Compose** | Full control, single-server, self-hosted | [DEPLOYMENT.md §3](./DEPLOYMENT.md#3-option-b-vm-with-docker-compose-full-stack) |

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for atomic, A-Z instructions with copy-paste commands.

---

## 📖 Developer Documentation

| Document | Lines | Description |
|----------|-------|-------------|
| [**DEVELOPER.md**](./DEVELOPER.md) | 768 | Atomic frontend reference: every route, component, type, hook |
| [**docs/BACKEND-SPEC.md**](./docs/BACKEND-SPEC.md) | 450+ | NestJS backend specification: 18 Prisma tables, 33 endpoints |
| [**docs/API.md**](./docs/API.md) | 350+ | REST API reference with curl examples |
| [**docs/SECURITY.md**](./docs/SECURITY.md) | 250+ | STRIDE threat model, auth flows, hardening checklist |
| [**docs/RUNBOOK.md**](./docs/RUNBOOK.md) | 300+ | Ops procedures: secret rotation, scaling, incident response |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | 700+ | Full deployment guide with atomic steps |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui (45 components) |
| **State** | TanStack React Query |
| **Charts** | Recharts (sparklines, area charts) |
| **QR Codes** | qrcode.react |
| **Routing** | React Router v6 (23 routes) |
| **Validation** | Zod |
| **HTTP Client** | Axios (typed, 33 endpoints) |
| **Animations** | Framer Motion |
| **Backend** | NestJS + Prisma + BullMQ (specified, separate repo) |
| **Database** | PostgreSQL 16 (18 tables) |
| **Cache/Queue** | Redis 7 + BullMQ |
| **CI** | GitHub Actions (lint, typecheck, test, build) |
| **E2E** | Playwright (smoke tests) |

---

## 📁 Project Structure

```
cryptoniumpay/
├── src/                          # React frontend source
│   ├── components/               # 13 custom + 45 shadcn/ui components
│   │   ├── OfflineBanner.tsx     # Global offline detection
│   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   ├── ProtectedRoute.tsx    # Auth guard with role check
│   │   ├── CryptoPriceTicker.tsx # Live crypto prices
│   │   └── ui/                   # shadcn/ui primitives
│   ├── layouts/                  # Dashboard + Admin layouts
│   ├── pages/                    # 19 pages across 23 routes
│   │   ├── LandingPage.tsx       # Public homepage
│   │   ├── Login.tsx             # Login form
│   │   ├── Signup.tsx            # Registration with Zod validation
│   │   ├── dashboard/            # Merchant dashboard (8 pages)
│   │   ├── admin/                # Admin panel (5 pages)
│   │   ├── checkout/             # Public checkout
│   │   └── docs/                 # Built-in documentation (5 pages)
│   ├── lib/
│   │   ├── api-client.ts         # Typed Axios client (33 endpoints)
│   │   ├── auth.tsx              # AuthProvider + useAuth hook
│   │   └── types.ts              # Full TypeScript types
│   └── hooks/                    # Custom React hooks
├── docs/                         # Backend spec, API ref, security, runbook
├── e2e/                          # Playwright smoke tests
├── public/                       # Static assets + security headers
├── .github/workflows/            # CI pipeline
├── DEPLOYMENT.md                 # Enterprise deployment guide
├── DEVELOPER.md                  # Atomic developer reference
└── README.md                     # This file
```

---

## 🔐 Security

See **[docs/SECURITY.md](./docs/SECURITY.md)** for the complete threat model.

**Quick checklist:**
- ✅ Non-custodial — private keys never touch the API
- ✅ Signer isolated on separate Docker network
- ✅ JWT with 15-min expiry + refresh rotation
- ✅ API keys hashed with argon2id
- ✅ HMAC-SHA256 webhook signatures
- ✅ Rate limiting on all endpoints
- ✅ Audit logging for admin actions
- ✅ CSP, HSTS, X-Frame-Options headers
- ✅ Offline detection banner in frontend
- ✅ Zod validation on all forms

---

## 🧪 Testing

```bash
# Unit tests
npx vitest run

# Type check
npx tsc --noEmit

# Lint
npx eslint src/

# E2E smoke tests (requires Playwright)
npx playwright test --config=e2e/playwright.config.ts
```

---

## 📄 License

MIT — Deploy anywhere, modify freely, no restrictions.

---

**No Lovable. No Supabase. No Firebase. 100% self-hosted.**

*Built with conviction. Deployed with confidence. Cryptoniumpay v1.0*
