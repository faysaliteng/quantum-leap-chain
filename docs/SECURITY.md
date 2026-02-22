# Cryptoniumpay — Security Documentation

> Threat model, authentication flows, webhook security, and secrets handling for the Cryptoniumpay platform.

**Version:** 1.0.0
**Last updated:** 2026-02-22

---

## Table of Contents

1. [Threat Model (STRIDE)](#1-threat-model-stride)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Authorization (RBAC)](#3-authorization-rbac)
4. [API Key Security](#4-api-key-security)
5. [Webhook Security](#5-webhook-security)
6. [Secrets Management](#6-secrets-management)
7. [Network Security](#7-network-security)
8. [Input Validation](#8-input-validation)
9. [Rate Limiting](#9-rate-limiting)
10. [Audit Logging](#10-audit-logging)
11. [Cryptographic Standards](#11-cryptographic-standards)
12. [Hardening Checklist](#12-hardening-checklist)

---

## 1. Threat Model (STRIDE)

| Threat | Category | Mitigation |
|--------|----------|------------|
| Attacker steals JWT | Spoofing | Short-lived access tokens (15 min), refresh rotation, reuse detection |
| Man-in-the-middle on webhook delivery | Tampering | HMAC-SHA256 signatures with timestamp replay protection |
| Attacker denies creating charge | Repudiation | Append-only audit log with actor ID, IP, timestamp |
| Database breach exposes API keys | Information Disclosure | API keys stored as argon2id hashes, never plaintext |
| DDoS on payment endpoints | Denial of Service | Redis-backed rate limiting per IP and per merchant |
| Worker escalates to admin | Elevation of Privilege | RBAC with roles guard, signer on isolated network |

---

## 2. Authentication Architecture

### JWT Flow

```
Login/Signup → Access Token (15 min) + Refresh Token (7 days)
                    ↓
            API calls with Bearer token
                    ↓
            Token expires → Client calls /v1/auth/refresh
                    ↓
            New access + refresh tokens issued
            Old refresh token invalidated
```

### Token Storage

| Token | Storage | Lifetime |
|-------|---------|----------|
| Access token | `localStorage` (`sp_token`) | 15 minutes |
| Refresh token | HTTP-only cookie (future) / localStorage | 7 days |
| User profile | `localStorage` (`sp_user`) | Until logout |

### Password Policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Hashed with argon2id (memoryCost: 64MB, timeCost: 3, parallelism: 4)

---

## 3. Authorization (RBAC)

| Role | Access |
|------|--------|
| `merchant` | Own charges, API keys, webhooks, settlement, addresses, dashboard |
| `admin` | Everything merchant has + all `/v1/admin/*` endpoints |

### Enforcement Points

1. **Frontend:** `ProtectedRoute` component with optional `requiredRole` prop
2. **Backend:** `JwtAuthGuard` + `RolesGuard` decorators on controllers
3. **Database:** Merchant-scoped queries (always filter by `merchant_id`)

---

## 4. API Key Security

- Keys generated as 32-byte random hex with 8-char prefix for identification
- Full key shown ONCE at creation, then only the prefix is stored
- Key stored as argon2id hash in `api_keys.key_hash`
- Scoped: `read`, `write`, `admin`
- Revocable without affecting other keys
- Usage tracked via `last_used_at`

---

## 5. Webhook Security

### Signing

```
Signature = HMAC-SHA256(secret, timestamp + "." + JSON.stringify(payload))
```

### Headers Sent

```
x-cryptoniumpay-signature: sha256=<hex>
x-cryptoniumpay-timestamp: <unix_seconds>
x-cryptoniumpay-event: charge.paid
```

### Replay Protection

- Reject webhooks with timestamp > 5 minutes old
- Each delivery has a unique `event_id`

### Retry Policy

- 5 attempts with exponential backoff: 10s, 30s, 90s, 270s, 810s
- Dead-letter after max attempts
- Circuit breaker: disable endpoint after 10 consecutive failures

---

## 6. Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `JWT_SECRET` | Environment variable | Manual, requires restart |
| `SIGNER_SECRET` | Environment variable, isolated network | Manual |
| Database password | Environment variable | Via credential rotation |
| Webhook signing secrets | Database (per endpoint) | Auto-generated at creation |
| API key material | Hashed in DB, never recoverable | Revoke + create new |
| Private keys (signer) | AES-256-GCM encrypted keystore / KMS | Via KMS rotation |

### Rules

1. Never log secrets
2. Never commit secrets to git
3. Use `.env` files only in development
4. Production: use Docker secrets or KMS
5. Rotate `JWT_SECRET` requires invalidating all sessions

---

## 7. Network Security

### Docker Network Isolation

```
frontend_net ── Nginx + API (public-facing)
backend_net  ── API + Worker + Postgres + Redis (internal, no internet)
signer_net   ── Worker + Signer ONLY (maximum isolation)
```

- Signer cannot reach the internet
- Signer cannot reach the database directly
- Only the worker process can communicate with the signer

### CORS

- Allowed origins: configured via `CORS_ORIGINS` env var
- Methods: GET, POST, PUT, PATCH, DELETE
- Credentials: true
- Max age: 86400s

### Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

---

## 8. Input Validation

- All endpoints validate request body with Zod / class-validator
- Unknown fields are rejected (`stripUnknown: false, forbidNonWhitelisted: true`)
- Request body size limit: 10KB (configurable)
- URL parameters validated with regex patterns
- SQL injection prevented by Prisma parameterized queries

---

## 9. Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Public endpoints (login, signup) | 10 req | 1 min |
| Authenticated endpoints | 100 req | 1 min |
| Checkout polling | 30 req | 1 min |
| Admin endpoints | 200 req | 1 min |
| Webhook test | 5 req | 1 min |

Backed by Redis with sliding window algorithm.

---

## 10. Audit Logging

Every state-changing operation is logged:

```json
{
  "id": "cuid",
  "actor_id": "user_id",
  "actor_email": "admin@example.com",
  "action": "merchant.disable",
  "resource_type": "merchant",
  "resource_id": "merchant_123",
  "details": { "reason": "TOS violation" },
  "ip_address": "203.0.113.42",
  "created_at": "2026-02-22T10:00:00Z"
}
```

- Append-only (no UPDATE/DELETE on audit_logs)
- Indexed by actor_id, action, created_at
- Filterable in admin dashboard

---

## 11. Cryptographic Standards

| Purpose | Algorithm |
|---------|-----------|
| Password hashing | argon2id |
| API key hashing | argon2id |
| JWT signing | HMAC-SHA256 (HS256) |
| Webhook signing | HMAC-SHA256 |
| Key encryption at rest | AES-256-GCM |
| Random token generation | `crypto.randomBytes(32)` |

---

## 12. Hardening Checklist

- [ ] All secrets stored in environment variables, not in code
- [ ] JWT_SECRET is at least 64 characters of random hex
- [ ] Database password is at least 32 characters
- [ ] CORS origins are explicitly whitelisted
- [ ] Rate limiting is enabled on all endpoints
- [ ] Request body size is limited to 10KB
- [ ] All user inputs are validated before processing
- [ ] SQL injection is prevented (Prisma parameterized queries)
- [ ] XSS is prevented (React auto-escapes, no dangerouslySetInnerHTML)
- [ ] CSRF is mitigated (SameSite cookies, Bearer auth)
- [ ] Signer runs on isolated Docker network
- [ ] TLS is enforced in production (HSTS header)
- [ ] Audit log captures all admin actions
- [ ] Webhook secrets are unique per endpoint
- [ ] API keys are hashed before storage
- [ ] Failed login attempts are rate-limited
- [ ] Dependencies are regularly updated
- [ ] Docker images use non-root users

---

## 13. Edge Signature (HMAC) — Cloudflare Worker ↔ Origin

### How it works

The Cloudflare Worker gateway signs every proxied request with an HMAC-SHA256 signature using a shared `EDGE_SECRET`. The backend validates this signature before processing the request.

### Signature format

```
X-Edge-Signature: t=<unix_timestamp>,v1=<hmac_hex>
```

### HMAC payload

```
HMAC-SHA256(EDGE_SECRET, "<timestamp>.<HTTP_METHOD>.<path_with_query>")
```

### Replay protection

- Signatures older than 5 minutes are rejected
- Timestamp is compared against server time

### Configuration

```bash
# Set on Cloudflare Worker
wrangler secret put EDGE_SECRET
# Enter: <64-char hex string from: openssl rand -hex 32>

# Set on backend (.env)
EDGE_SECRET=<same value>
```

### Behavior

- If `EDGE_SECRET` is NOT set on backend → guard is disabled (dev mode)
- If `EDGE_SECRET` IS set → all requests MUST have valid `X-Edge-Signature`

---

## 14. Maintenance Mode Enforcement

### Edge enforcement (Cloudflare Worker)

Set `MAINTENANCE_MODE=true` in `wrangler.toml` vars to return 503 at the edge before requests reach the origin.

### Origin enforcement (NestJS MaintenanceGuard)

Reads from `security_policies` table (`access.maintenance_mode`). Caches in Redis for 60 seconds. Bypass IPs configured in `access.bypass_ips` array.

### IP Allowlist

When `access.ip_allowlist_enabled` is true, only IPs in `access.ip_allowlist` can access the API. The `/v1/health` endpoint is always allowed.
