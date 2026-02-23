# Cryptoniumpay — API Reference

> Complete REST API reference with curl examples for every endpoint.

**Base URL:** `https://api.yourdomain.com` (or `http://localhost:3000` for local dev)
**Version:** v1
**Auth:** JWT Bearer token (unless marked public)

---

## Authentication

### Login

```bash
curl -X POST https://api.yourdomain.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "merchant@example.com", "password": "SecurePass123"}'
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx1234567890",
    "email": "merchant@example.com",
    "role": "merchant",
    "merchant_id": "clxmerchant123"
  }
}
```

### Signup

```bash
curl -X POST https://api.yourdomain.com/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "password": "SecurePass123"}'
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx9876543210",
    "email": "jane@example.com",
    "role": "merchant",
    "merchant_id": "clxmerchant456"
  }
}
```

### Logout

```bash
curl -X DELETE https://api.yourdomain.com/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `204 No Content`

---

## Charges

### Create Charge

```bash
curl -X POST https://api.yourdomain.com/v1/charges \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "name": "Order #42",
    "description": "Premium subscription",
    "pricing_type": "fixed_price",
    "local_price": { "amount": "99.00", "currency": "USD" },
    "expires_in_minutes": 60,
    "redirect_url": "https://yoursite.com/success",
    "cancel_url": "https://yoursite.com/cancel"
  }'
```

**Response (201):**
```json
{
  "id": "clxcharge123",
  "merchant_id": "clxmerchant123",
  "name": "Order #42",
  "description": "Premium subscription",
  "pricing_type": "fixed_price",
  "local_price": { "amount": "99.00", "currency": "USD" },
  "status": "NEW",
  "addresses": {
    "btc_BTC": { "chain": "btc", "asset": "BTC", "address": "bc1q...", "amount": "0.00105" },
    "eth_USDC": { "chain": "eth", "asset": "USDC", "address": "0x...", "amount": "99.00" }
  },
  "hosted_url": "https://pay.yourdomain.com/pay/clxcharge123",
  "expires_at": "2026-02-22T11:00:00Z",
  "created_at": "2026-02-22T10:00:00Z",
  "updated_at": "2026-02-22T10:00:00Z"
}
```

### Get Charge

```bash
curl https://api.yourdomain.com/v1/charges/clxcharge123 \
  -H "Authorization: Bearer $TOKEN"
```

### List Charges

```bash
curl "https://api.yourdomain.com/v1/charges?status=PENDING&page=1&per_page=25" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "data": [{ "id": "...", "name": "...", "status": "PENDING", ... }],
  "total": 142,
  "page": 1,
  "per_page": 25,
  "total_pages": 6
}
```

### Get Charge Transactions

```bash
curl https://api.yourdomain.com/v1/charges/clxcharge123/transactions \
  -H "Authorization: Bearer $TOKEN"
```

---

## Checkout (Public)

### Get Charge for Checkout

```bash
curl https://api.yourdomain.com/v1/checkout/clxcharge123
```

**No authentication required.** Returns the same `Charge` object.

---

## API Keys

### List API Keys

```bash
curl https://api.yourdomain.com/v1/api-keys \
  -H "Authorization: Bearer $TOKEN"
```

### Create API Key

```bash
curl -X POST https://api.yourdomain.com/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Key", "scopes": ["read", "write"]}'
```

**Response (201):**
```json
{
  "id": "clxkey123",
  "merchant_id": "clxmerchant123",
  "name": "Production Key",
  "prefix": "cp_live_",
  "key": "cp_live_a1b2c3d4e5f6g7h8i9j0...",
  "scopes": ["read", "write"],
  "created_at": "2026-02-22T10:00:00Z"
}
```

> ⚠️ The `key` field is only returned at creation. Store it securely.

### Revoke API Key

```bash
curl -X DELETE https://api.yourdomain.com/v1/api-keys/clxkey123 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Webhooks

### List Webhooks

```bash
curl https://api.yourdomain.com/v1/webhooks \
  -H "Authorization: Bearer $TOKEN"
```

### Create Webhook

```bash
curl -X POST https://api.yourdomain.com/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yoursite.com/webhooks/crypto", "events": ["charge.paid", "charge.expired"]}'
```

### Delete Webhook

```bash
curl -X DELETE https://api.yourdomain.com/v1/webhooks/clxwebhook123 \
  -H "Authorization: Bearer $TOKEN"
```

### Test Webhook

```bash
curl -X POST https://api.yourdomain.com/v1/webhooks/clxwebhook123/test \
  -H "Authorization: Bearer $TOKEN"
```

### Get Webhook Deliveries

```bash
curl https://api.yourdomain.com/v1/webhooks/clxwebhook123/deliveries \
  -H "Authorization: Bearer $TOKEN"
```

---

## Settlement

### Get Settlement Config

```bash
curl https://api.yourdomain.com/v1/settlement \
  -H "Authorization: Bearer $TOKEN"
```

### Update Settlement Config

```bash
curl -X PUT https://api.yourdomain.com/v1/settlement \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "eth",
    "asset": "USDC",
    "address": "0xYourSettlementAddress",
    "sweep_mode": "immediate",
    "min_sweep_threshold": "10.00"
  }'
```

### List Sweeps

```bash
curl https://api.yourdomain.com/v1/sweeps \
  -H "Authorization: Bearer $TOKEN"
```

---

## Deposit Addresses

### Get Pool Stats

```bash
curl https://api.yourdomain.com/v1/addresses/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Upload Addresses

```bash
curl -X POST https://api.yourdomain.com/v1/addresses/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chain": "eth", "addresses": ["0xAddr1...", "0xAddr2...", "0xAddr3..."]}'
```

### List Addresses

```bash
curl "https://api.yourdomain.com/v1/addresses?chain=eth" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Dashboard

### Get Dashboard Stats

```bash
curl https://api.yourdomain.com/v1/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "total_charges": 1842,
  "pending_payments": 12,
  "confirmed_today": 34,
  "total_volume_usd": "284531.00"
}
```

---

## Admin

All admin endpoints require `role: "admin"`.

### Get Admin Stats

```bash
curl https://api.yourdomain.com/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

### List Merchants

```bash
curl https://api.yourdomain.com/v1/admin/merchants \
  -H "Authorization: Bearer $TOKEN"
```

### Get Merchant

```bash
curl https://api.yourdomain.com/v1/admin/merchants/clxmerchant123 \
  -H "Authorization: Bearer $TOKEN"
```

### Toggle Merchant Status

```bash
curl -X PATCH https://api.yourdomain.com/v1/admin/merchants/clxmerchant123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "disabled"}'
```

### List Chains

```bash
curl https://api.yourdomain.com/v1/admin/chains \
  -H "Authorization: Bearer $TOKEN"
```

### Update Chain Config

```bash
curl -X PUT https://api.yourdomain.com/v1/admin/chains/eth \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "confirmation_threshold": 12}'
```

### List Assets

```bash
curl https://api.yourdomain.com/v1/admin/assets \
  -H "Authorization: Bearer $TOKEN"
```

### Toggle Asset

```bash
curl -X PATCH https://api.yourdomain.com/v1/admin/assets/eth/USDC \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### System Health

```bash
curl https://api.yourdomain.com/v1/admin/health \
  -H "Authorization: Bearer $TOKEN"
```

### Audit Log

```bash
curl "https://api.yourdomain.com/v1/admin/audit-log?action=merchant.disable&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Wallets

### List Wallets

```bash
curl https://api.yourdomain.com/v1/wallets \
  -H "Authorization: Bearer $TOKEN"
```

### Generate Wallet

```bash
curl -X POST https://api.yourdomain.com/v1/wallets/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label": "BTC Payments", "chain": "btc"}'
```

**Response (201):**
```json
{
  "id": "clxwallet123",
  "label": "BTC Payments",
  "chain": "btc",
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "private_key": "Kx...",
  "mnemonic": "word1 word2 ... word12",
  "type": "hot",
  "status": "active"
}
```

> ⚠️ `private_key` and `mnemonic` are returned ONLY at creation. Store them securely.

### Send Transaction

```bash
curl -X POST https://api.yourdomain.com/v1/wallets/clxwallet123/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to_address": "bc1q...", "amount": "0.001", "memo": "Payment"}'
```

### Estimate Fee

```bash
curl -X POST https://api.yourdomain.com/v1/wallets/clxwallet123/estimate-fee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to_address": "bc1q...", "amount": "0.001"}'
```

### Get Portfolio

```bash
curl https://api.yourdomain.com/v1/wallets/portfolio \
  -H "Authorization: Bearer $TOKEN"
```

### Get Deposit Info

```bash
curl https://api.yourdomain.com/v1/wallets/deposit/btc \
  -H "Authorization: Bearer $TOKEN"
```

### Wallet Transaction History

```bash
curl "https://api.yourdomain.com/v1/wallets/transactions?direction=receive&page=1&per_page=25" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Invoices

### Create Invoice

```bash
curl -X POST https://api.yourdomain.com/v1/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Acme Corp",
    "customer_email": "billing@acme.com",
    "amount": "500.00",
    "currency": "USD",
    "due_date": "2026-03-15"
  }'
```

### List Invoices

```bash
curl "https://api.yourdomain.com/v1/invoices?status=sent&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Send Invoice

```bash
curl -X POST https://api.yourdomain.com/v1/invoices/clxinvoice123/send \
  -H "Authorization: Bearer $TOKEN"
```

---

## Health (Public)

```bash
curl https://api.yourdomain.com/v1/health
```

**Response (200):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 86400
}
```

---

## Error Format

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already registered",
    "details": { "field": "email" }
  }
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate (e.g. email exists) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
