# Cryptoniumpay — Developer Reference (Atomic Detail)

> Complete technical inventory of every file, route, component, type, hook, and design token in the Cryptoniumpay frontend codebase. This document is the single source of truth for developers onboarding to the project.

**Last updated:** 2026-02-23  
**Frontend version:** 2.0.0  
**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Tree (Complete)](#2-file-tree-complete)
3. [Route Map](#3-route-map)
4. [Authentication System](#4-authentication-system)
5. [Pages — Detailed Breakdown](#5-pages--detailed-breakdown)
6. [Layouts](#6-layouts)
7. [Components — Custom](#7-components--custom)
8. [Components — shadcn/ui Primitives](#8-components--shadcnui-primitives)
9. [Hooks](#9-hooks)
10. [API Client](#10-api-client)
11. [Type System](#11-type-system)
12. [Design System & Theming](#12-design-system--theming)
13. [Typography](#13-typography)
14. [Build & Dev Commands](#14-build--dev-commands)
15. [Dependencies (All)](#15-dependencies-all)
16. [Environment Variables](#16-environment-variables)
17. [Security Considerations (Frontend)](#17-security-considerations-frontend)
18. [Testing](#18-testing)
19. [Deployment Files](#19-deployment-files)
20. [SingularityCoin Protocol](#20-singularitycoin-protocol)
21. [Backend Integration](#21-backend-integration)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER (Client)                  │
│                                                     │
│  React SPA ──▶ Axios API Client ──▶ Backend API     │
│       │                                  │          │
│  React Router v6                   JWT Bearer Auth  │
│  TanStack Query (cache)                             │
│  Tailwind CSS + shadcn/ui                           │
│  Framer Motion (animations)                         │
│  Recharts (charts)                                  │
│  qrcode.react (QR codes)                            │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────┐    ┌────────────────────────┐
│  CoinGecko API        │    │  Backend API Server    │
│  (public, no key)     │    │  (self-hosted)         │
│  GET /api/v3/coins/   │    │  All /api/* endpoints  │
│  markets?vs=usd&...   │    │  JWT auth required     │
└───────────────────────┘    └────────────────────────┘
```

### Data Flow

1. **User opens app** → React Router resolves route → renders page component
2. **Page mounts** → TanStack Query fires `queryFn` → Axios sends HTTP request to `VITE_API_BASE_URL`
3. **Auth check** → `useAuth()` reads JWT from `localStorage` → Axios interceptor attaches `Authorization: Bearer <token>`
4. **401 response** → Axios response interceptor clears token, redirects to `/login`
5. **Live prices** → `CryptoPriceTicker` fetches from CoinGecko public API every 60s (no auth needed)

---

## 2. File Tree (Complete)

```
cryptoniumpay/
├── index.html                          # HTML entry point + meta tags + favicon
├── package.json                        # Dependencies & scripts (read-only)
├── vite.config.ts                      # Vite build config (port 8080, path alias @/)
├── tailwind.config.ts                  # Tailwind design tokens + extended theme
├── tsconfig.json                       # TS project references
├── tsconfig.app.json                   # App-level TS config
├── tsconfig.node.json                  # Node-level TS config
├── postcss.config.js                   # PostCSS (Tailwind + autoprefixer)
├── eslint.config.js                    # ESLint config
├── vitest.config.ts                    # Vitest test runner config
├── components.json                     # shadcn/ui config (New York style, HSL)
├── README.md                           # Project overview + quick start
├── DEPLOYMENT.md                       # Full deployment guide (812 lines)
├── DEVELOPER.md                        # THIS FILE — atomic dev reference
│
├── public/
│   ├── favicon.ico                     # Legacy favicon
│   ├── favicon.png                     # Custom CP monogram favicon (512×512)
│   ├── placeholder.svg                 # Placeholder image
│   ├── robots.txt                      # Search engine crawl rules (+ sitemap ref)
│   ├── sitemap.xml                     # SEO sitemap for all public routes
│   ├── manifest.json                   # PWA manifest for mobile indexing
│   ├── _redirects                      # Cloudflare/Netlify SPA redirect rule
│   └── _headers                        # Security headers (X-Frame, CSP, etc.)
│
├── src/
│   ├── main.tsx                        # React DOM entry point
│   ├── App.tsx                         # Root component: providers + route tree
│   ├── index.css                       # Global styles: CSS vars, fonts, utilities
│   ├── vite-env.d.ts                   # Vite type declarations
│   │
│   ├── assets/
│   │   └── logo-icon.png              # Brand logo (CP monogram, 512×512)
│   │
│   ├── lib/
│   │   ├── api-client.ts              # Axios HTTP client + all API namespaces (45+ endpoints)
│   │   ├── auth.tsx                    # AuthProvider context + useAuth hook
│   │   ├── constants.ts               # Social URLs, SEO defaults, chain colors
│   │   ├── types.ts                   # All TypeScript interfaces + enums (CMS, fees, revenue)
│   │   └── utils.ts                   # cn() utility (clsx + tailwind-merge)
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx             # useIsMobile() — 768px breakpoint
│   │   ├── use-page-title.ts          # usePageTitle() — sets document.title
│   │   └── use-toast.ts              # useToast() — toast notification system
│   │
│   ├── layouts/
│   │   ├── DashboardLayout.tsx        # Merchant sidebar + header + <Outlet>
│   │   └── AdminLayout.tsx            # Admin sidebar + header + <Outlet>
│   │
│   ├── components/
│   │   ├── CryptoniumpayLogo.tsx       # Brand logo (img + text, 4 sizes)
│   │   ├── CryptoPriceTicker.tsx      # Live crypto prices from CoinGecko
│   │   ├── CopyButton.tsx             # Click-to-copy with feedback
│   │   ├── DocsNav.tsx                # Documentation navigation sidebar
│   │   ├── ErrorBoundary.tsx          # React error boundary wrapper
│   │   ├── MerchantSidebar.tsx        # Merchant dashboard sidebar nav
│   │   ├── AdminSidebar.tsx           # Admin panel sidebar nav (+ CMS group)
│   │   ├── NavLink.tsx                # Active-aware navigation link
│   │   ├── PageSkeleton.tsx           # Loading skeleton (page + table variants)
│   │   ├── ProtectedRoute.tsx         # Auth guard with optional role check
│   │   ├── StatusBadge.tsx            # Charge status → colored badge
│   │   ├── ThemeToggle.tsx            # Light/dark mode toggle
│   │   ├── SEOHead.tsx                # Dynamic per-page meta tags (title, OG, Twitter)
│   │   ├── SocialLinks.tsx            # Social media icon links (X, GitHub, Discord, etc.)
│   │   ├── AnnouncementBanner.tsx     # Dismissible site-wide announcement banner
│   │   ├── StatCard.tsx               # KPI stat card with trend indicator
│   │   ├── AssetDistributionBar.tsx   # Colored stacked bar for crypto holdings
│   │   ├── TimeRangeSelector.tsx      # 1D/7D/1M/3M/1Y toggle tabs
│   │   ├── QuickActions.tsx           # Dashboard quick action buttons
│   │   ├── ShareBar.tsx               # Share on X + copy link for docs pages
│   │   ├── OfflineBanner.tsx          # Offline connectivity banner
│   │   └── ui/                        # 45 shadcn/ui primitive components
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── tooltip.tsx
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx            # Public homepage with hero + features + prices + socials
│   │   ├── Login.tsx                  # Login form with SEO
│   │   ├── Signup.tsx                 # Signup with Zod validation + password checks
│   │   ├── NotFound.tsx               # 404 page with SEO
│   │   ├── checkout/
│   │   │   └── CheckoutPage.tsx       # Public payment page (/pay/:chargeId)
│   │   ├── docs/
│   │   │   ├── ArchitectureDocs.tsx   # Architecture docs + SEO + share
│   │   │   ├── SecurityDocs.tsx       # Security docs + SEO + share
│   │   │   ├── SchemaDocs.tsx         # Schema docs (18 tables) + SEO + share
│   │   │   ├── ApiDocs.tsx            # API reference + SEO + share
│   │   │   └── SingularityCoinDocs.tsx # L1 protocol spec + SEO + share
│   │   ├── dashboard/                 # 🔒 Auth-protected (merchant role)
│   │   │   ├── DashboardHome.tsx      # 6 KPIs, wallet overview, volume chart, quick actions
│   │   │   ├── ChargesList.tsx        # Search + date range + status filters + CSV export
│   │   │   ├── ChargeDetail.tsx       # Single charge detail + transactions
│   │   │   ├── CreateCharge.tsx       # New charge form (Zod validated)
│   │   │   ├── Reports.tsx            # KPI cards + volume/asset charts + CSV/JSON export
│   │   │   └── settings/
│   │   │       ├── SettlementSettings.tsx  # Per-chain settlement config
│   │   │       ├── ApiKeysSettings.tsx     # API key CRUD + scope management
│   │   │       ├── WebhookSettings.tsx     # Webhook endpoint CRUD + test + logs
│   │   │       └── AddressPool.tsx         # Address pool stats + CSV upload
│   │   └── admin/                     # 🔒 Auth-protected (admin role only)
│   │       ├── AdminHome.tsx          # Crypto ticker, 6 KPIs, volume chart, watcher status
│   │       ├── RevenueDashboard.tsx   # KPIs + area/bar/donut charts + top merchants
│   │       ├── FeeManagement.tsx      # Global fee config + per-merchant overrides
│   │       ├── MerchantManagement.tsx # Merchant list + enable/disable
│   │       ├── ChainConfig.tsx        # Chain/asset config + RPC status
│   │       ├── SystemMonitoring.tsx   # Watcher checkpoints + queue stats
│   │       ├── AuditLog.tsx           # Filterable audit log + expandable details
│   │       └── cms/                   # Enterprise Content Management System
│   │           ├── CMSDashboard.tsx    # Content overview + quick actions
│   │           ├── PageManager.tsx     # Page SEO metadata management
│   │           ├── BlogManager.tsx     # Blog post CRUD (markdown, tags, scheduling)
│   │           ├── AnnouncementManager.tsx # Site-wide banners management
│   │           ├── FAQManager.tsx      # FAQ entries with categories + sort order
│   │           └── CMSSettings.tsx     # Global SEO, analytics, maintenance mode
│   │
│   └── test/
│       ├── setup.ts                   # Vitest global setup
│       └── example.test.ts            # Example test
│
├── docs/
│   ├── BACKEND-SPEC.md                # Full NestJS backend specification
│   ├── API.md                         # REST API endpoint reference
│   ├── SECURITY.md                    # STRIDE threat model + security architecture
│   └── RUNBOOK.md                     # Ops runbook (secret rotation, scaling, incidents)
│
└── .lovable/
    └── plan.md                        # Build plan (internal)
```

---

## 3. Route Map

| Path | Component | Auth | Role | Description |
|------|-----------|------|------|-------------|
| `/` | `LandingPage` | ❌ | — | Public homepage with hero, features, live prices, socials |
| `/login` | `Login` | ❌ | — | Email/password login |
| `/signup` | `Signup` | ❌ | — | Registration with Zod validation |
| `/verify-email` | `VerifyEmail` | ❌ | — | Email OTP verification step |
| `/verify-2fa` | `Verify2FA` | ❌ | — | TOTP 2FA verification step |
| `/forgot-password` | `ForgotPassword` | ❌ | — | Forgot password (anti-enumeration) |
| `/reset-password` | `ResetPassword` | ❌ | — | Reset password with strength meter |
| `/pay/:chargeId` | `CheckoutPage` | ❌ | — | Public hosted checkout page |
| `/terms` | `TermsOfService` | ❌ | — | Terms of Service |
| `/privacy` | `PrivacyPolicy` | ❌ | — | Privacy Policy |
| `/pricing` | `Pricing` | ❌ | — | Fee comparison + calculator |
| `/contact` | `Contact` | ❌ | — | Contact form + office info |
| `/blog` | `Blog` | ❌ | — | Blog article listings |
| `/faq` | `FAQ` | ❌ | — | Expandable FAQ sections |
| `/docs/architecture` | `ArchitectureDocs` | ❌ | — | Architecture documentation |
| `/docs/security` | `SecurityDocs` | ❌ | — | Security documentation |
| `/docs/schema` | `SchemaDocs` | ❌ | — | Database schema documentation |
| `/docs/api` | `ApiDocs` | ❌ | — | API reference documentation |
| `/docs/singularitycoin` | `SingularityCoinDocs` | ❌ | — | L1 blockchain protocol spec |
| `/dashboard` | `DashboardHome` | ✅ | merchant | 6 KPIs, wallet overview, volume chart |
| `/dashboard/charges` | `ChargesList` | ✅ | merchant | Search + filters + date range + CSV export |
| `/dashboard/charges/new` | `CreateCharge` | ✅ | merchant | Create new charge form |
| `/dashboard/charges/:id` | `ChargeDetail` | ✅ | merchant | Single charge detail + transactions |
| `/dashboard/reports` | `Reports` | ✅ | merchant | KPI cards + charts + CSV/JSON export |
| `/dashboard/wallets` | `MerchantWallets` | ✅ | merchant | Wallet management (WalletConnect + hardware) |
| `/dashboard/wallets/transactions` | `WalletTransactionHistory` | ✅ | merchant | Wallet tx history with filters |
| `/dashboard/invoices` | `InvoicesList` | ✅ | merchant | Invoice list with status filters |
| `/dashboard/invoices/new` | `CreateInvoice` | ✅ | merchant | Create invoice form |
| `/dashboard/invoices/:id` | `InvoiceDetail` | ✅ | merchant | Invoice detail view |
| `/dashboard/notifications` | `NotificationsPage` | ✅ | merchant | Notification center + preferences |
| `/dashboard/exports` | `ExportCenter` | ✅ | merchant | Export job list + downloads |
| `/dashboard/intelligence` | `MerchantIntelligence` | ✅ | merchant | Predictive analytics dashboard |
| `/dashboard/settings/settlement` | `SettlementSettings` | ✅ | merchant | Settlement address config |
| `/dashboard/settings/api-keys` | `ApiKeysSettings` | ✅ | merchant | API key management |
| `/dashboard/settings/webhooks` | `WebhookSettings` | ✅ | merchant | Webhook endpoint management |
| `/dashboard/settings/addresses` | `AddressPool` | ✅ | merchant | Address pool management |
| `/dashboard/settings/security` | `SecuritySettings` | ✅ | merchant | 2FA, sessions, password |
| `/admin` | `AdminHome` | ✅ | admin | Crypto ticker, 6 KPIs, volume chart |
| `/admin/revenue` | `RevenueDashboard` | ✅ | admin | Revenue multi-chart layout |
| `/admin/fees` | `FeeManagement` | ✅ | admin | Global fees + per-merchant overrides |
| `/admin/merchants` | `MerchantManagement` | ✅ | admin | Merchant list + toggle |
| `/admin/chains` | `ChainConfig` | ✅ | admin | Chain/asset configuration |
| `/admin/wallets` | `AdminWalletManagement` | ✅ | admin | Platform wallet management |
| `/admin/wallets/transactions` | `AdminWalletTransactions` | ✅ | admin | Wallet transaction audit |
| `/admin/monitoring` | `SystemMonitoring` | ✅ | admin | Real-time system health |
| `/admin/audit-log` | `AuditLog` | ✅ | admin | Audit log viewer |
| `/admin/security-policies` | `AdminSecurityPolicies` | ✅ | admin | Password/session/access policies |
| `/admin/roles` | `AdminRoleManagement` | ✅ | admin | RBAC roles + team invites |
| `/admin/notifications` | `NotificationsPage` | ✅ | admin | Admin notification center |
| `/admin/exports` | `AdminExportCenter` | ✅ | admin | Admin export center |
| `/admin/intelligence` | `AdminIntelligence` | ✅ | admin | Admin predictive analytics |
| `/admin/api-settings` | `AdminApiSettings` | ✅ | admin | API configuration settings |
| `/admin/cms` | `CMSDashboard` | ✅ | admin | CMS content overview |
| `/admin/cms/pages` | `PageManager` | ✅ | admin | Page SEO metadata manager |
| `/admin/cms/blog` | `BlogManager` | ✅ | admin | Blog post CRUD |
| `/admin/cms/announcements` | `AnnouncementManager` | ✅ | admin | Announcement banners |
| `/admin/cms/faq` | `FAQManager` | ✅ | admin | FAQ entry manager |
| `/admin/cms/contacts` | `ContactSubmissions` | ✅ | admin | Contact form submissions inbox |
| `/admin/cms/social` | `SocialLinksManager` | ✅ | admin | Social media links manager |
| `/admin/cms/settings` | `CMSSettings` | ✅ | admin | CMS global settings |
| `*` | `NotFound` | ❌ | — | 404 catch-all |

**Total routes: 61**

### Route Protection Logic

```
ProtectedRoute ({ children, requiredRole })
  ├─ isLoading? → show "Loading…"
  ├─ !isAuthenticated? → Navigate to /login (preserves return URL)
  ├─ requiredRole && user.role !== requiredRole? → Navigate to /
  └─ else → render children
```

---

## 4. Authentication System

### Storage

| Key | Value | Purpose |
|-----|-------|---------|
| `sp_token` | JWT string | Authorization header |
| `sp_user` | JSON `{ id, email, role, merchant_id? }` | Cached user profile |

### Flow

1. User submits email/password → `auth.login(creds)` → POST `/auth/login`
2. Response: `{ token, user }` → stored in `localStorage`
3. All subsequent API calls include `Authorization: Bearer <token>` (Axios interceptor)
4. On 401 → token cleared, redirect to `/login`
5. Logout → DELETE `/auth/logout` (best-effort) + clear localStorage + `setUser(null)`

### Context API

```typescript
interface AuthContextValue {
  user: User | null;          // { id, email, role, merchant_id? }
  isLoading: boolean;         // true during initial hydration
  login: (creds) => Promise;  // throws on failure
  logout: () => void;         // clears everything
  isAuthenticated: boolean;   // shortcut: !!user
}
```

---

## 5. Pages — Detailed Breakdown

### 5.1 LandingPage (`/`)

- **Hero section:** Animated headline with gradient text, CTA buttons (Get Started → /login, Documentation → /docs/api)
- **Features grid:** 6 feature cards with Lucide icons and descriptions
- **Live crypto prices:** `CryptoPriceTicker` component — real CoinGecko data, 7-day sparklines
- **Footer:** Links to docs pages + SingularityCoin
- **Mobile:** Hamburger menu with all nav links (includes SingularityCoin)
- **Animations:** Framer Motion fade-in + slide-up on scroll

### 5.2 Login (`/login`)

- **Back-to-home:** `← Back to Home` button (top-left, absolute positioned)
- **Form fields:** Email (required) + Password (required, minLength 1)
- **Submit:** Calls `auth.login()`, on success navigates to `/dashboard`
- **Error handling:** Displays error message from API or generic fallback
- **Visual:** Centered card, background glow, CryptoniumpayLogo header

### 5.3 CheckoutPage (`/pay/:chargeId`)

- **Public:** No auth required
- **Data:** Fetches charge via `checkout.getCharge(id)` — polls every 4s
- **Features:** Chain/asset selector, QR code (qrcode.react), copy-to-clipboard, countdown timer
- **States:** NEW → PENDING → CONFIRMED → PAID, plus EXPIRED/UNDERPAID/OVERPAID handling
- **Redirect:** On PAID/CONFIRMED, redirects to `charge.redirect_url` if set

### 5.4 DashboardHome (`/dashboard`)

- **Stats cards:** Total Charges, Pending, Confirmed Today, Volume (USD)
- **Recent charges table:** Last 10 charges with ID (linked), name, amount, status badge, date
- **CTA:** "New Charge" button → `/dashboard/charges/new`

### 5.5 ChargesList (`/dashboard/charges`)

- **Filters:** Status pills (NEW, PENDING, CONFIRMED, PAID, EXPIRED, UNDERPAID, OVERPAID)
- **Table:** ID, name, amount, status, created — click row navigates to detail
- **Pagination:** Page N of M, Prev/Next buttons
- **Export:** CSV download button
- **CTA:** "New Charge" button

### 5.6 ChargeDetail (`/dashboard/charges/:id`)

- **Header:** Charge name + StatusBadge + external checkout link
- **Details card:** ID, description, type, price, metadata JSON, timestamps
- **Payment addresses card:** List with chain, asset, address (copyable), expected amount
- **Transactions table:** tx_hash (first 16 chars, copyable), chain, asset, amount, confirmations, status

### 5.7 CreateCharge (`/dashboard/charges/new`)

- **Form:** Name, description, pricing type (fixed/no_price), amount + currency (conditional), expiry (5-1440 min), redirect URL, cancel URL, metadata (JSON)
- **Validation:** Zod schema with field-level errors
- **Idempotency:** `crypto.randomUUID()` sent as idempotency key
- **On success:** Toast + navigate to charge detail

### 5.8 Reports (`/dashboard/reports`)

- **Date inputs:** From / To date range
- **Fetch:** Manual "Fetch Data" button (query disabled by default)
- **Export:** CSV and JSON download buttons
- **Count display:** Shows total records fetched

### 5.9 SettlementSettings

- **Per-chain cards:** Chain + asset label, editable address, sweep mode (immediate/batched), min threshold
- **Inline edit:** Click to edit, save to persist

### 5.10 ApiKeysSettings

- **Table:** Name, prefix (masked), scopes as badges, last used, created
- **Create dialog:** Name + scope checkboxes (read/write/admin)
- **One-time display:** New key shown in success card with CopyButton
- **Revoke:** Trash icon per key

### 5.11 WebhookSettings

- **Endpoint cards:** URL, active badge, event badges, secret (masked + copyable), test/delete buttons
- **Delivery log:** Expandable per-endpoint, shows status code, latency, attempt count
- **Create dialog:** URL input + event checkbox grid

### 5.12 AddressPool

- **Stats cards:** Per-chain stats (total, allocated, available) with low-pool warnings
- **Recent addresses table:** First 20, with status badge and date
- **Upload dialog:** Chain selector + CSV file input, parse/validate, upload

### 5.13 AdminHome (`/admin`)

- **Stats cards:** Total merchants, active charges, transactions today
- **Watcher table:** Chain, current block, latest block, lag badge, last updated
- **RPC status:** Per-chain healthy/total counts
- **Webhook queue:** Pending + failed counts
- **Auto-refresh:** Health data polls every 15s

### 5.14 MerchantManagement (`/admin/merchants`)

- **Search:** Filter by name or email
- **Table:** Name, email, status badge, created date, enable/disable button

### 5.15 ChainConfig (`/admin/chains`)

- **Per-chain cards:** Chain name, enabled badge, confirmation threshold, RPC count
- **RPC list:** Status badge, URL, latency
- **Assets section:** Per-asset toggle switches

### 5.16 SystemMonitoring (`/admin/monitoring`)

- **Watcher table:** Chain, current block, latest block, lag badge, last updated (auto-refresh 10s)
- **RPC health card:** Per-chain healthy/total
- **Webhook queue card:** Pending + failed counts
- **Uptime card:** Hours + minutes display

### 5.17 AuditLog (`/admin/audit-log`)

- **Filter:** Search by action string
- **Table:** Timestamp, actor email, action, resource type + ID, IP address
- **Expandable:** Click row to show full JSON details
- **Pagination:** Page N of M, Prev/Next

### 5.18 Documentation Pages (`/docs/*`)

All 5 docs pages share `DocsNav` sidebar navigation. Content is static markdown-style JSX with syntax-highlighted code blocks, tables, and diagrams.

---

## 6. Layouts

### DashboardLayout (Merchant)

```
┌──────────────────────────────────────────────┐
│ Sidebar (collapsible)  │ Header (trigger+title+theme) │
│  • Dashboard           │──────────────────────────────│
│  • Charges             │                              │
│  • New Charge          │     <Outlet /> (page)        │
│  • Reports             │                              │
│  ──Settings──          │                              │
│  • Settlement          │                              │
│  • API Keys            │                              │
│  • Webhooks            │                              │
│  • Address Pool        │                              │
│  ──Footer──            │                              │
│  [user@email] [Logout] │                              │
└──────────────────────────────────────────────┘
```

### AdminLayout

Same structure, different nav items: Overview, Merchants, Chain & Assets, Monitoring, Audit Log. Header shows "Admin Panel" in destructive color.

---

## 7. Components — Custom

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| `CryptoniumpayLogo` | `CryptoniumpayLogo.tsx` | `size: sm\|md\|lg\|xl`, `showText`, `className` | Brand logo with img + gradient text |
| `CryptoPriceTicker` | `CryptoPriceTicker.tsx` | — | Live BTC/ETH/USDC/BNB/SOL prices from CoinGecko |
| `CopyButton` | `CopyButton.tsx` | `text: string` | Click-to-copy with checkmark feedback |
| `DocsNav` | `DocsNav.tsx` | — | Sidebar nav for documentation pages |
| `ErrorBoundary` | `ErrorBoundary.tsx` | `children` | Catches React render errors, shows fallback |
| `MerchantSidebar` | `MerchantSidebar.tsx` | — | Merchant dashboard sidebar navigation |
| `AdminSidebar` | `AdminSidebar.tsx` | — | Admin panel sidebar navigation |
| `NavLink` | `NavLink.tsx` | `to`, `end`, `activeClassName`, `children` | React Router NavLink wrapper |
| `PageSkeleton` | `PageSkeleton.tsx` | — | Full-page loading skeleton |
| `TableSkeleton` | `PageSkeleton.tsx` | `rows`, `cols` | Table loading skeleton |
| `ProtectedRoute` | `ProtectedRoute.tsx` | `children`, `requiredRole?` | Auth guard component |
| `StatusBadge` | `StatusBadge.tsx` | `status: ChargeStatus` | Color-coded charge status badge |
| `ThemeToggle` | `ThemeToggle.tsx` | — | Sun/Moon toggle for light/dark mode |

---

## 8. Components — shadcn/ui Primitives

**45 components** in `src/components/ui/`:

accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

**Style:** New York variant, HSL color format, 0.5rem default radius.

---

## 9. Hooks

| Hook | File | Returns | Purpose |
|------|------|---------|---------|
| `useAuth()` | `lib/auth.tsx` | `{ user, isLoading, login, logout, isAuthenticated }` | Auth context consumer |
| `useIsMobile()` | `hooks/use-mobile.tsx` | `boolean` | True when viewport < 768px |
| `usePageTitle(title)` | `hooks/use-page-title.ts` | `void` | Sets `document.title` to `"title — Cryptoniumpay"` |
| `useToast()` | `hooks/use-toast.ts` | `{ toast, dismiss, toasts }` | Toast notification system |

---

## 10. API Client

**File:** `src/lib/api-client.ts`

**Base URL:** `import.meta.env.VITE_API_BASE_URL` (falls back to `"/api"`)

**Auth:** Axios request interceptor reads `sp_token` from localStorage → `Authorization: Bearer <token>`

**Error handling:** Axios response interceptor catches 401 → clears token → redirects to `/login`

### Namespaces & Endpoints

| Namespace | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `auth.login` | POST | `/auth/login` | Returns `{ token, user }` |
| `auth.logout` | DELETE | `/auth/logout` | Invalidate session |
| `charges.create` | POST | `/charges` | Create charge (+ idempotency key header) |
| `charges.get` | GET | `/charges/:id` | Get single charge |
| `charges.list` | GET | `/charges` | List charges (paginated, filterable) |
| `charges.getTransactions` | GET | `/charges/:id/transactions` | Transactions for a charge |
| `checkout.getCharge` | GET | `/checkout/:id` | Public charge data (no auth) |
| `apiKeys.list` | GET | `/api-keys` | List API keys |
| `apiKeys.create` | POST | `/api-keys` | Create key (returns full key once) |
| `apiKeys.revoke` | DELETE | `/api-keys/:id` | Revoke API key |
| `webhooks.list` | GET | `/webhooks` | List webhook endpoints |
| `webhooks.create` | POST | `/webhooks` | Create endpoint |
| `webhooks.delete` | DELETE | `/webhooks/:id` | Delete endpoint |
| `webhooks.test` | POST | `/webhooks/:id/test` | Send test delivery |
| `webhooks.deliveries` | GET | `/webhooks/:id/deliveries` | Recent deliveries |
| `settlement.getConfig` | GET | `/settlement/config` | Get settlement config |
| `settlement.updateConfig` | PUT | `/settlement/config` | Update settlement config |
| `settlement.listSweeps` | GET | `/settlement/sweeps` | List sweep transactions |
| `addressPool.stats` | GET | `/address-pool/stats` | Pool statistics per chain |
| `addressPool.upload` | POST | `/address-pool/upload` | Upload addresses (CSV parsed) |
| `addressPool.list` | GET | `/address-pool` | List addresses |
| `dashboard.stats` | GET | `/dashboard/stats` | Dashboard overview stats |
| `admin.stats` | GET | `/admin/stats` | Admin platform stats |
| `admin.merchants.list` | GET | `/admin/merchants` | List all merchants |
| `admin.merchants.get` | GET | `/admin/merchants/:id` | Get single merchant |
| `admin.merchants.toggle` | PATCH | `/admin/merchants/:id` | Enable/disable merchant |
| `admin.chains.list` | GET | `/admin/chains` | List chain configs |
| `admin.chains.update` | PATCH | `/admin/chains/:chain` | Update chain config |
| `admin.assets.list` | GET | `/admin/assets` | List asset configs |
| `admin.assets.toggle` | PATCH | `/admin/assets/:chain/:symbol` | Enable/disable asset |
| `admin.health` | GET | `/admin/health` | System health data |
| `admin.auditLog` | GET | `/admin/audit-log` | Paginated audit entries |
| `health.check` | GET | `/health` | Basic health check |

**Total: 32 API endpoints mapped**

---

## 11. Type System

**File:** `src/lib/types.ts` — **285 lines**, zero `any` types

### Enums (union types)

| Type | Values |
|------|--------|
| `ChargeStatus` | NEW, PENDING, CONFIRMED, PAID, EXPIRED, CANCELED, UNDERPAID, OVERPAID |
| `PricingType` | fixed_price, no_price |
| `ChainId` | btc, eth, arbitrum, optimism, polygon |
| `AssetSymbol` | BTC, ETH, USDC, USDT, MATIC |
| `SweepMode` | immediate, batched |
| `WebhookEventType` | 10 event types (charge.*, settlement.sweep.*) |
| `ApiKeyScope` | read, write, admin |

### Core Models (17 interfaces)

Merchant, Charge, ChargePayment, DepositAddress, Sweep, ApiKey, ApiKeyCreated, WebhookEndpoint, WebhookDelivery, SettlementConfig, ChainConfig, RpcEndpoint, AssetConfig, WatcherCheckpoint, AuditLogEntry, SystemHealth, DashboardStats, AdminStats

### Request/Response Types (9 interfaces)

CreateChargeRequest, ListChargesParams, PaginatedResponse\<T>, LoginRequest, LoginResponse, HealthResponse, CreateApiKeyRequest, CreateWebhookRequest, AddressPoolUpload, AddressPoolStats

---

## 12. Design System & Theming

### CSS Variables (defined in `src/index.css`)

**Light mode (`:root`):**

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `40 20% 96%` | Page background (warm cream) |
| `--foreground` | `30 15% 15%` | Primary text |
| `--card` | `40 18% 94%` | Card background |
| `--primary` | `38 92% 50%` | Gold accent (buttons, links) |
| `--primary-foreground` | `30 10% 6%` | Text on primary |
| `--secondary` | `38 12% 90%` | Secondary background |
| `--muted` | `38 12% 90%` | Muted elements |
| `--muted-foreground` | `30 10% 40%` | Muted text |
| `--accent` | `38 14% 88%` | Accent background |
| `--destructive` | `0 72% 51%` | Error/danger red |
| `--border` | `38 10% 85%` | Border color |
| `--ring` | `38 92% 50%` | Focus ring (gold) |
| `--success` | `142 71% 45%` | Success green |
| `--warning` | `38 92% 50%` | Warning (gold) |
| `--info` | `199 89% 48%` | Info blue |

**Dark mode (`.dark`):**

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `220 20% 4%` | Deep charcoal |
| `--foreground` | `40 15% 92%` | Light text |
| `--card` | `220 18% 7%` | Card background |
| `--primary` | `38 92% 50%` | Gold (same) |
| `--secondary` | `220 15% 12%` | Dark secondary |
| `--muted` | `220 15% 12%` | Muted dark |
| `--muted-foreground` | `220 10% 52%` | Muted text |
| `--border` | `220 14% 14%` | Dark border |

### Custom Utility Classes

| Class | Effect |
|-------|--------|
| `.text-gradient-gold` | Gold gradient text (clip + transparent) |
| `.bg-gradient-gold` | Gold gradient background |
| `.glow-gold` | Gold box-shadow glow effect |
| `.border-gradient-gold` | Gold gradient border |

---

## 13. Typography

| Usage | Font | Weights |
|-------|------|---------|
| Body text | **Inter** | 300–900 |
| Headings (h1-h6) | **Space Grotesk** | 400–700 |
| Code / mono | **JetBrains Mono** | 400–600 |

Loaded via Google Fonts CDN in `index.css`.

---

## 14. Build & Dev Commands

```bash
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint check
npm run test         # Run vitest tests
```

---

## 15. Dependencies (All)

### Production (34 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | React DOM renderer |
| react-router-dom | ^6.30.1 | Client-side routing |
| @tanstack/react-query | ^5.83.0 | Server state management |
| axios | ^1.13.5 | HTTP client |
| zod | ^3.25.76 | Schema validation |
| react-hook-form | ^7.61.1 | Form management |
| @hookform/resolvers | ^3.10.0 | Zod resolver for RHF |
| framer-motion | ^12.34.3 | Animations |
| recharts | ^2.15.4 | Charts |
| qrcode.react | ^4.2.0 | QR code generation |
| lucide-react | ^0.462.0 | Icon library |
| next-themes | ^0.3.0 | Theme management |
| sonner | ^1.7.4 | Toast notifications |
| date-fns | ^3.6.0 | Date formatting |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^2.6.0 | Tailwind class merging |
| class-variance-authority | ^0.7.1 | Component variants |
| tailwindcss-animate | ^1.0.7 | Animation utilities |
| cmdk | ^1.1.1 | Command palette |
| vaul | ^0.9.9 | Drawer component |
| input-otp | ^1.4.2 | OTP input |
| embla-carousel-react | ^8.6.0 | Carousel |
| react-day-picker | ^8.10.1 | Date picker |
| react-resizable-panels | ^2.1.9 | Resizable panels |
| @radix-ui/* | Various | 25 Radix UI primitives |

### Dev Dependencies

TypeScript, Vite, Tailwind CSS, PostCSS, ESLint, Vitest

---

## 16. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes (production) | `""` | Backend API base URL |

This is the **only** env var the frontend needs. All others (DB, Redis, JWT, Signer) are backend-only — see `DEPLOYMENT.md`.

---

## 17. Security Considerations (Frontend)

1. **JWT stored in localStorage** — standard SPA pattern. Backend must set short expiry + refresh tokens.
2. **No secrets in frontend code** — API keys, signer secrets, DB credentials are backend-only.
3. **CORS** — Backend must whitelist the frontend origin.
4. **CSP headers** — Configured in `public/_headers` and `nginx.conf`.
5. **XSS** — React auto-escapes JSX. No `dangerouslySetInnerHTML` used.
6. **CSRF** — Not applicable (JWT bearer auth, no cookies).
7. **Rate limiting** — Backend responsibility. Frontend shows error on 429.
8. **Input validation** — Zod schemas validate before submission (defense in depth — backend must also validate).

---

## 18. Testing

**Runner:** Vitest  
**Config:** `vitest.config.ts`  
**Setup:** `src/test/setup.ts`

```bash
npm run test           # Run all tests
npx vitest run         # Single run
npx vitest --watch     # Watch mode
```

Current test coverage: Example test only. Production backend must have comprehensive tests.

---

## 19. Deployment Files

| File | Lines | Purpose |
|------|-------|---------|
| `DEPLOYMENT.md` | 812 | Step-by-step deployment (Cloudflare + VM + Docker) |
| `README.md` | 202 | Project overview + quick start |
| `DEVELOPER.md` | THIS | Full technical reference |
| `public/_redirects` | 1 | SPA routing for Cloudflare/Netlify |
| `public/_headers` | 6 | Security headers |
| `public/robots.txt` | — | Search engine directives |

---

## 20. SingularityCoin Protocol

The `/docs/singularitycoin` page contains the full specification for a self-hosted Layer-1 blockchain:

- **Consensus:** HotStuff-style BFT PoS with 1-3s finality
- **Cryptography:** Post-quantum ML-DSA (Dilithium) signatures + BLAKE3 hashing
- **Staking:** Permissionless, epoch-based validator rotation, slashing
- **Fee market:** Adaptive `base_fee_per_byte` + fixed compute fee
- **Stack:** Rust monorepo (node, consensus, crypto, p2p, storage, state, rpc, cli)
- **Storage:** RocksDB (embedded, no external DB)

This is a **specification document** — the Rust implementation is a separate repository.

---

## 21. Backend Integration

The backend is **fully built and deployed** as a NestJS application with:

| Component | Technology | Status |
|-----------|-----------|--------|
| REST API server (55+ endpoints) | NestJS + Prisma | ✅ Production |
| PostgreSQL schema (36 models) | PostgreSQL 16 | ✅ Deployed |
| JWT authentication + 3-step MFA | argon2id + TOTP | ✅ Working |
| Blockchain watchers | BullMQ workers | ✅ Running |
| Webhook dispatcher | BullMQ + HMAC-SHA256 | ✅ Built |
| Redis caching + rate limiting | Redis 7 | ✅ Deployed |
| RBAC (20 permissions) | NestJS guards | ✅ Enforced |
| Enterprise CMS | Prisma CRUD | ✅ Working |
| Data export (server-side) | BullMQ + CSV/JSON | ✅ Working |

**Deployment:** Backend runs on VPS via Docker Compose (6 containers). Frontend on Cloudflare Pages. Cloudflare Workers gateway bridges them with HMAC-signed requests. See `DEPLOYMENT-SUCCESS.md` for the complete verified deployment guide.

---

*This document covers every file, route, component, type, hook, and token in the Cryptoniumpay frontend. For deployment instructions see `DEPLOYMENT.md`. For project overview see `README.md`.*
