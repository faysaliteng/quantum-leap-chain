# Cryptoniumpay — Crypto Payment Gateway

> The lowest-fee crypto payment gateway. Accept BTC, ETH, and stablecoins with 0.5% flat fee. No KYC, no monthly fees, instant setup.

[![CI](https://github.com/your-org/cryptoniumpay/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/cryptoniumpay/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)

---

## ✨ Why Cryptoniumpay?

| | Cryptoniumpay | Coinbase Commerce | BitPay | NOWPayments |
|---|---|---|---|---|
| **Fee** | **0.5% flat** | 1.0% | 1.0% | 0.5–1% |
| **KYC Required** | **None** | Full KYB | Full KYB | Partial |
| **Setup Time** | **2 minutes** | Days | Days | Hours |
| **Monthly Fee** | **$0** | $0 | Custom | $0+ |

---

## 🚀 For Merchants

- **Instant Setup** — Create account, get API key, start accepting payments. No company verification.
- **23 Routes** — Landing, auth, dashboard, admin, checkout, docs
- **33+ API Endpoints** — Fully typed Axios client across 10+ namespaces
- **Charge Management** — Create, list, filter, export (CSV/JSON)
- **Hosted Checkout** — Public pay links with QR codes, countdown timer
- **Settlement** — Per-chain settlement addresses, sweep modes
- **API Keys** — Scoped (read/write/admin), masked display
- **Webhooks** — HMAC-signed, test delivery, delivery logs
- **Reports** — Date-range exports in CSV/JSON

## 🛡️ For Admins (Platform Owner)

- **Revenue Dashboard** — Total revenue, daily charts, top merchants by volume
- **Fee Management** — Global fee rate, per-merchant overrides, min fee threshold
- **Merchant Management** — Enable/disable merchants, view details
- **System Monitoring** — Watcher lag, RPC health, webhook queue depth
- **Chain Config** — Enable/disable chains and assets, RPC management
- **Audit Log** — Append-only, filterable, expandable JSON details

## 🔐 Security

- Non-custodial (XPUB-only on server)
- Isolated signer service (separate Docker network)
- HMAC-SHA256 webhook signatures with replay protection
- argon2id password and API key hashing
- JWT with refresh token rotation
- Redis-backed rate limiting
- Strict CSP, HSTS, and security headers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui (45 components) |
| **State** | TanStack React Query |
| **Charts** | Recharts |
| **QR Codes** | qrcode.react |
| **Routing** | React Router v6 (25 routes) |
| **Validation** | Zod |
| **HTTP Client** | Axios (typed, 38+ endpoints) |
| **Animations** | Framer Motion |
| **Backend** | NestJS + Prisma + BullMQ |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7 + BullMQ |
| **CI** | GitHub Actions (lint, typecheck, test, build) |

---

## 📁 Project Structure

```
cryptoniumpay/
├── src/
│   ├── components/               # 13 custom + 45 shadcn/ui components
│   ├── layouts/                  # Dashboard + Admin layouts
│   ├── pages/
│   │   ├── LandingPage.tsx       # Public homepage with pricing
│   │   ├── Login.tsx / Signup.tsx # Auth pages
│   │   ├── dashboard/            # Merchant dashboard (8 pages)
│   │   ├── admin/                # Admin panel (7 pages)
│   │   ├── checkout/             # Public checkout
│   │   └── docs/                 # Built-in documentation (5 pages)
│   ├── lib/
│   │   ├── api-client.ts         # Typed Axios client (38+ endpoints)
│   │   ├── auth.tsx              # AuthProvider + useAuth hook
│   │   └── types.ts              # Full TypeScript types
│   └── hooks/                    # Custom React hooks
├── docs/                         # Internal ops docs (backend spec, security, runbook)
├── e2e/                          # Playwright smoke tests
├── public/                       # Static assets + security headers
└── .github/workflows/            # CI pipeline
```

---

## 📖 Internal Documentation

| Document | Description |
|----------|-------------|
| [**DEVELOPER.md**](./DEVELOPER.md) | Frontend reference: routes, components, types |
| [**docs/BACKEND-SPEC.md**](./docs/BACKEND-SPEC.md) | NestJS backend specification |
| [**docs/API.md**](./docs/API.md) | REST API reference |
| [**docs/SECURITY.md**](./docs/SECURITY.md) | STRIDE threat model, auth flows |
| [**docs/RUNBOOK.md**](./docs/RUNBOOK.md) | Ops: secret rotation, scaling, incidents |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Deployment guide (Cloudflare + VM) |

---

## 🧪 Testing

```bash
npx vitest run          # Unit tests
npx tsc --noEmit        # Type check
npx eslint src/         # Lint
npx playwright test     # E2E smoke tests
```

---

## 📄 License

Proprietary — All rights reserved.

---

*Cryptoniumpay — Accept crypto. Pay less.*
