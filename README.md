# Cryptonpay — Self-Hosted Crypto Payment Gateway

> Enterprise-grade, non-custodial cryptocurrency payment infrastructure. Accept BTC, ETH, and stablecoins with automatic on-chain verification, HMAC-signed webhooks, and instant settlement.

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
- **Charge Detail** — Full timeline, inbound transactions with confirmation tracking, payment addresses with copy
- **Settlement Settings** — Per-chain settlement addresses, sweep mode (immediate/batched), dust thresholds
- **API Keys** — Scoped (read/write/admin) with rotation, masked display, and audit logging
- **Webhooks** — HMAC-signed endpoints, event subscriptions, test delivery, delivery log with retry status
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
- Expiration countdown timer
- Auto-polling status updates (every 4s)
- Underpaid/overpaid handling with clear messaging
- Redirect on completion

### Live Market Data
- Real-time cryptocurrency prices via CoinGecko API
- 7-day sparkline charts with area gradients
- Market cap, volume, 24h change indicators
- Auto-refresh every 60 seconds

### Documentation (Built-in)
- `/docs/architecture` — System diagram, data flows, Docker network isolation
- `/docs/security` — STRIDE threat model, key management, hardening checklist
- `/docs/schema` — 18-table PostgreSQL schema with indexes and relationships
- `/docs/api` — Full REST API reference, webhook events, authentication methods

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

Includes SSL setup, security hardening, automated backups, health monitoring, and troubleshooting.

---

## 🔐 Security Model

- **Non-custodial:** XPUB-only on server. Private keys never touch the API
- **Isolated signer:** Separate Docker network, only worker process can communicate
- **HMAC webhooks:** SHA-256 signed with timestamp replay protection
- **Scoped API keys:** Hashed (bcrypt/argon2), never stored plaintext
- **Audit logging:** Append-only with actor, IP, timestamp
- **Rate limiting:** Redis-backed per-endpoint rate limits
- **Admin 2FA:** TOTP enforced at login

---

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── CryptonpayLogo.tsx
│   ├── CryptoPriceTicker.tsx
│   ├── DocsNav.tsx
│   ├── StatusBadge.tsx
│   ├── CopyButton.tsx
│   └── ThemeToggle.tsx
├── layouts/           # Dashboard + Admin layouts with sidebars
├── pages/
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── dashboard/     # Merchant dashboard pages
│   ├── admin/         # Admin panel pages
│   ├── checkout/      # Public checkout page
│   └── docs/          # Built-in documentation
├── lib/
│   ├── api-client.ts  # Typed Axios API client
│   ├── auth.tsx       # Auth context + JWT management
│   ├── types.ts       # Full TypeScript type definitions
│   └── utils.ts       # Utility functions
└── hooks/             # Custom React hooks
```

---

## 🌐 API Client

The typed API client (`src/lib/api-client.ts`) covers all endpoints:

```typescript
import { charges, webhooks, apiKeys, settlement, admin } from '@/lib/api-client';

// Create a charge
const charge = await charges.create({ name: 'Order #123', pricing_type: 'fixed_price', local_price: { amount: '99.00', currency: 'USD' } });

// List with filters
const list = await charges.list({ status: 'PENDING', page: 1, per_page: 25 });

// Webhook management
const endpoints = await webhooks.list();
await webhooks.test(endpoints[0].id);
```

Configure via environment variable:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 🎨 Theming

Dual-mode theming (light/dark) with warm off-white light mode and gold-accented dark mode:

- Light: Warm cream backgrounds (`hsl(40, 20%, 96%)`)
- Dark: Deep charcoal with gold accents
- Toggle persisted in localStorage
- Semantic CSS variables in `src/index.css`
- Design tokens in `tailwind.config.ts`

---

## 📄 License

MIT — Deploy anywhere, modify freely, no restrictions.

---

*Built with conviction. Deployed with confidence. Cryptonpay v1.0*
