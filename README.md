# Cryptoniumpay — Crypto Payment Gateway & SaaS Platform

> The lowest-fee crypto payment gateway. Accept BTC, ETH, and stablecoins with 0.5% flat fee. No KYC, no monthly fees, instant setup.

[![CI](https://github.com/faysaliteng/quantum-leap-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/faysaliteng/quantum-leap-chain/actions/workflows/ci.yml)
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
- **61 Routes** — Landing, auth, dashboard, admin, CMS, checkout, docs, pricing, blog, contact, notifications, security, exports, intelligence
- **50+ API Endpoints** — Fully typed Axios client across 20+ namespaces
- **Charge Management** — Create, list, search, filter by status/date, export (CSV/JSON, client + server-side)
- **Invoice Management** — Create, send, track, PDF download with full lifecycle
- **Hosted Checkout** — Public pay links with QR codes, countdown timer, multi-chain selector
- **Wallet Management** — WalletConnect v2, Ledger, Trezor, Keystone USB, manual import. Send/receive/withdraw with hardware signing for cold wallets.
- **Wallet Transaction History** — Full send/receive/withdraw audit trail with explorer links, status timeline, cursor pagination
- **Data Export Center** — Server-side async exports (CSV/JSON) for charges, invoices, wallet transactions, webhook deliveries. Job queue with status tracking and downloadable files.
- **Settlement** — Per-chain settlement addresses, sweep modes
- **API Keys** — Scoped (read/write/admin), masked display, rotation tracking
- **Webhooks** — HMAC-signed, test delivery, delivery logs, export deliveries
- **Reports** — Date-range exports with visual charts (volume by day, revenue by asset pie chart)
- **Dashboard** — 6 KPI cards, wallet balance overview, transaction volume charts, quick actions
- **Notification Center** — Real-time bell icon with unread badge, notification drawer, preferences management
- **Security Settings** — 2FA (TOTP), backup codes, email verification, session management, password change
- **Password Reset** — Forgot password / reset password flow with secure single-use tokens, anti-enumeration

## 🛡️ For Admins (Platform Owner)

- **Revenue Dashboard** — KPI cards, daily revenue + transaction volume charts, revenue by chain donut chart, top merchants, server-side export
- **Fee Management** — Global fee rate, per-merchant overrides, min fee threshold
- **Merchant Management** — Enable/disable merchants, KPI cards (total/active/disabled), server-side export
- **Wallet Management** — Hot wallet & cold wallet connect via WalletConnect v2 + hardware wallets, XPUB monitoring, balance tracking, lock/unlock, send/withdraw with audit notes
- **Wallet Transaction Audit** — Full platform-wide wallet transaction history with filtering, server-side export
- **Data Export Center** — Server-side async exports for merchants, audit logs, revenue reports, health snapshots. BullMQ job queue with status tracking.
- **System Monitoring** — Watcher lag, RPC health, webhook queue depth, uptime, health snapshot export
- **Chain Config** — Enable/disable chains and assets, RPC management
- **Audit Log** — Append-only, filterable, expandable JSON details, server-side export
- **Security Policies** — Centralized password policy, session policy, access control (maintenance mode, IP allowlist, geo blocking), rate limiting
- **Role & Permission Management** — Fine-grained RBAC with 20 permissions, role CRUD, team invites, permission matrix
- **Notification Center** — Admin-scoped notifications with preferences

### 📝 Enterprise CMS

- **Content Dashboard** — Overview of all content with quick actions and unread contact badges
- **Page Manager** — SEO metadata management, publish/unpublish toggle per page
- **Blog Manager** — Full CRUD for blog/news posts with markdown body, tags, scheduling
- **Announcement Manager** — Site-wide banners with live preview (info/warning/promo types)
- **FAQ Manager** — Category-grouped entries with visibility toggle and sort order
- **Contact Inbox** — View/manage contact form submissions, add notes, reply via email, archive
- **Social Links Manager** — Manage all social platform URLs (8 default + custom) with live preview
- **CMS Settings** — Global SEO defaults, social URLs, Google Analytics ID, maintenance mode

### 💰 Wallet Architecture

- **WalletConnect v2** — Trust Wallet, MetaMask, Rainbow, Coinbase, Phantom, OKX + 300 more
- **Hardware Wallets** — Ledger USB, Trezor USB, Keystone QR, GridPlus Lattice
- **Hot Wallets** — Online wallets for automated payment processing and sweeps
- **Cold Wallets** — Watch-only (XPUB) wallets with hardware signing for withdrawals
- **Non-Custodial** — Private keys NEVER stored on the server; only addresses/XPUBs registered
- **Multi-Chain** — BTC, ETH, Arbitrum, Optimism, Polygon supported
- **Enterprise Security** — AES-256-GCM encryption, HSM storage, multi-sig support, withdrawal limits, 2FA-required private key exports

## 🌐 Public Pages

- **Landing Page** — Hero, pricing comparison, features, trust stats, developer resources, social footer, live crypto ticker
- **Pricing** — 0.5% flat fee comparison table vs competitors, volume discount tiers, interactive fee calculator
- **Blog** — Article listings with category filters, featured posts, social CTA
- **FAQ** — Category-grouped expandable entries
- **Contact** — Zod-validated form with subject selector, enterprise email, office address, response time
- **Terms of Service** & **Privacy Policy**

## 🔍 Advanced SEO

- JSON-LD structured data (Organization, SoftwareApplication, FAQPage)
- Comprehensive Open Graph + Twitter Card meta tags
- Dynamic per-page SEO via `SEOHead` component
- `sitemap.xml`, `manifest.json`, enhanced `robots.txt`
- Performance: `dns-prefetch`, `preconnect`, lazy loading

## 🔐 Security

- **Authentication** — JWT with refresh token rotation, 3-step MFA (password → email OTP → TOTP 2FA)
- **Authorization** — Role-based access control (merchant/admin) with fine-grained permissions (20 permission types)
- **Non-custodial** — XPUB-only on server, isolated signer service
- **Webhook Security** — HMAC-SHA256 signatures with timestamp-based replay protection
- **Password Hashing** — argon2id for passwords and API key hashing
- **Admin Security Policies** — Centralized password rules, session limits, IP allowlisting, geo blocking, rate limits
- **Infrastructure** — Redis-backed rate limiting, strict CSP, HSTS, security headers
- **Wallet Security** — AES-256-GCM, HSM, hardware signing, multi-sig, withdrawal limits

## ⚙️ Zero External Dependencies

- **No Lovable dependency** — Fully self-hosted frontend + backend
- **No Supabase dependency** — PostgreSQL + Redis self-managed
- **No third-party auth** — Custom JWT auth with refresh tokens
- **Deployment:** Cloudflare Pages + Workers OR Docker Compose on VM

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui (45+ components) |
| **State** | TanStack React Query |
| **Charts** | Recharts (Area, Bar, Pie/Donut) |
| **QR Codes** | qrcode.react |
| **Routing** | React Router v6 (61 routes) |
| **Validation** | Zod |
| **HTTP Client** | Axios (typed, 50+ endpoints) |
| **Animations** | Framer Motion |
| **i18n** | 10 languages (en, es, fr, de, ja, zh, ko, pt, ar RTL, ru) |
| **Backend** | NestJS + Prisma + BullMQ |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7 + BullMQ |
| **CI** | GitHub Actions (lint, typecheck, test, build, log grep gate) |

---

## 📁 Project Structure

```
cryptoniumpay/
├── src/
│   ├── components/               # 30+ custom + 45 shadcn/ui components
│   │   ├── SEOHead.tsx           # Dynamic meta tag manager
│   │   ├── NotificationBell.tsx  # Real-time notification bell + drawer
│   │   ├── WalletConnectPanel.tsx # WalletConnect v2 + hardware wallet dialog
│   │   ├── SocialLinks.tsx       # Social media icon links
│   │   ├── AnnouncementBanner.tsx # Dismissible site-wide banner
│   │   ├── StatCard.tsx          # KPI card with trend indicator
│   │   ├── AssetDistributionBar.tsx # Crypto holdings bar
│   │   ├── TimeRangeSelector.tsx # 1D/7D/1M/3M/1Y toggle
│   │   ├── QuickActions.tsx      # Dashboard action buttons
│   │   ├── MerchantSidebar.tsx   # Merchant dashboard navigation
│   │   ├── AdminSidebar.tsx      # Admin panel navigation
│   │   └── ShareBar.tsx          # Share on X + copy link
│   ├── layouts/                  # Dashboard + Admin layouts with notification bell
│   ├── pages/
│   │   ├── LandingPage.tsx       # Public homepage with pricing + socials
│   │   ├── Pricing.tsx           # Fee comparison + calculator
│   │   ├── Blog.tsx              # Article listings + categories
│   │   ├── FAQ.tsx               # Expandable FAQ sections
│   │   ├── Contact.tsx           # Contact form + office info
│   │   ├── Login.tsx / Signup.tsx # Auth pages with 3-step MFA
│   │   ├── dashboard/            # Merchant dashboard (15 pages)
│   │   │   ├── DashboardHome.tsx # 6 KPIs, charts, wallet overview
│   │   │   ├── MerchantWallets.tsx # Full wallet management
│   │   │   ├── WalletTransactionHistory.tsx # Tx history with filters
│   │   │   ├── NotificationsPage.tsx # Notification center + preferences
│   │   │   ├── InvoicesList.tsx  # Invoice management
│   │   │   └── settings/        # Settlement, API Keys, Webhooks, Addresses, Security
│   │   ├── admin/                # Admin panel (16 pages)
│   │   │   ├── AdminHome.tsx     # System overview with live ticker
│   │   │   ├── WalletManagement.tsx # Platform wallet admin
│   │   │   ├── WalletTransactions.tsx # Wallet tx audit view
│   │   │   ├── SecurityPolicies.tsx # Password/session/access/rate policies
│   │   │   ├── RoleManagement.tsx # RBAC roles + team invites
│   │   │   └── cms/              # 8 CMS pages
│   │   ├── checkout/             # Public checkout with QR + countdown
│   │   └── docs/                 # Built-in documentation (5 pages)
│   ├── lib/
│   │   ├── api-client.ts         # Typed Axios client (50+ endpoints)
│   │   ├── api-extended.ts       # Notifications, security policies, wallet tx, roles API
│   │   ├── auth.tsx              # AuthProvider + useAuth hook
│   │   ├── types.ts              # Core TypeScript types
│   │   ├── types-extended.ts     # Notification, security policy, role types
│   │   ├── i18n.tsx              # Internationalization (10 languages)
│   │   └── constants.ts          # Social URLs, SEO defaults, chain colors
│   └── hooks/                    # Custom React hooks
├── docs/                         # Internal ops docs (backend spec, security, runbook)
├── e2e/                          # Playwright smoke tests (route manifest + specs)
├── public/
│   ├── sitemap.xml               # SEO sitemap
│   ├── manifest.json             # PWA manifest
│   ├── robots.txt                # Enhanced with sitemap reference
│   └── _headers                  # Security headers
└── .github/workflows/            # CI pipeline with log grep gate
```

---

## 📖 Internal Documentation

| Document | Description |
|----------|-------------|
| [**DEVELOPER.md**](./DEVELOPER.md) | Frontend reference: routes, components, types |
| [**DEPLOYMENT-SUCCESS.md**](./DEPLOYMENT-SUCCESS.md) | Verified deployment log with all commands |
| [**docs/BACKEND-SPEC.md**](./docs/BACKEND-SPEC.md) | NestJS backend specification (42 Prisma models) |
| [**docs/API.md**](./docs/API.md) | REST API reference (55+ endpoints) |
| [**docs/SECURITY.md**](./docs/SECURITY.md) | STRIDE threat model, auth flows, wallet security |
| [**docs/RUNBOOK.md**](./docs/RUNBOOK.md) | Ops: secret rotation, scaling, incidents, CI failures |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Deployment guide (Cloudflare + VM) |
| [**docs/KUBERNETES-GUIDE.md**](./docs/KUBERNETES-GUIDE.md) | Kubernetes (K3s) self-hosting guide |
| [**docs/MERCHANT-GUIDE.md**](./docs/MERCHANT-GUIDE.md) | Merchant integration guide (API keys, charges, webhooks, code examples) |

---

## 🗺️ Route Map (61 Routes)

### Public Routes (14)
| Route | Page |
|-------|------|
| `/` | Landing page with pricing, comparison, live crypto ticker, socials |
| `/pricing` | Fee comparison table, volume tiers, interactive fee calculator |
| `/blog` | Article listings with category filters |
| `/faq` | FAQ with expandable category-grouped entries |
| `/contact` | Contact form with enterprise info |
| `/login` | Login with 3-step MFA support + forgot password link |
| `/signup` | Signup with Zod password validation |
| `/verify-email` | Email OTP verification step |
| `/verify-2fa` | TOTP 2FA verification step |
| `/forgot-password` | Forgot password (anti-enumeration) |
| `/reset-password` | Reset password with strength meter |
| `/pay/:chargeId` | Public checkout with QR code + countdown |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |

### Documentation Routes (5)
| Route | Page |
|-------|------|
| `/docs/api` | API reference |
| `/docs/security` | Security documentation |
| `/docs/architecture` | Architecture overview |
| `/docs/schema` | Database schema |
| `/docs/singularitycoin` | SingularityCoin protocol |

### Merchant Dashboard (18, Protected)
| Route | Page |
|-------|------|
| `/dashboard` | Home with 6 KPIs, charts, wallet overview, quick actions |
| `/dashboard/charges` | Charges list with search, filters, date range, server export |
| `/dashboard/charges/new` | Create charge |
| `/dashboard/charges/:id` | Charge detail |
| `/dashboard/invoices` | Invoice list with status filters + server export |
| `/dashboard/invoices/new` | Create invoice |
| `/dashboard/invoices/:id` | Invoice detail |
| `/dashboard/reports` | Reports with charts + CSV/JSON export |
| `/dashboard/wallets` | Wallet management (WalletConnect + hardware + send/receive) |
| `/dashboard/wallets/transactions` | Wallet transaction history with filters + server export |
| `/dashboard/notifications` | Notification center + preferences |
| `/dashboard/exports` | Export center — job list, status, downloads |
| `/dashboard/intelligence` | Predictive analytics dashboard |
| `/dashboard/settings/settlement` | Settlement config |
| `/dashboard/settings/api-keys` | API key management |
| `/dashboard/settings/webhooks` | Webhook management + delivery export |
| `/dashboard/settings/addresses` | Address pool |
| `/dashboard/settings/security` | Security settings (2FA, sessions, password) |

### Admin Panel (23, Protected, role=admin)
| Route | Page |
|-------|------|
| `/admin` | System overview with live ticker, 6 KPIs, charts |
| `/admin/revenue` | Revenue dashboard with multi-chart layout + export |
| `/admin/fees` | Fee management (global + per-merchant overrides) |
| `/admin/merchants` | Merchant management with KPIs + export |
| `/admin/chains` | Chain & asset configuration |
| `/admin/wallets` | Platform wallet management (connect, send, lock) |
| `/admin/wallets/transactions` | Wallet transaction audit view + export |
| `/admin/monitoring` | System monitoring (watchers, RPC, webhooks) + health snapshot export |
| `/admin/audit-log` | Audit log + export |
| `/admin/security-policies` | Security policies (password, session, access, rate limits) |
| `/admin/roles` | Role & permission management + team invites |
| `/admin/notifications` | Admin notification center |
| `/admin/exports` | Admin export center — job list, status, downloads |
| `/admin/intelligence` | Admin predictive analytics |
| `/admin/api-settings` | API configuration settings |
| `/admin/cms` | CMS dashboard |
| `/admin/cms/pages` | Page manager |
| `/admin/cms/blog` | Blog post manager |
| `/admin/cms/announcements` | Announcement manager |
| `/admin/cms/faq` | FAQ manager |
| `/admin/cms/contacts` | Contact form submissions inbox |
| `/admin/cms/social` | Social media links manager |
| `/admin/cms/settings` | CMS settings |

### Error Routes (1)
| Route | Page |
|-------|------|
| `*` | 404 Not Found |

---

## 🧪 Testing

```bash
npx vitest run          # Unit tests
npx tsc --noEmit        # Type check
npx eslint src/         # Lint
npx playwright test     # E2E smoke tests
```

---

## 📊 Platform Metrics

| Metric | Count |
|--------|-------|
| Routes | 61 |
| Source files | 100+ |
| Custom components | 35+ |
| shadcn/ui primitives | 45 |
| API endpoints | 55+ |
| TypeScript interfaces | 65+ |
| Documentation files | 6 |
| Languages (i18n) | 10 |
| Wallet connect methods | WalletConnect v2 + Ledger + Trezor + Keystone + GridPlus + Manual |
| Admin permissions | 20 fine-grained RBAC permissions |
| Server-side export types | 8 (charges, invoices, wallet_tx, webhook_deliveries, merchants, audit_logs, revenue, health_snapshot) |
| External SaaS deps | 0 |

---

## 📄 License

Proprietary — All rights reserved.

---

*Cryptoniumpay — Accept crypto. Pay less.*
