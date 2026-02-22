

# Cryptonpay — Production Readiness Plan

## Scope Clarification

This is a **Lovable-hosted React SPA** project. Lovable runs React + Vite + Tailwind only — it cannot run Node.js servers, NestJS, PostgreSQL, Redis, or Docker. The backend (NestJS + Postgres + Redis + BullMQ + Signer + Watchers) is a **separate repository** that must be built and deployed independently.

This plan covers everything that CAN be done inside this project to reach 100% production readiness.

---

## What Will Be Built (14 Deliverables)

### 1. Signup Page + Route
- New `/signup` page with name, email, password, confirm password fields
- Zod validation (email format, password strength, match confirmation)
- "Back to Home" button (matching Login page pattern)
- New API client method: `auth.signup()` -> POST `/v1/auth/signup`
- New TypeScript type: `SignupRequest`
- Route added to `App.tsx` (public, no auth)
- Login page gets "Don't have an account? Sign up" link
- Signup page gets "Already have an account? Log in" link

### 2. Frontend API Client — Add Signup Endpoint
- Add `SignupRequest` and `SignupResponse` types to `types.ts`
- Add `auth.signup` method to `api-client.ts`
- Total endpoints: 33 (32 existing + 1 signup)

### 3. Fix Auth Logout Method
- Current code calls `http.post("/v1/auth/logout")` but DEVELOPER.md documents it as DELETE
- Fix to `http.delete("/v1/auth/logout")` to match documentation

### 4. Fix API Client URL Discrepancies
- `api-client.ts` uses `/v1/settlement` but DEVELOPER.md says `/settlement/config` — align to match actual axios paths (the frontend code is the source of truth since it's what actually runs)
- Document the ACTUAL endpoint paths used by the frontend in DEVELOPER.md

### 5. CoinMarketCap + Multi-Source Price Data
- Enhance `CryptoPriceTicker.tsx` to support CoinGecko (current) + CoinMarketCap proxy pattern
- Add fallback: if CoinGecko fails, show cached data with "stale" indicator
- Add more coins: SOL, XRP, ADA, DOT alongside existing BTC/ETH/USDC/BNB/SOL
- Add 24h volume and market cap display

### 6. Landing Page — Premium Crypto Dashboard
- Enhanced hero with animated price tickers
- Live price cards with sparkline charts (already exists, will polish)
- Add "Top Movers" section showing 24h gainers/losers
- Add trust indicators (security badges, uptime stats)
- Add "How It Works" step-by-step section

### 7. Complete Backend Specification Documents

**New files to create:**

- `docs/BACKEND-SPEC.md` — Complete NestJS backend specification with:
  - All 33 endpoints with exact request/response schemas
  - Prisma schema for all 18 tables
  - Module structure (auth, charges, webhooks, admin, etc.)
  - BullMQ queue definitions
  - Middleware chain (auth, rate-limit, validation)

- `docs/SECURITY.md` — Threat model, auth flows, webhook signing, secrets handling

- `docs/RUNBOOK.md` — Operational procedures: rotate secrets, scale workers, handle failed webhooks, DB migrations, incident response

- `docs/API.md` — Full API reference with curl examples for every endpoint

### 8. Update DEPLOYMENT.md
- Add backend deployment sections (NestJS + Postgres + Redis)
- Add Cloudflare Workers edge gateway configuration
- Add wrangler.toml template
- Add docker-compose.yml templates (dev + prod)
- Add Dockerfile templates for each service
- Add systemd unit files
- Add backup/restore procedures
- Add health check verification steps

### 9. Update README.md
- Add architecture diagram
- Add "For Developers" section linking to DEVELOPER.md
- Add local dev quickstart for frontend + backend
- Add production deployment links
- Add badge placeholders (CI, coverage, license)

### 10. Update DEVELOPER.md
- Add signup page documentation
- Update endpoint count to 33
- Add backend specification cross-references
- Update file tree

### 11. Error Handling Improvements
- Standardize error display across all pages
- Add retry buttons on failed API calls
- Add offline detection banner
- Ensure all loading states show skeletons (already done, verify)

### 12. Security Headers Enhancement
- Update `public/_headers` with stricter CSP
- Add Permissions-Policy header
- Add Referrer-Policy header

### 13. CI/CD Configuration
- Create `.github/workflows/ci.yml` for frontend:
  - Lint, typecheck, test, build
  - Deploy to Cloudflare Pages on main branch

### 14. Playwright Smoke Test Configuration
- Create `e2e/` directory with Playwright config
- Add smoke tests: landing page loads, login page loads, docs pages load, 404 works

---

## Technical Details

### New Files Created
```text
src/pages/Signup.tsx                    # Signup page
docs/BACKEND-SPEC.md                   # Full backend specification
docs/SECURITY.md                       # Security documentation
docs/RUNBOOK.md                        # Operations runbook
docs/API.md                            # API reference with curl examples
.github/workflows/ci.yml               # CI pipeline
e2e/playwright.config.ts               # Playwright config
e2e/smoke.spec.ts                      # Smoke tests
```

### Modified Files
```text
src/App.tsx                            # Add /signup route
src/lib/types.ts                       # Add SignupRequest/Response
src/lib/api-client.ts                  # Add auth.signup, fix logout method
src/pages/Login.tsx                    # Add signup link
src/pages/LandingPage.tsx              # Enhanced price display
src/components/CryptoPriceTicker.tsx   # Multi-source prices, more coins
public/_headers                        # Stricter security headers
README.md                              # Comprehensive update
DEVELOPER.md                           # Add signup, update counts
DEPLOYMENT.md                          # Full backend deployment guide
```

### Signup Page Design
- Centered card layout (matches Login)
- Fields: Full Name, Email, Password (with strength indicator), Confirm Password
- Zod schema: email valid, password min 8 chars + 1 uppercase + 1 number, passwords match
- On success: auto-login and redirect to `/dashboard`
- Error display: field-level + form-level
- "Back to Home" arrow button (top-left, matching Login)

### Error Response Format (Standardized)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already registered",
    "details": { "field": "email" }
  }
}
```

### Execution Order
1. Types + API client updates (foundation)
2. Signup page + route wiring
3. Login page cross-link
4. Landing page enhancements
5. CryptoPriceTicker improvements
6. Documentation (BACKEND-SPEC, SECURITY, RUNBOOK, API)
7. DEPLOYMENT.md update
8. README.md update
9. DEVELOPER.md update
10. Security headers
11. CI configuration
12. Smoke tests

