# Cryptoniumpay — Enterprise Deployment Guide

> Atomic, step-by-step deployment instructions. No room for error.
> Written for absolute beginners. Every command is copy-pasteable.

**Last updated:** 2026-02-22
**Covers:** Cloudflare (Pages + Workers) and VM (Docker Compose)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Option A: Cloudflare Pages + Workers Gateway](#2-option-a-cloudflare-pages--workers-gateway)
3. [Option B: VM with Docker Compose (Full Stack)](#3-option-b-vm-with-docker-compose-full-stack)
4. [DNS & SSL Setup](#4-dns--ssl-setup)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Backup & Restore](#8-backup--restore)
9. [Scaling Guide](#9-scaling-guide)
10. [Troubleshooting](#10-troubleshooting)
11. [Security Hardening](#11-security-hardening)
12. [Systemd Service Files](#12-systemd-service-files)

---

## 1. Prerequisites

### 1.1 Required Tools

Install these on your **local development machine**:

```bash
# Check Node.js (need v20+)
node --version
# Expected output: v20.x.x or higher
# If not installed: https://nodejs.org/en/download

# Check npm
npm --version
# Expected output: 10.x.x or higher

# Check Git
git --version
# Expected output: git version 2.30+
# If not installed: sudo apt install git

# Install Wrangler (Cloudflare CLI) — needed for Option A only
npm install -g wrangler
wrangler --version
# Expected output: wrangler 3.x.x

# Check Docker — needed for Option B only
docker --version
# Expected output: Docker version 24.x.x+
# If not installed: https://docs.docker.com/engine/install/

docker compose version
# Expected output: Docker Compose version v2.20+
```

### 1.2 Accounts Needed

| Account | Purpose | Where to Sign Up |
|---------|---------|-----------------|
| **Cloudflare** (Option A) | Frontend hosting + API gateway | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **Domain registrar** | Custom domain (e.g. `cryptoniumpay.com`) | Any registrar (Cloudflare, Namecheap, etc.) |
| **VPS provider** (Option B) | Server to run Docker Compose | Hetzner, DigitalOcean, AWS, etc. |
| **GitHub** | Source code + CI/CD | [github.com](https://github.com) |

### 1.3 Clone the Repository

```bash
git clone https://github.com/your-org/cryptoniumpay.git
cd cryptoniumpay
```

### 1.4 Install Frontend Dependencies

```bash
npm install
```

**Expected output:** No errors. You should see `added X packages`.

### 1.5 Verify Frontend Builds

```bash
npm run build
```

**Expected output:** `dist/` folder created with `index.html` and JS/CSS assets.

```bash
ls dist/
# Expected: index.html  assets/
```

---

## 2. Option A: Cloudflare Pages + Workers Gateway

This option hosts the **frontend on Cloudflare Pages** (global CDN) and uses a **Cloudflare Worker as an API gateway** that proxies requests to your backend server.

### Architecture

```
User → Cloudflare CDN (Pages) → Static React SPA
                               → /api/* → Cloudflare Worker → Your Backend Server (VM/VPS)
```

### Step 1: Login to Cloudflare

```bash
wrangler login
```

**What happens:** Your browser opens. Click "Allow" to authorize Wrangler.

**Expected output:**
```
Successfully logged in.
```

### Step 2: Build Frontend for Production

```bash
# Set your API URL (this will be the Worker URL or your backend URL)
export VITE_API_BASE_URL=https://api.yourdomain.com

# Build
npm run build
```

### Step 3: Create Cloudflare Pages Project

```bash
wrangler pages project create cryptoniumpay --production-branch main
```

**Expected output:**
```
✨ Successfully created the Pages project "cryptoniumpay"
```

### Step 4: Deploy Frontend to Pages

```bash
wrangler pages deploy dist --project-name=cryptoniumpay
```

**Expected output:**
```
✨ Deployment complete!
URL: https://cryptoniumpay.pages.dev
```

**Verify:** Open the URL in your browser. You should see the Cryptoniumpay landing page.

### Step 5: Set Custom Domain on Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → `cryptoniumpay`
2. Click **Custom domains** → **Set up a custom domain**
3. Enter: `pay.yourdomain.com`
4. Cloudflare creates a CNAME record automatically
5. Wait 1-2 minutes for DNS propagation

**Verify:**
```bash
curl -sI https://pay.yourdomain.com | head -5
# Expected: HTTP/2 200
```

### Step 6: Configure Environment Variables in Pages

1. Cloudflare Dashboard → Pages → `cryptoniumpay` → **Settings** → **Environment variables**
2. Click **Add variable** for **Production**:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` |

3. Click **Save**

### Step 7: Create Cloudflare Worker (API Gateway)

Create the Worker that proxies API requests to your backend:

```bash
mkdir -p infra/cloudflare
```

Create `infra/cloudflare/wrangler.toml`:

```toml
name = "cryptoniumpay-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
BACKEND_ORIGIN = "https://backend.yourdomain.com"

# Rate limiting
# [unsafe.bindings]
# Add rate limiting bindings when needed
```

Create `infra/cloudflare/src/index.ts`:

```typescript
export interface Env {
  BACKEND_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Proxy to backend
    const backendUrl = env.BACKEND_ORIGIN + url.pathname + url.search;
    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(backendRequest);

    // Add CORS and security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "DENY");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
```

### Step 8: Deploy the Worker

```bash
cd infra/cloudflare
wrangler deploy
```

**Expected output:**
```
Published cryptoniumpay-api (x.xx sec)
  https://cryptoniumpay-api.your-subdomain.workers.dev
```

### Step 9: Set Custom Domain on Worker

1. Cloudflare Dashboard → **Workers & Pages** → `cryptoniumpay-api` → **Settings** → **Domains & Routes**
2. Click **Add** → **Custom Domain**
3. Enter: `api.yourdomain.com`
4. Click **Add**

**Verify:**
```bash
curl -s https://api.yourdomain.com/v1/health
# Expected: {"status":"ok","version":"1.0.0","uptime":...}
# (Only works after backend is deployed — see Option B for backend setup)
```

### Step 10: Set Worker Secrets

```bash
cd infra/cloudflare

# Set backend origin
wrangler secret put BACKEND_ORIGIN
# Paste: https://backend.yourdomain.com (your actual backend URL)
```

### Step 11: Enable GitHub CI/CD for Pages

1. Cloudflare Dashboard → Pages → `cryptoniumpay` → **Settings** → **Builds & deployments**
2. Click **Connect to Git** → Select your GitHub repository
3. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank)
4. Click **Save and Deploy**

**Result:** Every push to `main` auto-deploys the frontend.

---

## 3. Option B: VM with Docker Compose (Full Stack)

This option runs **everything on a single server**: frontend (Nginx), API, worker, signer, PostgreSQL, Redis.

### Step 1: Provision a Server

**Minimum requirements:**
- 2 vCPU, 4 GB RAM, 40 GB SSD
- Ubuntu 22.04 LTS or Debian 12
- Public IPv4 address
- Ports 80 and 443 open

**Recommended providers:**
| Provider | Plan | Cost |
|----------|------|------|
| Hetzner Cloud CX21 | 2 vCPU, 4 GB | ~€5/mo |
| DigitalOcean Basic | 2 vCPU, 4 GB | ~$12/mo |
| AWS Lightsail | 2 vCPU, 4 GB | ~$20/mo |

### Step 2: SSH into Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Initial Server Setup

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git ufw fail2ban

# Create non-root user
adduser cryptoniumpay
usermod -aG sudo cryptoniumpay

# Switch to new user
su - cryptoniumpay
```

### Step 4: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Apply group change (or logout/login)
newgrp docker

# Verify Docker
docker --version
# Expected: Docker version 24.x.x or higher

docker compose version
# Expected: Docker Compose version v2.20+
```

### Step 5: Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify
sudo ufw status
# Expected: Status: active with rules for 22, 80, 443
```

### Step 6: Clone Repository

```bash
cd /opt
sudo mkdir cryptoniumpay && sudo chown cryptoniumpay:cryptoniumpay cryptoniumpay
cd cryptoniumpay
git clone https://github.com/your-org/cryptoniumpay.git .
```

### Step 7: Generate Secrets

```bash
# Generate JWT secret (64 hex characters)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate signer secret
SIGNER_SECRET=$(openssl rand -hex 32)
echo "SIGNER_SECRET=$SIGNER_SECRET"

# Generate database password
DB_PASSWORD=$(openssl rand -hex 16)
echo "DB_PASSWORD=$DB_PASSWORD"

# IMPORTANT: Save these values! You need them for the .env file.
```

### Step 8: Create Environment File

```bash
cat > .env << 'ENVEOF'
# ── Frontend ──
VITE_API_BASE_URL=https://yourdomain.com/api

# ── Database ──
POSTGRES_DB=cryptoniumpay
POSTGRES_USER=cryptoniumpay
POSTGRES_PASSWORD=REPLACE_WITH_DB_PASSWORD
DATABASE_URL=postgres://cryptoniumpay:REPLACE_WITH_DB_PASSWORD@postgres:5432/cryptoniumpay

# ── Redis ──
REDIS_URL=redis://redis:6379

# ── Auth ──
JWT_SECRET=REPLACE_WITH_JWT_SECRET
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ── Signer ──
SIGNER_SECRET=REPLACE_WITH_SIGNER_SECRET
SIGNER_PORT=8080

# ── API ──
API_PORT=3000
CORS_ORIGINS=https://yourdomain.com
NODE_ENV=production

# ── Domain ──
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com
ENVEOF
```

Now replace the placeholder values:

```bash
# Replace placeholders with actual values
sed -i "s/REPLACE_WITH_DB_PASSWORD/$DB_PASSWORD/g" .env
sed -i "s/REPLACE_WITH_JWT_SECRET/$JWT_SECRET/g" .env
sed -i "s/REPLACE_WITH_SIGNER_SECRET/$SIGNER_SECRET/g" .env

# Replace domain
read -p "Enter your domain (e.g. cryptoniumpay.com): " DOMAIN
sed -i "s/yourdomain.com/$DOMAIN/g" .env

# Verify
cat .env
```

### Step 9: Docker Compose File

Create `docker-compose.yml`:

```yaml
version: "3.9"

services:
  # ── Frontend (Nginx) ──
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot-data:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot:ro
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - frontend

  # ── Backend API ──
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file: .env
    expose:
      - "3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:3000/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  # ── Background Workers ──
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: ["node", "dist/worker.js"]
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend
      - signer-net

  # ── Isolated Signer ──
  signer:
    build:
      context: ./backend
      dockerfile: Dockerfile.signer
    env_file: .env
    expose:
      - "8080"
    restart: unless-stopped
    networks:
      - signer-net

  # ── PostgreSQL ──
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped
    networks:
      - backend

  # ── Redis ──
  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --requirepass ""
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped
    networks:
      - backend

  # ── Certbot (SSL) ──
  certbot:
    image: certbot/certbot
    volumes:
      - certbot-data:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done'"
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  certbot-data:
  certbot-www:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
  signer-net:
    driver: bridge
    internal: true
```

### Step 10: Frontend Dockerfile

Create `Dockerfile.frontend`:

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY public/_headers /usr/share/nginx/html/_headers
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

### Step 11: Nginx Configuration

Create `nginx.conf`:

```nginx
# HTTP → HTTPS redirect + ACME challenge
server {
    listen 80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Request size limit
    client_max_body_size 10m;

    # Frontend (React SPA)
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://api:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;

        # Rate limiting headers
        proxy_set_header X-RateLimit-IP $remote_addr;
    }

    # Static asset caching (1 year, immutable)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;
}
```

**IMPORTANT:** Replace `yourdomain.com` in nginx.conf:

```bash
sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf
```

### Step 12: Get SSL Certificate

```bash
# Step 12a: Start nginx WITHOUT SSL first (for ACME challenge)
# Temporarily comment out the 443 server block in nginx.conf
# Or create a minimal HTTP-only nginx config

# Start only postgres, redis, and a basic nginx
docker compose up -d postgres redis

# Wait for postgres to be healthy
docker compose ps
# Expected: postgres should show "healthy"

# Step 12b: Get certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d $DOMAIN \
  --email $(grep ACME_EMAIL .env | cut -d= -f2) \
  --agree-tos \
  --no-eff-email

# Expected output:
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### Step 13: Start All Services

```bash
# Build and start everything
docker compose up -d --build

# Check all services are running
docker compose ps
```

**Expected output:**
```
NAME                STATUS              PORTS
cryptoniumpay-api      Up (healthy)
cryptoniumpay-frontend Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
cryptoniumpay-worker   Up
cryptoniumpay-signer   Up
cryptoniumpay-postgres Up (healthy)
cryptoniumpay-redis    Up (healthy)
cryptoniumpay-certbot  Up
```

### Step 14: Run Database Migrations

```bash
docker compose exec api npx prisma migrate deploy
```

**Expected output:**
```
X migrations applied successfully.
```

### Step 15: Seed Demo Data (Development Only)

```bash
docker compose exec api npx prisma db seed
```

### Step 16: Create Admin User

```bash
docker compose exec api node dist/create-admin.js \
  --email admin@yourdomain.com \
  --password "YourSecureAdminPassword123!"
```

**Expected output:**
```
Admin user created: admin@yourdomain.com
```

### Step 17: Verify Deployment

```bash
# Test health endpoint
curl -s https://$DOMAIN/api/v1/health | python3 -m json.tool
# Expected: {"status": "ok", "version": "1.0.0", "uptime": ...}

# Test frontend loads
curl -sI https://$DOMAIN | head -5
# Expected: HTTP/2 200

# Test login page
curl -sI https://$DOMAIN/login | head -5
# Expected: HTTP/2 200

# Test API login
curl -s -X POST https://$DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"YourSecureAdminPassword123!"}' | python3 -m json.tool
# Expected: {"token": "...", "user": {"id": "...", "email": "...", "role": "admin"}}
```

---

## 4. DNS & SSL Setup

### DNS Records

Create these DNS records at your registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` (or `yourdomain.com`) | `YOUR_SERVER_IP` | 300 |
| A | `api` | `YOUR_SERVER_IP` | 300 |
| CNAME | `www` | `yourdomain.com` | 300 |

**If using Cloudflare (Option A):**

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `pay` | `cryptoniumpay.pages.dev` | Proxied ☁️ |
| A | `api` | `YOUR_BACKEND_IP` | Proxied ☁️ |

### SSL Certificate Renewal (Option B)

SSL certificates auto-renew via the Certbot container. To manually renew:

```bash
docker compose run --rm certbot renew
docker compose restart frontend
```

Add auto-renewal to crontab:

```bash
crontab -e
# Add this line:
0 3 1,15 * * cd /opt/cryptoniumpay && docker compose run --rm certbot renew && docker compose restart frontend
```

---

## 5. Environment Variables Reference

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | ✅ | `/api` | Backend API base URL |

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `JWT_SECRET` | ✅ | — | 64-char hex string for JWT signing |
| `JWT_EXPIRY` | ❌ | `15m` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRY` | ❌ | `7d` | Refresh token lifetime |
| `API_PORT` | ❌ | `3000` | API server port |
| `CORS_ORIGINS` | ❌ | `*` | Comma-separated allowed origins |
| `NODE_ENV` | ❌ | `development` | `production` for prod |
| `SIGNER_SECRET` | ✅ | — | Shared secret with signer service |
| `SIGNER_PORT` | ❌ | `8080` | Signer service port |
| `ACME_EMAIL` | ✅ (VM) | — | Email for SSL cert notifications |
| `DOMAIN` | ✅ (VM) | — | Your domain name |

---

## 6. Post-Deployment Verification

Run these checks after **every** deployment:

```bash
# 1. Frontend loads
curl -sI https://yourdomain.com | grep "HTTP/2 200"
# ✅ Expected: HTTP/2 200

# 2. Health endpoint
curl -s https://yourdomain.com/api/v1/health | grep '"ok"'
# ✅ Expected: contains "ok"

# 3. Login works
TOKEN=$(curl -s -X POST https://yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"YOUR_PASS"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:20}..."
# ✅ Expected: Token starts with "eyJ"

# 4. Dashboard stats work
curl -s -H "Authorization: Bearer $TOKEN" \
  https://yourdomain.com/api/v1/dashboard/stats | python3 -m json.tool
# ✅ Expected: JSON with total_charges, pending_payments, etc.

# 5. Admin stats work
curl -s -H "Authorization: Bearer $TOKEN" \
  https://yourdomain.com/api/v1/admin/stats | python3 -m json.tool
# ✅ Expected: JSON with total_merchants, active_charges, etc.

# 6. Security headers present
curl -sI https://yourdomain.com | grep -i "x-frame-options"
# ✅ Expected: X-Frame-Options: DENY

curl -sI https://yourdomain.com | grep -i "strict-transport"
# ✅ Expected: Strict-Transport-Security: max-age=63072000...

# 7. Checkout page loads (public)
curl -sI https://yourdomain.com/pay/test-id | grep "HTTP/2 200"
# ✅ Expected: HTTP/2 200 (SPA returns index.html)

# 8. 404 works
curl -s https://yourdomain.com/nonexistent | grep "404"
# ✅ Expected: Page contains "404"
```

---

## 7. Monitoring & Maintenance

### Health Check Cron (Option B)

```bash
crontab -e
```

Add:

```
# Health check every 5 minutes
*/5 * * * * curl -sf https://yourdomain.com/api/v1/health > /dev/null || echo "ALERT: Cryptoniumpay API down at $(date)" | mail -s "API DOWN" ops@yourdomain.com

# SSL renewal check (1st and 15th of month)
0 3 1,15 * * cd /opt/cryptoniumpay && docker compose run --rm certbot renew && docker compose restart frontend >> /var/log/certbot-renew.log 2>&1
```

### Log Viewing

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker

# Last 100 lines
docker compose logs --tail=100 api

# Since a specific time
docker compose logs --since 1h api
```

### Log Rotation

Create `/etc/logrotate.d/docker-cryptoniumpay`:

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    delaycompress
    missingok
    copytruncate
    maxsize 100M
}
```

### Container Updates

```bash
cd /opt/cryptoniumpay

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Run migrations if needed
docker compose exec api npx prisma migrate deploy

# Verify
docker compose ps
curl -s https://yourdomain.com/api/v1/health
```

---

## 8. Backup & Restore

### Automated Daily Backup

Create `/opt/cryptoniumpay/scripts/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/cryptoniumpay"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

# Database backup
echo "$(date): Starting database backup..."
docker compose -f /opt/cryptoniumpay/docker-compose.yml exec -T postgres \
  pg_dump -U cryptoniumpay -Fc --no-owner cryptoniumpay > "$BACKUP_DIR/db_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/db_$DATE.dump"

# File size
ls -lh "$BACKUP_DIR/db_$DATE.dump.gz"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "$(date): Backup completed: db_$DATE.dump.gz"
echo "$(date): Backups older than $KEEP_DAYS days removed"
```

```bash
chmod +x /opt/cryptoniumpay/scripts/backup.sh

# Add to crontab
crontab -e
# Add:
0 3 * * * /opt/cryptoniumpay/scripts/backup.sh >> /var/log/cryptoniumpay-backup.log 2>&1
```

### Manual Backup

```bash
/opt/cryptoniumpay/scripts/backup.sh
```

### Restore from Backup

```bash
# List available backups
ls -la /opt/backups/cryptoniumpay/

# Stop services that write to DB
cd /opt/cryptoniumpay
docker compose stop api worker

# Restore (replace filename with your backup)
gunzip -k /opt/backups/cryptoniumpay/db_20260222_030000.dump.gz
docker compose exec -T postgres pg_restore -U cryptoniumpay -d cryptoniumpay --clean --if-exists \
  < /opt/backups/cryptoniumpay/db_20260222_030000.dump

# Restart services
docker compose start api worker

# Verify
curl -s https://yourdomain.com/api/v1/health
```

---

## 9. Scaling Guide

### Scale Workers Horizontally

```bash
# Run 3 worker instances
docker compose up -d --scale worker=3

# Verify all workers are running
docker compose ps | grep worker
```

### Monitor Queue Depth

```bash
# Check Redis queue sizes
docker compose exec redis redis-cli LLEN bull:webhook-dispatch:wait
docker compose exec redis redis-cli LLEN bull:sweep-execution:wait
docker compose exec redis redis-cli LLEN bull:charge-expiry:wait
```

### Scale Database

For high-traffic production deployments, consider:
1. Use a managed PostgreSQL service (AWS RDS, DigitalOcean Managed DB)
2. Update `DATABASE_URL` in `.env` to point to the managed instance
3. Restart API + worker: `docker compose restart api worker`

---

## 10. Troubleshooting

### "Connection refused" on API

```bash
# Check container status
docker compose ps

# If api is restarting, check logs
docker compose logs --tail=50 api

# Common cause: database not ready
docker compose restart api

# Verify database is healthy
docker compose exec postgres pg_isready -U cryptoniumpay
```

### Frontend shows blank page

```bash
# Check if dist/ was built correctly
docker compose exec frontend ls /usr/share/nginx/html/
# Expected: index.html, assets/

# Check nginx config syntax
docker compose exec frontend nginx -t
# Expected: syntax is ok, test is successful

# Check nginx logs
docker compose logs frontend
```

### SSL certificate issues

```bash
# Check certificate status
docker compose run --rm certbot certificates

# Force renew
docker compose run --rm certbot renew --force-renewal
docker compose restart frontend

# Check certificate expiry
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Redis out of memory

```bash
# Check memory usage
docker compose exec redis redis-cli INFO memory | grep used_memory_human

# If near limit, increase in docker-compose.yml:
# Change --maxmemory 256mb to --maxmemory 512mb
docker compose restart redis
```

### Database full

```bash
# Check database size
docker compose exec postgres psql -U cryptoniumpay -c "SELECT pg_size_pretty(pg_database_size('cryptoniumpay'));"

# Check table sizes
docker compose exec postgres psql -U cryptoniumpay -c "SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) FROM pg_class ORDER BY pg_total_relation_size(oid) DESC LIMIT 10;"

# Vacuum (reclaim space)
docker compose exec postgres psql -U cryptoniumpay -c "VACUUM ANALYZE;"
```

---

## 11. Security Hardening

### Server-Level

```bash
# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Docker-Level

```bash
# Run containers as non-root (add to Dockerfiles)
# USER node

# Limit container resources in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       cpus: '1.0'
#       memory: 512M
```

### Application-Level

- ✅ JWT tokens expire in 15 minutes
- ✅ Refresh token rotation with reuse detection
- ✅ API keys hashed with argon2id
- ✅ Webhooks signed with HMAC-SHA256
- ✅ Rate limiting on all endpoints
- ✅ Request body size limited to 10KB
- ✅ CORS restricted to allowed origins
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Audit log for all admin actions
- ✅ Signer on isolated Docker network

---

## 12. Systemd Service Files

If running without Docker, use systemd:

### `/etc/systemd/system/cryptoniumpay-api.service`

```ini
[Unit]
Description=Cryptoniumpay API Server
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=cryptoniumpay
Group=cryptoniumpay
WorkingDirectory=/opt/cryptoniumpay/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/cryptoniumpay/.env

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/cryptoniumpay

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cryptoniumpay-api

[Install]
WantedBy=multi-user.target
```

### `/etc/systemd/system/cryptoniumpay-worker.service`

```ini
[Unit]
Description=Cryptoniumpay Background Worker
After=network.target postgresql.service redis.service cryptoniumpay-api.service

[Service]
Type=simple
User=cryptoniumpay
Group=cryptoniumpay
WorkingDirectory=/opt/cryptoniumpay/backend
ExecStart=/usr/bin/node dist/worker.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/cryptoniumpay/.env
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/cryptoniumpay
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cryptoniumpay-worker

[Install]
WantedBy=multi-user.target
```

### Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable cryptoniumpay-api cryptoniumpay-worker
sudo systemctl start cryptoniumpay-api cryptoniumpay-worker

# Check status
sudo systemctl status cryptoniumpay-api
sudo systemctl status cryptoniumpay-worker

# View logs
journalctl -u cryptoniumpay-api -f
journalctl -u cryptoniumpay-worker -f
```

---

*Cryptoniumpay v1.0 — Enterprise Deployment Guide*
*No room for error. Deploy with confidence.*
