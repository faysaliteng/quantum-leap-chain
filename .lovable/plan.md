
# Cryptoniumpay Enterprise Backend Completion Plan

## Audit Summary

### What exists and works
- 62+ frontend routes with `data-testid` attributes across 59 page files
- Backend skeleton with 15+ NestJS modules, 36 Prisma models, Dockerfile, Docker Compose (dev + prod)
- Cloudflare Worker gateway (basic proxy)
- Frontend API client with 55+ endpoint calls across `api-client.ts` and `api-extended.ts`
- CI workflow with frontend build, lint, type check, E2E, and log-grep gates

### Critical gaps found

| Gap | Impact |
|-----|--------|
| No `/v1/security/*` controller (merchant-side 2FA/password/sessions) | Frontend calls 8 endpoints with no backend match |
| Routes manifest missing 3 routes: `dashboard-intelligence`, `admin-intelligence`, `admin-api-settings` | E2E coverage incomplete |
| All backend DTOs accept `any` -- no validation | Security violation (no unknown field rejection) |
| Worker gateway has no HMAC auth, no edge rate limiting, no request size limits | Backend entrypoint unsecured |
| No Prometheus metrics endpoint | No observability |
| No WebSocket support for notifications | Real-time notifications broken |
| 12+ `// TODO` in critical paths (TOTP verify, email send, PDF) | Core features non-functional |
| E2E tests don't assert `data-testid`, no button smoke tests | QA incomplete |
| No `docs/VERIFICATION-MATRIX.md` | No route-to-API traceability |

---

## Phase 0 -- Repo Audit Fixes

1. **Update `e2e/routes.manifest.ts`** to add 3 missing routes:
   - `{ key: "dashboard-intelligence", path: "/dashboard/intelligence" }`
   - `{ key: "admin-intelligence", path: "/admin/intelligence" }`
   - `{ key: "admin-api-settings", path: "/admin/api-settings" }`
   - Update total count to 65

2. **Create `docs/VERIFICATION-MATRIX.md`** with complete mapping:
   - Every route -> its `data-testid` -> API endpoints it calls -> backend controller -> E2E test status

---

## Phase 1 -- Backend Completion

### 1a. Create missing Security controller (`backend/src/security/`)

New files:
- `backend/src/security/security.module.ts`
- `backend/src/security/security.controller.ts` -- handles all `/v1/security/*` endpoints
- `backend/src/security/security.service.ts` -- implements 2FA setup/enable/disable, backup codes, session management, password change, email verification toggle

Endpoints to implement (matching `api-client.ts` lines 63-73):
- `GET /v1/security/settings`
- `POST /v1/security/2fa/setup`
- `POST /v1/security/2fa/enable`
- `POST /v1/security/2fa/disable`
- `PUT /v1/security/email-verification`
- `POST /v1/security/backup-codes`
- `DELETE /v1/security/sessions/:id`
- `DELETE /v1/security/sessions`
- `PUT /v1/security/password`

Register in `app.module.ts`.

### 1b. Add DTO validation classes with class-validator

Create DTOs for every controller (reject unknown fields):
- `backend/src/auth/dto/login.dto.ts` -- `IsEmail`, `IsString`, `MinLength`
- `backend/src/auth/dto/signup.dto.ts` -- name, email, password validation
- `backend/src/charges/dto/create-charge.dto.ts` -- full charge validation
- `backend/src/invoices/dto/create-invoice.dto.ts`
- `backend/src/api-keys/dto/create-api-key.dto.ts`
- `backend/src/webhooks/dto/create-webhook.dto.ts`
- Plus DTOs for settlement, addresses, wallets, admin operations

Update `main.ts` ValidationPipe to include `forbidNonWhitelisted: true`.

### 1c. Implement TOTP verification (replace all TODO comments)

In `auth.service.ts` and `security.service.ts`:
- Use `otplib` authenticator to generate secrets and verify TOTP codes
- Generate QR code data URL with `qrcode` package
- Implement backup code verification with argon2id

### 1d. Add Prometheus metrics endpoint

New files:
- `backend/src/metrics/metrics.module.ts`
- `backend/src/metrics/metrics.controller.ts` -- `GET /metrics` (Prometheus text format)
- `backend/src/metrics/metrics.interceptor.ts` -- counts requests, latency histograms

### 1e. Add `/v1/health/system` admin-only endpoint

Extend health controller:
- Basic `/v1/health` (public) -- status, version, uptime
- `/v1/health/system` (admin only) -- DB connection, Redis ping, queue stats, memory usage, watcher lag

### 1f. Audit logging with before/after diff

Update admin service to capture diffs:
- On merchant toggle, fee update, chain update, CMS changes
- Store `{ before: {...}, after: {...} }` in audit log `details` field

### 1g. Refresh token rotation with reuse detection

In auth service:
- On token refresh, issue new refresh token in same family
- If a revoked token in a family is reused, revoke ALL tokens in that family (reuse detection)
- Add `POST /v1/auth/refresh` endpoint

### 1h. Maintenance mode + IP allowlist enforcement

Create middleware:
- `backend/src/common/maintenance.guard.ts`
- Reads security policies from cache/DB
- Returns 503 if maintenance mode is on (unless bypass IP)
- Returns 403 if IP allowlist enabled and IP not in list

---

## Phase 2 -- Cloudflare Workers Gateway (Enterprise)

Replace `cloudflare/worker-gateway/src/index.ts` with enterprise version:

Features:
- **HMAC edge signature**: Worker signs requests with `X-Edge-Signature` header using timestamp + HMAC-SHA256 with shared secret
- **Edge rate limiting**: Lightweight per-IP rate limit using `globalThis` Map (or KV if available) -- 100 req/min default
- **Request size limits**: Reject bodies > 10MB (configurable)
- **CORS handling**: Proper origin validation
- **Streaming support**: Pass through `Transfer-Encoding: chunked` for export downloads
- **Maintenance mode**: Read from KV or env var, return 503 at edge before hitting origin

New file: `backend/src/common/edge-signature.guard.ts`
- Validates `X-Edge-Signature` header on origin
- Rejects requests without valid edge signature (when `EDGE_SECRET` is set)

Update `wrangler.toml`:
- Add `EDGE_SECRET` secret binding
- Add KV namespace binding for rate limiting (optional)

Move files to `infra/cloudflare-worker/` (cleaner structure).

---

## Phase 3 -- VM / Docker Deployment

### 3a. Restructure `infra/docker/`

- `infra/docker/docker-compose.dev.yml` -- Postgres, Redis, API (with hot reload volume mount)
- `infra/docker/docker-compose.prod.yml` -- Postgres, Redis, API, Worker (watcher), Nginx, Certbot
- Keep existing files but add:
  - Memory limits tuned for 2GB droplet
  - Health checks for all services
  - Log driver configuration
  - Volume mounts for exports + logs

### 3b. Add systemd unit examples

- `infra/systemd/cryptoniumpay-api.service`
- `infra/systemd/cryptoniumpay-worker.service`

### 3c. Origin-side edge signature validation

Backend validates that requests come through the Cloudflare Worker (when configured):
- If `EDGE_SECRET` env var is set, reject requests without valid `X-Edge-Signature`
- Allows direct access in dev mode (no `EDGE_SECRET`)

---

## Phase 4 -- QA / E2E

### 4a. Rewrite `e2e/smoke.spec.ts`

- Visit ALL 65 routes (including dynamic routes with test IDs)
- Assert `data-testid="page:<key>"` exists on every page
- Capture console errors and fail if any
- Take desktop (1280x720) and mobile (375x812) screenshots for every route
- Upload all screenshots as CI artifacts

### 4b. Add button smoke tests (`e2e/buttons.spec.ts`)

Test major CTAs:
- Login form submit (with invalid creds, verify error shown)
- Signup form submit
- Create charge button click
- Create invoice button click
- Open wallet connect panel
- Create API key
- Create webhook
- Admin toggle merchant
- Edit fee config
- CMS publish
- Export download

### 4c. Update CI workflow

Add:
- Backend build check (`cd backend && npm ci && npx tsc --noEmit`)
- Docker Compose startup test (build + health check)
- Log-grep gate on docker logs (`backend.log`)
- E2E artifacts upload (screenshots, report)

---

## Phase 5 -- Documentation

### 5a. `docs/VERIFICATION-MATRIX.md`

Complete table mapping all 65 routes to:
- `data-testid`
- Frontend API calls made
- Backend endpoint(s)
- E2E test coverage status

### 5b. Update `DEPLOYMENT.md`

Add Cloudflare Worker gateway deployment section:
- `wrangler secret put EDGE_SECRET`
- `wrangler secret put BACKEND_ORIGIN`
- `wrangler deploy`
- Verify with `curl https://api.yourdomain.com/api/v1/health`

Add Cloudflare Pages frontend deployment:
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api`

### 5c. Update `docs/RUNBOOK.md`

Add sections for:
- Edge signature rotation
- Worker gateway debugging
- Rate limit tuning

### 5d. Update `docs/SECURITY.md`

Add sections for:
- Edge signature HMAC flow
- Maintenance mode enforcement (edge + origin)
- IP allowlist enforcement chain

---

## Technical Details

### Files to create (new):
```
backend/src/security/security.module.ts
backend/src/security/security.controller.ts
backend/src/security/security.service.ts
backend/src/auth/dto/login.dto.ts
backend/src/auth/dto/signup.dto.ts
backend/src/charges/dto/create-charge.dto.ts
backend/src/invoices/dto/create-invoice.dto.ts
backend/src/api-keys/dto/create-api-key.dto.ts
backend/src/webhooks/dto/create-webhook.dto.ts
backend/src/common/edge-signature.guard.ts
backend/src/common/maintenance.guard.ts
backend/src/metrics/metrics.module.ts
backend/src/metrics/metrics.controller.ts
backend/src/metrics/metrics.interceptor.ts
infra/systemd/cryptoniumpay-api.service
infra/systemd/cryptoniumpay-worker.service
e2e/buttons.spec.ts
docs/VERIFICATION-MATRIX.md
```

### Files to modify:
```
backend/src/app.module.ts          -- register SecurityModule, MetricsModule
backend/src/main.ts                -- add forbidNonWhitelisted to ValidationPipe
backend/src/auth/auth.service.ts   -- implement TOTP, refresh rotation
backend/src/auth/auth.controller.ts -- add /refresh endpoint, use DTOs
backend/src/admin/admin.controller.ts -- use DTOs
backend/src/admin/admin.service.ts -- add audit diffs
backend/src/health/health.controller.ts -- add /system endpoint
backend/src/charges/charges.controller.ts -- use DTOs
backend/src/invoices/invoices.controller.ts -- use DTOs
backend/src/webhooks/webhooks.controller.ts -- use DTOs
cloudflare/worker-gateway/src/index.ts -- enterprise gateway rewrite
cloudflare/worker-gateway/wrangler.toml -- add secrets
e2e/routes.manifest.ts -- add 3 missing routes
e2e/smoke.spec.ts -- full rewrite with data-testid assertions
.github/workflows/ci.yml -- add backend CI + docker test
DEPLOYMENT.md -- add CF Worker + Pages sections
docs/RUNBOOK.md -- add edge/worker sections
docs/SECURITY.md -- add edge signature docs
```

### Execution order:
1. Phase 0: Fix route manifest, create verification matrix
2. Phase 1a-1c: Security controller + DTOs + TOTP (highest priority -- fixes broken frontend)
3. Phase 1d-1h: Metrics, health, audit, refresh rotation, maintenance mode
4. Phase 2: Cloudflare Worker gateway enterprise rewrite
5. Phase 3: Docker/systemd updates
6. Phase 4: E2E rewrite + button tests + CI update
7. Phase 5: Documentation updates
