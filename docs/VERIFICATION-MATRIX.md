# Cryptoniumpay — Verification Matrix

> Route → data-testid → API dependencies → Backend endpoints → E2E coverage

**Total routes: 65** | **Last updated:** 2026-02-22

---

## Public Routes (13)

| Route | Path | data-testid | API Calls | Backend Endpoint | E2E |
|-------|------|-------------|-----------|-----------------|-----|
| landing | `/` | `page:landing` | `publicApi.faq()` | `GET /v1/public/faq` | ✅ |
| login | `/login` | `page:login` | `auth.login()` | `POST /v1/auth/login` | ✅ |
| signup | `/signup` | `page:signup` | `auth.signup()` | `POST /v1/auth/signup` | ✅ |
| verify-email | `/verify-email` | `page:verify-email` | `auth.verifyEmailCode()` | `POST /v1/auth/verify-email` | ✅ |
| verify-2fa | `/verify-2fa` | `page:verify-2fa` | `auth.verify2fa()` | `POST /v1/auth/verify-2fa` | ✅ |
| forgot-password | `/forgot-password` | `page:forgot-password` | `auth.forgotPassword()` | `POST /v1/auth/forgot-password` | ✅ |
| reset-password | `/reset-password` | `page:reset-password` | `auth.resetPassword()` | `POST /v1/auth/reset-password` | ✅ |
| terms | `/terms` | `page:terms` | — | — | ✅ |
| privacy | `/privacy` | `page:privacy` | — | — | ✅ |
| pricing | `/pricing` | `page:pricing` | — | — | ✅ |
| contact | `/contact` | `page:contact` | — | — | ✅ |
| blog | `/blog` | `page:blog` | — | — | ✅ |
| faq | `/faq` | `page:faq` | `publicApi.faq()` | `GET /v1/public/faq` | ✅ |

## Docs Routes (5)

| Route | Path | data-testid | API Calls | Backend Endpoint | E2E |
|-------|------|-------------|-----------|-----------------|-----|
| docs-architecture | `/docs/architecture` | `page:docs-architecture` | — | — | ✅ |
| docs-security | `/docs/security` | `page:docs-security` | — | — | ✅ |
| docs-schema | `/docs/schema` | `page:docs-schema` | — | — | ✅ |
| docs-api | `/docs/api` | `page:docs-api` | — | — | ✅ |
| docs-singularitycoin | `/docs/singularitycoin` | `page:docs-singularitycoin` | — | — | ✅ |

## Merchant Dashboard Routes (16)

| Route | Path | data-testid | API Calls | Backend Endpoint | E2E |
|-------|------|-------------|-----------|-----------------|-----|
| dashboard-home | `/dashboard` | `page:dashboard-home` | `dashboard.stats()` | `GET /v1/dashboard/stats` | ✅ |
| dashboard-charges | `/dashboard/charges` | `page:dashboard-charges` | `charges.list()` | `GET /v1/charges` | ✅ |
| dashboard-charges-new | `/dashboard/charges/new` | `page:dashboard-charges-new` | `charges.create()` | `POST /v1/charges` | ✅ |
| dashboard-reports | `/dashboard/reports` | `page:dashboard-reports` | `charges.list()` | `GET /v1/charges` | ✅ |
| dashboard-wallets | `/dashboard/wallets` | `page:dashboard-wallets` | `wallets.list()` | `GET /v1/wallets` | ✅ |
| dashboard-wallet-transactions | `/dashboard/wallets/transactions` | `page:dashboard-wallet-transactions` | `wallets.transactions()` | `GET /v1/wallets/transactions` | ✅ |
| dashboard-invoices | `/dashboard/invoices` | `page:dashboard-invoices` | `invoices.list()` | `GET /v1/invoices` | ✅ |
| dashboard-invoices-new | `/dashboard/invoices/new` | `page:dashboard-invoices-new` | `invoices.create()` | `POST /v1/invoices` | ✅ |
| dashboard-notifications | `/dashboard/notifications` | `page:dashboard-notifications` | `notifications.list()` | `GET /v1/notifications` | ✅ |
| dashboard-settings-settlement | `/dashboard/settings/settlement` | `page:dashboard-settings-settlement` | `settlement.getConfig()` | `GET /v1/settlement` | ✅ |
| dashboard-settings-api-keys | `/dashboard/settings/api-keys` | `page:dashboard-settings-api-keys` | `apiKeys.list()` | `GET /v1/api-keys` | ✅ |
| dashboard-settings-webhooks | `/dashboard/settings/webhooks` | `page:dashboard-settings-webhooks` | `webhooks.list()` | `GET /v1/webhooks` | ✅ |
| dashboard-settings-addresses | `/dashboard/settings/addresses` | `page:dashboard-settings-addresses` | `addressPool.stats()` | `GET /v1/addresses/stats` | ✅ |
| dashboard-settings-security | `/dashboard/settings/security` | `page:dashboard-settings-security` | `security.getSettings()` | `GET /v1/security/settings` | ✅ |
| dashboard-exports | `/dashboard/exports` | `page:dashboard-exports` | `exports.list()` | `GET /v1/exports` | ✅ |
| dashboard-intelligence | `/dashboard/intelligence` | `page:dashboard-intelligence` | — | — | ✅ |

## Admin Routes (22)

| Route | Path | data-testid | API Calls | Backend Endpoint | E2E |
|-------|------|-------------|-----------|-----------------|-----|
| admin-home | `/admin` | `page:admin-home` | `admin.stats()` | `GET /v1/admin/stats` | ✅ |
| admin-revenue | `/admin/revenue` | `page:admin-revenue` | `admin.revenue()` | `GET /v1/admin/revenue` | ✅ |
| admin-fees | `/admin/fees` | `page:admin-fees` | `admin.fees.get()` | `GET /v1/admin/fees` | ✅ |
| admin-merchants | `/admin/merchants` | `page:admin-merchants` | `admin.merchants.list()` | `GET /v1/admin/merchants` | ✅ |
| admin-chains | `/admin/chains` | `page:admin-chains` | `admin.chains.list()` | `GET /v1/admin/chains` | ✅ |
| admin-monitoring | `/admin/monitoring` | `page:admin-monitoring` | `admin.health()` | `GET /v1/admin/health` | ✅ |
| admin-audit-log | `/admin/audit-log` | `page:admin-audit-log` | `admin.auditLog()` | `GET /v1/admin/audit-log` | ✅ |
| admin-wallets | `/admin/wallets` | `page:admin-wallets` | `admin.wallets.stats()` | `GET /v1/admin/wallets/stats` | ✅ |
| admin-wallet-transactions | `/admin/wallets/transactions` | `page:admin-wallet-transactions` | `admin.wallets.transactions()` | `GET /v1/admin/wallets/transactions` | ✅ |
| admin-security-policies | `/admin/security-policies` | `page:admin-security-policies` | `securityPolicies.get()` | `GET /v1/security-policies` | ✅ |
| admin-roles | `/admin/roles` | `page:admin-roles` | `roles.list()` | `GET /v1/admin/roles` | ✅ |
| admin-notifications | `/admin/notifications` | `page:admin-notifications` | `notifications.list()` | `GET /v1/notifications` | ✅ |
| admin-cms | `/admin/cms` | `page:admin-cms` | `admin.cms.stats()` | `GET /v1/admin/cms/stats` | ✅ |
| admin-cms-pages | `/admin/cms/pages` | `page:admin-cms-pages` | `admin.cms.pages()` | `GET /v1/admin/cms/pages` | ✅ |
| admin-cms-blog | `/admin/cms/blog` | `page:admin-cms-blog` | `admin.cms.blog()` | `GET /v1/admin/cms/blog` | ✅ |
| admin-cms-announcements | `/admin/cms/announcements` | `page:admin-cms-announcements` | `admin.cms.announcements()` | `GET /v1/admin/cms/announcements` | ✅ |
| admin-cms-faq | `/admin/cms/faq` | `page:admin-cms-faq` | `admin.cms.faq()` | `GET /v1/admin/cms/faq` | ✅ |
| admin-cms-contacts | `/admin/cms/contacts` | `page:admin-cms-contacts` | `admin.cms.contacts()` | `GET /v1/admin/cms/contacts` | ✅ |
| admin-cms-social | `/admin/cms/social` | `page:admin-cms-social` | — | — | ✅ |
| admin-cms-settings | `/admin/cms/settings` | `page:admin-cms-settings` | `admin.cms.settings()` | `GET /v1/admin/cms/settings` | ✅ |
| admin-exports | `/admin/exports` | `page:admin-exports` | `admin.exports.list()` | `GET /v1/admin/exports` | ✅ |
| admin-intelligence | `/admin/intelligence` | `page:admin-intelligence` | — | — | ✅ |
| admin-api-settings | `/admin/api-settings` | `page:admin-api-settings` | — | — | ✅ |

## Dynamic Routes (3)

| Route | Path | Example | E2E |
|-------|------|---------|-----|
| checkout | `/pay/:chargeId` | `/pay/test-charge-1` | ✅ |
| dashboard-charge-detail | `/dashboard/charges/:id` | `/dashboard/charges/test-charge-1` | ✅ |
| dashboard-invoice-detail | `/dashboard/invoices/:id` | `/dashboard/invoices/test-invoice-1` | ✅ |

## Error Routes (1)

| Route | Path | data-testid | E2E |
|-------|------|-------------|-----|
| not-found | `/nonexistent-route-404` | `page:not-found` | ✅ |

---

## Backend API Endpoints (55+)

| Module | Endpoint | Method | Auth | DTO |
|--------|----------|--------|------|-----|
| Auth | `/v1/auth/login` | POST | Public | `LoginDto` |
| Auth | `/v1/auth/signup` | POST | Public | `SignupDto` |
| Auth | `/v1/auth/logout` | DELETE | JWT | — |
| Auth | `/v1/auth/verify-email` | POST | Public | `VerifyEmailDto` |
| Auth | `/v1/auth/verify-2fa` | POST | Public | `Verify2faDto` |
| Auth | `/v1/auth/resend-email-code` | POST | Public | `ResendEmailCodeDto` |
| Auth | `/v1/auth/forgot-password` | POST | Public | `ForgotPasswordDto` |
| Auth | `/v1/auth/reset-password` | POST | Public | `ResetPasswordDto` |
| Auth | `/v1/auth/refresh` | POST | Public | `RefreshTokenDto` |
| Security | `/v1/security/settings` | GET | JWT | — |
| Security | `/v1/security/2fa/setup` | POST | JWT | — |
| Security | `/v1/security/2fa/enable` | POST | JWT | `{ totp_code }` |
| Security | `/v1/security/2fa/disable` | POST | JWT | `{ totp_code }` |
| Security | `/v1/security/email-verification` | PUT | JWT | `{ enabled }` |
| Security | `/v1/security/backup-codes` | POST | JWT | — |
| Security | `/v1/security/sessions/:id` | DELETE | JWT | — |
| Security | `/v1/security/sessions` | DELETE | JWT | — |
| Security | `/v1/security/password` | PUT | JWT | `{ current_password, new_password }` |
| Charges | `/v1/charges` | POST | JWT | `CreateChargeDto` |
| Charges | `/v1/charges` | GET | JWT | — |
| Charges | `/v1/charges/:id` | GET | JWT | — |
| Charges | `/v1/charges/:id/transactions` | GET | JWT | — |
| Checkout | `/v1/checkout/:id` | GET | Public | — |
| Invoices | `/v1/invoices` | GET/POST | JWT | `CreateInvoiceDto` |
| Invoices | `/v1/invoices/:id` | GET/PUT/DELETE | JWT | `UpdateInvoiceDto` |
| Invoices | `/v1/invoices/:id/send` | POST | JWT | — |
| Invoices | `/v1/invoices/:id/cancel` | POST | JWT | — |
| Invoices | `/v1/invoices/:id/pdf` | GET | JWT | — |
| API Keys | `/v1/api-keys` | GET/POST | JWT | `CreateApiKeyDto` |
| API Keys | `/v1/api-keys/:id` | DELETE | JWT | — |
| Webhooks | `/v1/webhooks` | GET/POST | JWT | `CreateWebhookDto` |
| Webhooks | `/v1/webhooks/:id` | DELETE | JWT | — |
| Webhooks | `/v1/webhooks/:id/test` | POST | JWT | — |
| Webhooks | `/v1/webhooks/:id/deliveries` | GET | JWT | — |
| Settlement | `/v1/settlement` | GET/PUT | JWT | — |
| Settlement | `/v1/sweeps` | GET | JWT | — |
| Addresses | `/v1/addresses` | GET | JWT | — |
| Addresses | `/v1/addresses/stats` | GET | JWT | — |
| Addresses | `/v1/addresses/upload` | POST | JWT | `{ chain, addresses[] }` |
| Wallets | `/v1/wallets` | GET/POST | JWT | — |
| Wallets | `/v1/wallets/:id` | DELETE | JWT | — |
| Wallets | `/v1/wallets/transactions` | GET | JWT | — |
| Dashboard | `/v1/dashboard/stats` | GET | JWT | — |
| Notifications | `/v1/notifications` | GET | JWT | — |
| Notifications | `/v1/notifications/unread-count` | GET | JWT | — |
| Notifications | `/v1/notifications/:id/read` | POST | JWT | — |
| Notifications | `/v1/notifications/read-all` | POST | JWT | — |
| Notifications | `/v1/notifications/preferences` | GET/PUT | JWT | — |
| Security Policies | `/v1/security-policies` | GET/PUT | Admin | — |
| Exports | `/v1/exports` | GET/POST | JWT | — |
| Exports | `/v1/exports/:id` | GET | JWT | — |
| Exports | `/v1/exports/:id/download` | GET | JWT | — |
| Health | `/v1/health` | GET | Public | — |
| Health | `/v1/health/system` | GET | Admin | — |
| Metrics | `/metrics` | GET | Public | — |
| Admin | `55+ endpoints under /v1/admin/*` | Various | Admin+RBAC | — |

---

## Security Controls

| Control | Status |
|---------|--------|
| Argon2id password hashing | ✅ |
| JWT + refresh token rotation | ✅ |
| Refresh token reuse detection | ✅ |
| TOTP 2FA via otplib | ✅ |
| Backup codes (argon2id hashed) | ✅ |
| RBAC with permissions guard | ✅ |
| Rate limiting (Redis) | ✅ |
| Maintenance mode guard | ✅ |
| IP allowlist guard | ✅ |
| Edge HMAC signature (CF Worker) | ✅ |
| Webhook HMAC signing | ✅ |
| Input validation (class-validator, forbidNonWhitelisted) | ✅ |
| Prometheus metrics | ✅ |
| Structured logging with correlation IDs | ✅ |
| Audit logging | ✅ |
