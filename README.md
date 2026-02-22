# Cryptoniumpay — Crypto Payment Gateway & SaaS Platform

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
- **31+ Routes** — Landing, auth, dashboard, admin, CMS, checkout, docs
- **45+ API Endpoints** — Fully typed Axios client across 15+ namespaces
- **Charge Management** — Create, list, search, filter by status/date, export (CSV/JSON)
- **Hosted Checkout** — Public pay links with QR codes, countdown timer
- **Settlement** — Per-chain settlement addresses, sweep modes
- **API Keys** — Scoped (read/write/admin), masked display
- **Webhooks** — HMAC-signed, test delivery, delivery logs
- **Reports** — Date-range exports with visual charts (volume by day, revenue by asset pie chart)
- **Dashboard** — 6 KPI cards, wallet balance overview, transaction volume charts, quick actions

## 🛡️ For Admins (Platform Owner)

- **Revenue Dashboard** — KPI cards, daily revenue + transaction volume charts, revenue by chain donut chart, top merchants
- **Fee Management** — Global fee rate, per-merchant overrides, min fee threshold
- **Merchant Management** — Enable/disable merchants, view details
- **System Monitoring** — Watcher lag, RPC health, webhook queue depth, 6 KPI cards
- **Chain Config** — Enable/disable chains and assets, RPC management
- **Audit Log** — Append-only, filterable, expandable JSON details

### 📝 Enterprise CMS

- **Content Dashboard** — Overview of all content with quick actions
- **Page Manager** — SEO metadata management, publish/unpublish toggle per page
- **Blog Manager** — Full CRUD for blog/news posts with markdown body, tags, scheduling
- **Announcement Manager** — Site-wide banners with live preview (info/warning/promo types)
- **FAQ Manager** — Category-grouped entries with visibility toggle and sort order
- **CMS Settings** — Global SEO defaults, social URLs, Google Analytics ID, maintenance mode

## 🔍 Advanced SEO

- JSON-LD structured data (Organization, SoftwareApplication, FAQPage)
- Comprehensive Open Graph + Twitter Card meta tags
- Dynamic per-page SEO via `SEOHead` component
- `sitemap.xml`, `manifest.json`, enhanced `robots.txt`
- Performance: `dns-prefetch`, `preconnect`, lazy loading

## 🌐 Social Media

- Footer with Twitter/X, GitHub, Discord, Telegram, LinkedIn icons
- Social share buttons on docs pages
- Configurable social URLs via `constants.ts`

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
| **Charts** | Recharts (Area, Bar, Pie/Donut) |
| **QR Codes** | qrcode.react |
| **Routing** | React Router v6 (31 routes) |
| **Validation** | Zod |
| **HTTP Client** | Axios (typed, 45+ endpoints) |
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
│   ├── components/               # 20+ custom + 45 shadcn/ui components
│   │   ├── SEOHead.tsx           # Dynamic meta tag manager
│   │   ├── SocialLinks.tsx       # Social media icon links
│   │   ├── AnnouncementBanner.tsx # Dismissible site-wide banner
│   │   ├── StatCard.tsx          # KPI card with trend indicator
│   │   ├── AssetDistributionBar.tsx # Crypto holdings bar
│   │   ├── TimeRangeSelector.tsx # 1D/7D/1M/3M/1Y toggle
│   │   ├── QuickActions.tsx      # Dashboard action buttons
│   │   └── ShareBar.tsx          # Share on X + copy link
│   ├── layouts/                  # Dashboard + Admin layouts
│   ├── pages/
│   │   ├── LandingPage.tsx       # Public homepage with pricing + socials
│   │   ├── Login.tsx / Signup.tsx # Auth pages
│   │   ├── dashboard/            # Merchant dashboard (8 pages)
│   │   ├── admin/                # Admin panel (7 pages + 6 CMS pages)
│   │   │   └── cms/              # Content management system
│   │   ├── checkout/             # Public checkout
│   │   └── docs/                 # Built-in documentation (5 pages)
│   ├── lib/
│   │   ├── api-client.ts         # Typed Axios client (45+ endpoints)
│   │   ├── auth.tsx              # AuthProvider + useAuth hook
│   │   ├── types.ts              # Full TypeScript types (CMS, fees, revenue)
│   │   └── constants.ts          # Social URLs, SEO defaults, chain colors
│   └── hooks/                    # Custom React hooks
├── docs/                         # Internal ops docs (backend spec, security, runbook)
├── e2e/                          # Playwright smoke tests
├── public/
│   ├── sitemap.xml               # SEO sitemap
│   ├── manifest.json             # PWA manifest
│   ├── robots.txt                # Enhanced with sitemap reference
│   └── _headers                  # Security headers
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

## 🗺️ Route Map

### Public Routes
| Route | Page |
|-------|------|
| `/` | Landing page with pricing, comparison, socials |
| `/login` | Login |
| `/signup` | Signup with password validation |
| `/pay/:chargeId` | Public checkout |
| `/docs/api` | API reference |
| `/docs/security` | Security docs |
| `/docs/architecture` | Architecture docs |
| `/docs/schema` | Database schema |
| `/docs/singularitycoin` | SingularityCoin protocol |

### Merchant Dashboard (Protected)
| Route | Page |
|-------|------|
| `/dashboard` | Home with 6 KPIs, charts, wallet overview |
| `/dashboard/charges` | Charges list with search, filters, date range |
| `/dashboard/charges/new` | Create charge |
| `/dashboard/charges/:id` | Charge detail |
| `/dashboard/reports` | Reports with charts + CSV/JSON export |
| `/dashboard/settings/settlement` | Settlement config |
| `/dashboard/settings/api-keys` | API key management |
| `/dashboard/settings/webhooks` | Webhook management |
| `/dashboard/settings/addresses` | Address pool |

### Admin Panel (Protected, role=admin)
| Route | Page |
|-------|------|
| `/admin` | System overview with ticker, 6 KPIs, charts |
| `/admin/revenue` | Revenue dashboard with multi-chart layout |
| `/admin/fees` | Fee management |
| `/admin/merchants` | Merchant management |
| `/admin/chains` | Chain & asset configuration |
| `/admin/monitoring` | System monitoring |
| `/admin/audit-log` | Audit log |
| `/admin/cms` | CMS dashboard |
| `/admin/cms/pages` | Page manager |
| `/admin/cms/blog` | Blog post manager |
| `/admin/cms/announcements` | Announcement manager |
| `/admin/cms/faq` | FAQ manager |
| `/admin/cms/settings` | CMS settings |

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
