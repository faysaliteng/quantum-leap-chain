# Cryptoniumpay — Merchant Integration Guide

> **Complete, noob-friendly guide for merchants.**  
> Covers: Account setup, API keys, creating charges, receiving payments, webhooks, invoices, wallet management.  
> **No coding experience required** — every step has copy-paste examples.  
> **Last updated:** February 23, 2026

---

## Table of Contents

1. [Getting Started (5 Minutes)](#1-getting-started-5-minutes)
2. [Your Dashboard — What's Where](#2-your-dashboard--whats-where)
3. [Creating API Keys](#3-creating-api-keys)
4. [Accepting Payments (Charges)](#4-accepting-payments-charges)
5. [Hosted Checkout Page](#5-hosted-checkout-page)
6. [Webhooks — Get Notified When Paid](#6-webhooks--get-notified-when-paid)
7. [Managing Invoices](#7-managing-invoices)
8. [Wallet Management](#8-wallet-management)
9. [Settlement & Withdrawals](#9-settlement--withdrawals)
10. [Security Settings](#10-security-settings)
11. [Exports & Reports](#11-exports--reports)
12. [Code Examples (Copy-Paste)](#12-code-examples-copy-paste)
13. [FAQ](#13-faq)

---

## 1. Getting Started (5 Minutes)

### Step 1: Create Your Account

1. Go to `https://cryptoniumpay.pages.dev/signup`
2. Enter your **name**, **email**, and **password**
3. Password must be at least 8 characters with uppercase, number, and symbol
4. Click **Create Account**
5. You'll be redirected to the **Merchant Dashboard**

> 💡 **That's it!** No KYC, no company verification, no waiting period. You can start accepting payments immediately.

### Step 2: Secure Your Account

1. Go to **Settings** → **Security** (left sidebar)
2. Click **Enable 2FA** (Two-Factor Authentication)
3. Scan the QR code with Google Authenticator or Authy
4. Enter the 6-digit code to confirm
5. **Save your backup codes** somewhere safe — you need these if you lose your phone

### Step 3: Get Your API Key

1. Go to **Settings** → **API Keys** (left sidebar)
2. Click **Create API Key**
3. Give it a name (e.g., "My Website")
4. Select scopes: **read** + **write** (for creating charges)
5. Click **Create**
6. **⚠️ COPY THE KEY NOW** — it's shown only once!

Your API key looks like: `cp_live_a1b2c3d4e5f6g7h8i9j0...`

---

## 2. Your Dashboard — What's Where

When you log in, you see the **Merchant Dashboard** at `/dashboard`. Here's what each section does:

| Section | What It Does | Location |
|---------|-------------|----------|
| **Dashboard Home** | Overview: total charges, pending payments, volume, charts | `/dashboard` |
| **Charges** | Create and manage payment requests | `/dashboard/charges` |
| **Invoices** | Create and send invoices to customers | `/dashboard/invoices` |
| **Wallets** | Manage your crypto wallets (hot + cold) | `/dashboard/wallets` |
| **Reports** | Export transaction data as CSV/JSON | `/dashboard/reports` |
| **Notifications** | Payment alerts, system updates | `/dashboard/notifications` |
| **Export Center** | Download large data exports | `/dashboard/exports` |
| **Intelligence** | Predictive analytics (volume trends, risk) | `/dashboard/intelligence` |

### Settings (left sidebar → Settings):

| Setting | What It Does |
|---------|-------------|
| **Settlement** | Where your crypto gets sent after payment |
| **API Keys** | Create/revoke API keys for your website |
| **Webhooks** | Get notified when payments happen |
| **Address Pool** | Pre-load deposit addresses |
| **Security** | 2FA, sessions, password change |

---

## 3. Creating API Keys

API keys let your website or app talk to Cryptoniumpay.

### Via Dashboard (Easiest)

1. Login → **Settings** → **API Keys**
2. Click **Create API Key**
3. Fill in:
   - **Name:** Something descriptive (e.g., "Production Website")
   - **Scopes:** Select what this key can do:
     - `read` — View charges, invoices, balances
     - `write` — Create charges, send payments
     - `admin` — Full access (use sparingly)
4. Click **Create**
5. **Copy the key immediately** — you will never see it again

### Via API (curl)

```bash
# First, login to get a JWT token
TOKEN=$(curl -s -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Create an API key
curl -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Website", "scopes": ["read", "write"]}'
```

### Key Security Rules

- ❌ **Never** put your API key in frontend JavaScript (visible to everyone)
- ✅ **Always** use it in your backend server code only
- ✅ Store it in environment variables (`.env` file), not in code
- ✅ Use separate keys for testing and production
- ✅ Revoke and rotate keys regularly

### Revoking a Key

1. Dashboard → **Settings** → **API Keys**
2. Find the key → Click **Revoke**
3. The key stops working immediately

---

## 4. Accepting Payments (Charges)

A "Charge" is a payment request. When you create a charge, Cryptoniumpay generates unique crypto addresses for the customer to pay to.

### How It Works (The Full Flow)

```
1. Your website creates a Charge via API
2. Cryptoniumpay returns a hosted_url (checkout page)
3. You redirect the customer to that URL
4. Customer sees a QR code + amount for BTC, ETH, etc.
5. Customer pays with their crypto wallet
6. Blockchain confirms the transaction
7. Cryptoniumpay sends a webhook to your server
8. Your server marks the order as "paid"
```

### Create a Charge (via Dashboard)

1. Go to **Dashboard** → **Charges** → **Create Charge**
2. Fill in:
   - **Name:** "Order #1234" (what the customer sees)
   - **Description:** "Premium subscription - 1 year"
   - **Amount:** 99.00
   - **Currency:** USD
   - **Expiration:** 60 minutes (how long customer has to pay)
3. Click **Create Charge**
4. Copy the **Hosted URL** — this is where you send the customer

### Create a Charge (via API)

This is the recommended way for automated systems:

```bash
curl -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/charges \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-1234-unique-id" \
  -d '{
    "name": "Order #1234",
    "description": "Premium subscription - 1 year",
    "pricing_type": "fixed_price",
    "local_price": {
      "amount": "99.00",
      "currency": "USD"
    },
    "expires_in_minutes": 60,
    "redirect_url": "https://yoursite.com/thank-you",
    "cancel_url": "https://yoursite.com/cart"
  }'
```

**Response:**
```json
{
  "id": "clxcharge123",
  "status": "NEW",
  "hosted_url": "https://cryptoniumpay.pages.dev/pay/clxcharge123",
  "addresses": {
    "btc_BTC": {
      "chain": "btc",
      "asset": "BTC",
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "amount": "0.00105"
    },
    "eth_ETH": {
      "chain": "eth",
      "asset": "ETH",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD65",
      "amount": "0.0312"
    }
  },
  "expires_at": "2026-02-23T13:00:00Z"
}
```

### What is the Idempotency-Key?

The `Idempotency-Key` header prevents duplicate charges. If your server crashes and retries the same request, the API returns the same charge instead of creating a new one.

**Rule:** Use a unique ID per order (e.g., your order ID).

### Charge Statuses

| Status | Meaning | What to Do |
|--------|---------|-----------|
| `NEW` | Just created, no payment yet | Customer needs to pay |
| `PENDING` | Payment detected, waiting for confirmations | Wait for blockchain confirmations |
| `CONFIRMED` | Payment confirmed on blockchain | ✅ Fulfill the order! |
| `EXPIRED` | Customer didn't pay in time | Show "payment expired" message |
| `CANCELLED` | You cancelled the charge | Nothing |

### Get Charge Status

```bash
curl https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/charges/clxcharge123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### List All Charges

```bash
# All charges
curl https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/charges \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl "https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/charges?status=CONFIRMED&page=1&per_page=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 5. Hosted Checkout Page

When you create a charge, you get a `hosted_url`. This is a ready-made checkout page hosted by Cryptoniumpay.

### What the Customer Sees

The checkout page (`/pay/:chargeId`) shows:
- 💰 **Amount** in crypto (e.g., 0.00105 BTC)
- 📱 **QR Code** — scan with any crypto wallet
- ⏱️ **Countdown Timer** — time left to pay
- 🔗 **Chain Selector** — choose BTC, ETH, Polygon, etc.
- 📋 **Copy Address** — one-click copy the payment address

### Redirect Flow

```
Your Website                    Cryptoniumpay
    │                               │
    ├── POST /v1/charges ──────────►│
    │                               │
    │◄── { hosted_url: "..." } ─────│
    │                               │
    ├── Redirect customer ─────────►│  (Checkout Page)
    │                               │
    │                               │  Customer pays...
    │                               │  Blockchain confirms...
    │                               │
    │◄── Webhook: charge.confirmed ─│
    │                               │
    ├── Redirect to redirect_url ──►│
    │   (Thank you page)            │
```

### Embedding the Checkout (iframe)

You can also embed the checkout page in your website:

```html
<iframe 
  src="https://cryptoniumpay.pages.dev/pay/clxcharge123" 
  width="400" 
  height="600" 
  frameborder="0"
></iframe>
```

---

## 6. Webhooks — Get Notified When Paid

Webhooks are HTTP callbacks. When a payment is confirmed, Cryptoniumpay sends a POST request to your server.

### Why Use Webhooks?

Without webhooks, you'd have to keep polling the API asking "is it paid yet?" That's slow and wasteful. Webhooks tell YOU instantly.

### Step 1: Create a Webhook Endpoint

On your server, create an endpoint that accepts POST requests:

```javascript
// Node.js / Express example
app.post('/webhooks/cryptoniumpay', (req, res) => {
  const event = req.body;
  
  console.log('Received webhook:', event.type);
  
  if (event.type === 'charge:confirmed') {
    const chargeId = event.data.id;
    const amount = event.data.local_price.amount;
    
    // Mark order as paid in your database
    markOrderAsPaid(chargeId, amount);
  }
  
  // Always respond with 200 OK
  res.status(200).send('OK');
});
```

### Step 2: Register the Webhook in Cryptoniumpay

**Via Dashboard:**
1. Go to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. Enter your URL: `https://yoursite.com/webhooks/cryptoniumpay`
4. Select events: `charge.paid`, `charge.confirmed`, `charge.expired`
5. Click **Create**

**Via API:**
```bash
curl -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/cryptoniumpay",
    "events": ["charge.paid", "charge.confirmed", "charge.expired"]
  }'
```

### Step 3: Verify Webhook Signatures (Important!)

Every webhook includes an HMAC-SHA256 signature in the `X-Signature` header. **Always verify this** to make sure the webhook actually came from Cryptoniumpay:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/cryptoniumpay', (req, res) => {
  const signature = req.headers['x-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, 'YOUR_WEBHOOK_SECRET');
  
  if (!isValid) {
    console.error('Invalid webhook signature!');
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook...
  res.status(200).send('OK');
});
```

### Webhook Events

| Event | When It Fires | What to Do |
|-------|--------------|-----------|
| `charge.created` | Charge is created | Nothing (informational) |
| `charge.pending` | Payment detected, waiting for confirmations | Show "payment received, confirming..." |
| `charge.confirmed` | Payment confirmed ✅ | **Fulfill the order!** |
| `charge.expired` | Charge expired (customer didn't pay) | Show "payment expired" |
| `charge.failed` | Payment failed or underpaid | Contact customer |

### Testing Webhooks

1. Dashboard → **Settings** → **Webhooks**
2. Find your webhook → Click **Test**
3. A test event will be sent to your URL
4. Check your server logs to confirm receipt

### Webhook Delivery Logs

Every webhook delivery is logged. If your server was down, you can see:
- When it was sent
- HTTP status code your server returned
- Number of retry attempts

Dashboard → **Settings** → **Webhooks** → Click on a webhook → **Deliveries**

---

## 7. Managing Invoices

Invoices are for when you need to bill a specific customer (like a freelancer sending an invoice).

### Create an Invoice

**Via Dashboard:**
1. Go to **Invoices** → **Create Invoice**
2. Fill in:
   - **Customer Name:** "Acme Corp"
   - **Customer Email:** "billing@acme.com"
   - **Amount:** 500.00 USD
   - **Due Date:** Select a date
   - **Items:** Add line items (description + amount)
3. Click **Create**
4. Click **Send** to email it to the customer

**Via API:**
```bash
curl -X POST https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/invoices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Acme Corp",
    "customer_email": "billing@acme.com",
    "amount": "500.00",
    "currency": "USD",
    "due_date": "2026-03-15",
    "items": [
      {"description": "Web Development - February", "amount": "500.00"}
    ]
  }'
```

### Invoice Lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Created but not sent |
| `sent` | Emailed to customer |
| `viewed` | Customer opened the invoice |
| `paid` | Customer paid ✅ |
| `overdue` | Past due date, unpaid |
| `cancelled` | You cancelled it |

---

## 8. Wallet Management

Your wallets hold the crypto you receive from payments.

### Types of Wallets

| Type | Description | Use For |
|------|------------|---------|
| **Hot Wallet** | Online, automated. Keys encrypted on server. | Automated payment processing |
| **Cold Wallet** | Offline, hardware-signed. Watch-only on server. | Large balance storage |
| **WalletConnect** | Connect MetaMask, Trust Wallet, etc. | Non-custodial control |

### Generate a New Wallet

**Via Dashboard:**
1. Go to **Wallets** → Click **Generate Wallet**
2. Select a **Chain** (e.g., Bitcoin, Ethereum, Solana)
3. Enter a **Label** (e.g., "BTC Payments")
4. Click **Generate**
5. **⚠️ CRITICAL:** You'll see your **Private Key** and **Recovery Phrase**
6. **Write them down on paper and store safely** — they are shown ONLY ONCE
7. Check the confirmation box → Click **Done**

**Supported Chains:**
- Bitcoin (BTC) — Native SegWit address (bc1...)
- Ethereum (ETH) — ERC-20 compatible
- Polygon (MATIC) — Low-fee EVM chain
- Arbitrum — L2 scaling for ETH
- Optimism — L2 scaling for ETH
- Avalanche (AVAX) — Fast finality
- BSC (BNB) — Binance Smart Chain
- Fantom (FTM) — High-speed DeFi
- Base — Coinbase L2
- Solana (SOL) — High-throughput
- Tron (TRX) — USDT popular chain
- Litecoin (LTC) — BTC fork
- Dogecoin (DOGE) — Community chain

### Send Crypto From Your Wallet

1. Go to **Wallets** → Select a wallet
2. Click **Send**
3. Enter:
   - **To Address:** The recipient's crypto address
   - **Amount:** How much to send
   - **Memo** (optional): Transaction note
4. Review the **estimated fee**
5. Click **Confirm Send**

### View Transaction History

Go to **Wallets** → **Transaction History**

Filter by:
- Direction: Send / Receive
- Status: Pending / Confirmed / Failed
- Date range

---

## 9. Settlement & Withdrawals

Settlement determines where your received crypto goes.

### Configure Settlement

1. Go to **Settings** → **Settlement**
2. Set your **settlement address** (where you want crypto sent)
3. Choose **sweep mode:**
   - **Immediate:** Sweep after each confirmed payment
   - **Threshold:** Sweep when balance exceeds a minimum
   - **Manual:** You trigger sweeps manually
4. Click **Save**

### Example Settlement Config

```bash
curl -X PUT https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/settlement \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "eth",
    "asset": "USDC",
    "address": "0xYourPersonalWalletAddress",
    "sweep_mode": "threshold",
    "min_sweep_threshold": "100.00"
  }'
```

---

## 10. Security Settings

### Enable Two-Factor Authentication (2FA)

1. **Settings** → **Security**
2. Click **Enable 2FA**
3. Scan QR code with Google Authenticator / Authy
4. Enter the 6-digit code
5. Save your backup codes

### Manage Active Sessions

- **Settings** → **Security** → **Active Sessions**
- See all devices/browsers logged in
- Click **Revoke** on any suspicious session
- Click **Revoke All** to log out everywhere

### Change Password

1. **Settings** → **Security** → **Change Password**
2. Enter current password
3. Enter new password (must meet strength requirements)
4. Click **Update Password**

---

## 11. Exports & Reports

### Quick Export (Dashboard)

1. Go to **Reports** → Select date range
2. Click **Export CSV** or **Export JSON**
3. File downloads to your computer

### Server-Side Export (Large Data)

For large datasets (thousands of records):

1. Go to **Export Center** (`/dashboard/exports`)
2. Click **New Export**
3. Select type: Charges, Invoices, Transactions, Webhook Deliveries
4. Select date range and filters
5. Click **Start Export**
6. Wait for processing (shows progress)
7. Click **Download** when ready

---

## 12. Code Examples (Copy-Paste)

### Node.js / Express — Complete Integration

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const API_KEY = process.env.CRYPTONIUMPAY_API_KEY;
const WEBHOOK_SECRET = process.env.CRYPTONIUMPAY_WEBHOOK_SECRET;
const API_BASE = 'https://cryptoniumpay-api-gateway.mailg.workers.dev/api';

// 1. Create a charge when customer clicks "Pay with Crypto"
app.post('/create-payment', async (req, res) => {
  try {
    const response = await axios.post(`${API_BASE}/v1/charges`, {
      name: `Order #${req.body.orderId}`,
      description: req.body.description,
      pricing_type: 'fixed_price',
      local_price: {
        amount: req.body.amount,
        currency: 'USD'
      },
      expires_in_minutes: 60,
      redirect_url: `https://yoursite.com/order/${req.body.orderId}/success`,
      cancel_url: `https://yoursite.com/order/${req.body.orderId}/cancel`
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `order-${req.body.orderId}`
      }
    });

    // Redirect customer to the hosted checkout page
    res.json({ checkout_url: response.data.hosted_url });
  } catch (error) {
    console.error('Payment creation failed:', error.response?.data);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// 2. Handle webhook when payment is confirmed
app.post('/webhooks/cryptoniumpay', (req, res) => {
  // Verify signature
  const signature = req.headers['x-signature'];
  const expectedSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  switch (event.type) {
    case 'charge:confirmed':
      console.log(`Payment confirmed! Charge: ${event.data.id}`);
      // Mark order as paid in your database
      // fulfillOrder(event.data.metadata.orderId);
      break;

    case 'charge:expired':
      console.log(`Payment expired: ${event.data.id}`);
      // Optionally notify customer
      break;
  }

  res.status(200).send('OK');
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Python / Flask

```python
import hmac
import hashlib
import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

API_KEY = "YOUR_API_KEY"
WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET"
API_BASE = "https://cryptoniumpay-api-gateway.mailg.workers.dev/api"

@app.route('/create-payment', methods=['POST'])
def create_payment():
    data = request.json
    
    response = requests.post(f"{API_BASE}/v1/charges", json={
        "name": f"Order #{data['order_id']}",
        "description": data.get("description", ""),
        "pricing_type": "fixed_price",
        "local_price": {
            "amount": str(data["amount"]),
            "currency": "USD"
        },
        "expires_in_minutes": 60,
        "redirect_url": f"https://yoursite.com/order/{data['order_id']}/success",
        "cancel_url": f"https://yoursite.com/cart"
    }, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": f"order-{data['order_id']}"
    })
    
    charge = response.json()
    return jsonify({"checkout_url": charge["hosted_url"]})

@app.route('/webhooks/cryptoniumpay', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature', '')
    payload = json.dumps(request.json, separators=(',', ':'))
    
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected):
        return "Invalid signature", 401
    
    event = request.json
    
    if event["type"] == "charge:confirmed":
        print(f"Payment confirmed: {event['data']['id']}")
        # Mark order as paid
    
    return "OK", 200

if __name__ == '__main__':
    app.run(port=3000)
```

### PHP / Laravel

```php
<?php
// routes/web.php

Route::post('/create-payment', function (Request $request) {
    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . env('CRYPTONIUMPAY_API_KEY'),
        'Content-Type' => 'application/json',
        'Idempotency-Key' => 'order-' . $request->order_id,
    ])->post('https://cryptoniumpay-api-gateway.mailg.workers.dev/api/v1/charges', [
        'name' => 'Order #' . $request->order_id,
        'description' => $request->description,
        'pricing_type' => 'fixed_price',
        'local_price' => [
            'amount' => (string) $request->amount,
            'currency' => 'USD',
        ],
        'expires_in_minutes' => 60,
        'redirect_url' => url("/order/{$request->order_id}/success"),
        'cancel_url' => url('/cart'),
    ]);

    return response()->json([
        'checkout_url' => $response->json('hosted_url')
    ]);
});

Route::post('/webhooks/cryptoniumpay', function (Request $request) {
    $signature = $request->header('X-Signature');
    $payload = json_encode($request->all());
    $expected = hash_hmac('sha256', $payload, env('CRYPTONIUMPAY_WEBHOOK_SECRET'));

    if (!hash_equals($expected, $signature)) {
        return response('Invalid signature', 401);
    }

    $event = $request->all();

    if ($event['type'] === 'charge:confirmed') {
        Log::info("Payment confirmed: " . $event['data']['id']);
        // Mark order as paid
    }

    return response('OK', 200);
});
```

### Simple HTML Button (No Backend)

If you just want a "Pay with Crypto" button on a static page, you can link directly to a pre-created charge:

```html
<a href="https://cryptoniumpay.pages.dev/pay/YOUR_CHARGE_ID" 
   target="_blank"
   style="display:inline-block; padding:12px 24px; background:#6366f1; color:white; 
          text-decoration:none; border-radius:8px; font-weight:bold;">
  💰 Pay with Crypto
</a>
```

---

## 13. FAQ

### How much does Cryptoniumpay charge?

**0.5% flat fee** per transaction. No monthly fees, no setup fees, no hidden costs.

### Which cryptocurrencies are supported?

BTC, ETH, MATIC, ARB, OP, AVAX, BNB, FTM, BASE, SOL, TRX, LTC, DOGE — and all ERC-20/BEP-20 tokens on those chains.

### How fast do payments confirm?

| Chain | Typical Time | Confirmations Required |
|-------|-------------|----------------------|
| Bitcoin | 10-60 minutes | 3 confirmations |
| Ethereum | 2-5 minutes | 12 confirmations |
| Polygon | 30-60 seconds | 30 confirmations |
| Solana | 5-15 seconds | 1 confirmation |
| Tron | 20-60 seconds | 19 confirmations |

### What happens if the customer underpays?

The charge status will show the partial payment. You can decide to:
1. Accept the partial payment
2. Request the remaining amount
3. Refund the partial payment

### Can I issue refunds?

Yes. Go to **Charges** → Select the charge → **Refund**. The refund will be sent back to the customer's wallet on the same chain.

### What if my webhook endpoint is down?

Cryptoniumpay retries webhook deliveries with exponential backoff:
- 1st retry: 1 minute
- 2nd retry: 5 minutes
- 3rd retry: 30 minutes
- 4th retry: 2 hours
- 5th retry: 24 hours

All delivery attempts are logged in **Settings** → **Webhooks** → **Deliveries**.

### How do I test without real crypto?

Use testnet chains during development. You can also use the **Test Webhook** feature to simulate webhook events without actual payments.

### Where are my private keys stored?

For **hot wallets**: Private keys are encrypted with AES-256-GCM on the server. They never leave the server in plaintext.

For **cold wallets** and **WalletConnect**: Private keys are NEVER stored on the server. Only watch-only addresses are registered.

### Can I use Cryptoniumpay with Shopify / WooCommerce / WordPress?

Yes! Use the API integration described above. Create a plugin or use the webhook + charge API to integrate with any platform.

---

## Quick Reference Card

| Action | Dashboard | API Endpoint |
|--------|----------|-------------|
| Create charge | Charges → Create | `POST /v1/charges` |
| Check charge status | Charges → Click charge | `GET /v1/charges/:id` |
| Create API key | Settings → API Keys | `POST /v1/api-keys` |
| Create webhook | Settings → Webhooks | `POST /v1/webhooks` |
| Generate wallet | Wallets → Generate | `POST /v1/wallets/generate` |
| Send crypto | Wallets → Send | `POST /v1/wallets/:id/send` |
| Create invoice | Invoices → Create | `POST /v1/invoices` |
| View reports | Reports | `GET /v1/dashboard/stats` |
| Settlement config | Settings → Settlement | `PUT /v1/settlement` |

**API Base URL:** `https://cryptoniumpay-api-gateway.mailg.workers.dev/api`

**Need help?** Contact us at the Contact page or email support.

---

*Cryptoniumpay — Accept crypto. Pay less.*
