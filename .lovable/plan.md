

# SingularityPay — Self-Hosted Crypto Payment Gateway

## Overview
A production-grade frontend application for a self-hosted crypto payment gateway inspired by Coinbase Commerce. The app includes a **Merchant Dashboard**, **Admin Dashboard**, and **Hosted Checkout Page** — all built as a React SPA with a typed API client targeting your self-hosted backend.

**Design style:** Enterprise/serious — dense data tables, sidebar navigation, muted color palette, dark mode default, optimized for power users.

---

## Phase A: Design Artifacts (Rendered as App Pages)

### 1. Architecture Documentation Page (`/docs/architecture`)
- Mermaid-rendered architecture diagram showing all services (frontend, api, worker, postgres, redis, signer) and their network boundaries
- Data flow diagrams for "Create Charge" and "Verify Payment" flows
- Docker network isolation diagram (signer in separate network)

### 2. Threat Model Page (`/docs/security`)
- STRIDE threat model with mitigations table
- Key management security model (xpub-only server, isolated signer)
- Hardening checklist (firewall, TLS, secrets rotation, admin 2FA)

### 3. Database Schema Page (`/docs/schema`)
- Interactive ERD showing all 17+ tables with relationships
- Index strategy documentation
- Migration plan overview

### 4. API Reference Page (`/docs/api`)
- Full REST API documentation for all endpoints
- Request/response examples with types
- Webhook event catalog with payload schemas
- Authentication flow documentation

---

## Phase B: Merchant Dashboard

### 5. Authentication & Session Management
- Login page with email/password
- Session token management via API client
- Protected route wrappers
- Logout functionality

### 6. Dashboard Home (`/dashboard`)
- Summary cards: total charges, pending payments, confirmed today, total volume
- Recent charges table with status badges
- Quick-create charge button

### 7. Charges Management (`/dashboard/charges`)
- Dense data table with columns: ID, name, amount, asset, status, created, expires
- Status filter chips: NEW, PENDING, CONFIRMED, PAID, EXPIRED, UNDERPAID, OVERPAID
- Date range filter, asset filter, search
- CSV export button
- Click-through to charge detail

### 8. Charge Detail (`/dashboard/charges/:id`)
- Full charge info card with status badge and timeline
- Inbound transactions list with confirmations count and block depth
- Settlement/sweep status and linked outbound tx
- Payment addresses per chain with copy buttons
- Link to hosted checkout page

### 9. Create Charge (`/dashboard/charges/new`)
- Form: name, description, pricing type (fixed/donation), amount, currency
- Chain/asset selection (BTC, ETH, USDC, USDT across supported chains)
- Expiry duration picker
- Metadata JSON editor
- Redirect/cancel URL fields
- Idempotency key auto-generation

### 10. Settlement Settings (`/dashboard/settings/settlement`)
- Per-chain settlement address configuration
- Sweep mode toggle (immediate vs. batched)
- Minimum sweep threshold per asset
- Dust handling config

### 11. API Keys Management (`/dashboard/settings/api-keys`)
- List active API keys (masked) with created date and last used
- Create new key with scope selection
- Revoke/delete key with confirmation
- Copy key on creation (shown once)

### 12. Webhook Configuration (`/dashboard/settings/webhooks`)
- Add webhook endpoint URL
- Auto-generated HMAC secret with copy
- Event type subscriptions (checkboxes for all event types)
- Test webhook button
- Delivery log table: event, status code, latency, timestamp, retry count

### 13. Deposit Address Pool (`/dashboard/settings/addresses`)
- Upload pre-generated deposit addresses (CSV)
- View pool status per chain: total, allocated, available
- Address allocation history

### 14. Reporting (`/dashboard/reports`)
- Date-range filtered transaction reports
- Volume by chain/asset breakdown
- CSV/JSON export

---

## Phase C: Admin Dashboard

### 15. Admin Home (`/admin`)
- System health overview: watcher lag per chain, RPC endpoint status, webhook queue depth
- Global metrics cards: total merchants, active charges, transactions today

### 16. Merchant Management (`/admin/merchants`)
- Merchant list table with search, status filter
- Merchant detail view with their charges, volume, API keys count
- Enable/disable merchant

### 17. Chain & Asset Configuration (`/admin/chains`)
- Chain list with enable/disable toggles
- RPC endpoint management per chain (add/remove/reorder for failover)
- Confirmation threshold settings per chain
- Asset/token list with contract addresses and enable/disable

### 18. System Monitoring (`/admin/monitoring`)
- Watcher checkpoint status per chain (current block, lag)
- RPC endpoint health and latency
- Webhook queue depth and failure rate
- Recent errors log

### 19. Audit Log (`/admin/audit-log`)
- Append-only audit log viewer with search
- Filterable by actor, action type, resource, date range
- Dense table with expandable JSON detail rows

---

## Phase D: Hosted Checkout Page

### 20. Checkout Page (`/pay/:chargeId`)
- Public page (no auth required)
- Chain/asset selector tabs (BTC, ETH, USDC, etc.)
- Selected payment option shows: deposit address, QR code, exact amount, chain name
- Copy address button
- Expiration countdown timer
- Auto-polling status updates (every 3-5 seconds)
- Status states with distinct visuals: waiting → detecting → confirming (with count) → paid ✓
- Underpaid/overpaid handling with clear messaging
- Redirect on completion (if configured)

---

## Technical Foundation

### 21. API Client Layer
- Typed API client module with axios, configured via environment variable `VITE_API_BASE_URL`
- Request/response TypeScript interfaces for all endpoints
- Interceptors for auth token injection and error handling
- Standardized error types and toast notifications
- Loading and error state patterns across all data-fetching components

### 22. Shared UI Patterns
- Enterprise sidebar with collapsible navigation (Merchant vs Admin contexts)
- Dense data table component with sorting, pagination, filtering
- Status badge component with color-coded charge statuses
- Copy-to-clipboard utility
- QR code generation (client-side)
- JSON viewer/editor component
- Confirmation dialogs for destructive actions

