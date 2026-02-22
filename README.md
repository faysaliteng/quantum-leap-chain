# Cryptonpay — Self-Hosted Crypto Payment Gateway

> Enterprise-grade, non-custodial cryptocurrency payment infrastructure. Accept BTC, ETH, and stablecoins with automatic on-chain verification, HMAC-signed webhooks, and instant settlement.

[![CI](https://github.com/your-org/cryptonpay/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/cryptonpay/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)

---

## 🏗️ Architecture

```
Browser → Nginx (TLS) → React SPA + API → Worker → PostgreSQL + Redis
                                              ↓
                                    Isolated Signer (private keys)
```

**Three isolated Docker networks:**
- `frontend_net` — Nginx + API (browser-facing)
- `backend_net` — API + Worker + PostgreSQL + Redis (no internet)
- `signer_net` — Worker + Signer only (maximum isolation)

---

## ✨ Features

### Merchant Dashboard
- **Charge Management** — Create, list, filter, search, and export charges (CSV/JSON)
- **Charge Detail** — Full timeline, inbound transactions with confirmation tracking
- **Settlement Settings** — Per-chain settlement addresses, sweep mode, dust thresholds
- **API Keys** — Scoped (read/write/admin) with rotation, masked display, audit logging
- **Webhooks** — HMAC-signed endpoints, event subscriptions, test delivery, delivery log
- **Address Pool** — Upload pre-generated deposit addresses via CSV, pool status per chain
- **Reports** — Date-range filtered exports in CSV/JSON

### Admin Dashboard
- **System Overview** — Watcher lag per chain, RPC health, webhook queue depth
- **Merchant Management** — List, search, enable/disable merchants
- **Chain & Asset Config** — Enable/disable chains, manage RPC endpoints, set confirmation thresholds
- **System Monitoring** — Real-time watcher checkpoints, RPC latency, webhook queue stats
- **Audit Log** — Append-only, filterable by actor/action/date, expandable JSON details

### Hosted Checkout (`/pay/:chargeId`)
- Public page, no auth required
- Chain/asset selector, QR code, copy address, exact amount display
- Expiration countdown timer, auto-polling status updates (every 4s)

### Live Market Data
- Real-time cryptocurrency prices via CoinGecko API
- 7-day sparkline charts, market cap, volume, 24h change

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/your-org/cryptonpay.git
cd cryptonpay

# Install
npm install

# Development
npm run dev
# Opens at http://localhost:8080

# Production build
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

---

## 📦 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for atomic, step-by-step instructions covering:

- **Option A:** Cloudflare Pages (CDN) + Workers (API)
- **Option B:** VM with Docker Compose (full self-hosted stack)

---

## 📖 For Developers

| Document | Description |
|----------|-------------|
| **[DEVELOPER.md](./DEVELOPER.md)** | Atomic-level frontend reference (routes, components, types, hooks, API client) |
| **[docs/BACKEND-SPEC.md](./docs/BACKEND-SPEC.md)** | Complete NestJS backend specification (33 endpoints, 18 tables, Prisma schema) |
| **[docs/API.md](./docs/API.md)** | REST API reference with curl examples for every endpoint |
| **[docs/SECURITY.md](./docs/SECURITY.md)** | Threat model, auth flows, webhook signing, secrets handling |
| **[docs/RUNBOOK.md](./docs/RUNBOOK.md)** | Operational procedures: secret rotation, scaling, incident response |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Full deployment guide (Cloudflare + VM/Docker) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack React Query |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Routing | React Router v6 |
| Validation | Zod |
| HTTP | Axios (typed API client) |

---

## 🔐 Security Model

- **Non-custodial:** XPUB-only on server, private keys never touch the API
- **Isolated signer:** Separate Docker network, only worker can communicate
- **HMAC webhooks:** SHA-256 signed with timestamp replay protection
- **Scoped API keys:** Hashed (argon2id), never stored plaintext
- **Audit logging:** Append-only with actor, IP, timestamp
- **Rate limiting:** Redis-backed per-endpoint rate limits

See **[docs/SECURITY.md](./docs/SECURITY.md)** for the full threat model.

---

## 📁 Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components (13 custom + 45 shadcn/ui)
│   ├── layouts/            # Dashboard + Admin layouts
│   ├── pages/              # 18 pages across 23 routes
│   ├── lib/                # API client, auth, types, utils
│   └── hooks/              # Custom React hooks
├── docs/                   # Backend spec, API ref, security, runbook
├── e2e/                    # Playwright smoke tests
├── public/                 # Static assets, security headers, redirects
└── .github/workflows/      # CI pipeline
```

---

## 🌐 API Client

```typescript
import { charges, webhooks, apiKeys } from '@/lib/api-client';

const charge = await charges.create({ name: 'Order #123', pricing_type: 'fixed_price', local_price: { amount: '99.00', currency: 'USD' } });
const list = await charges.list({ status: 'PENDING', page: 1, per_page: 25 });
```

---

## 📄 License

MIT — Deploy anywhere, modify freely, no restrictions.

---

*Built with conviction. Deployed with confidence. Cryptonpay v1.0*
