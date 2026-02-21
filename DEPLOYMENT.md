# Cryptonpay — Deployment Guide

> Complete step-by-step deployment instructions for **Cloudflare Pages + Workers** and **VM (Docker Compose)**.
> Written for absolute beginners. No prior DevOps experience required.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Option A: Cloudflare Pages (Frontend) + Workers (API)](#2-option-a-cloudflare-pages--workers)
3. [Option B: VM with Docker Compose (Full Stack)](#3-option-b-vm-with-docker-compose)
4. [DNS & SSL Setup](#4-dns--ssl-setup)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Post-Deployment Checklist](#6-post-deployment-checklist)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### Tools You Need Installed

| Tool | Version | Why | Install |
|------|---------|-----|---------|
| **Node.js** | ≥ 18.x | Build frontend | [nodejs.org](https://nodejs.org) |
| **npm** or **bun** | Latest | Package manager | Comes with Node.js / [bun.sh](https://bun.sh) |
| **Git** | ≥ 2.30 | Version control | `sudo apt install git` |
| **Docker** | ≥ 24.x | Container runtime (VM option) | [docs.docker.com](https://docs.docker.com/engine/install/) |
| **Docker Compose** | ≥ 2.20 | Multi-container orchestration | Included with Docker Desktop |
| **Wrangler** | ≥ 3.x | Cloudflare CLI (CF option) | `npm install -g wrangler` |

### Accounts You Need

| Account | Purpose | Link |
|---------|---------|------|
| **Cloudflare** | CDN, Pages, Workers, DNS | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **Domain Registrar** | Custom domain | Any registrar |
| **GitHub** | Source code hosting | [github.com](https://github.com) |
| **VPS Provider** (VM option) | Hetzner / DigitalOcean / AWS | Any provider |

---

## 2. Option A: Cloudflare Pages + Workers

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/cryptonpay.git
cd cryptonpay
```

### Step 2: Install Dependencies

```bash
npm install
# or
bun install
```

### Step 3: Build the Frontend

```bash
# Set your API base URL
export VITE_API_BASE_URL=https://api.yourdomain.com

# Build for production
npm run build
# or
bun run build
```

This creates a `dist/` folder with the optimized static files.

### Step 4: Login to Cloudflare

```bash
wrangler login
```

This opens your browser. Authorize wrangler with your Cloudflare account.

### Step 5: Create a Cloudflare Pages Project

```bash
# First time only — create the project
wrangler pages project create cryptonpay
```

### Step 6: Deploy to Cloudflare Pages

```bash
wrangler pages deploy dist --project-name=cryptonpay
```

**Output:**
```
✨ Deployment complete!
URL: https://cryptonpay.pages.dev
```

### Step 7: Configure Custom Domain

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → `cryptonpay`
2. Click **Custom domains** → **Set up a custom domain**
3. Enter: `pay.yourdomain.com` (or your preferred subdomain)
4. Cloudflare automatically creates a CNAME record

### Step 8: Set Environment Variables in Cloudflare Pages

1. Cloudflare Dashboard → Pages → `cryptonpay` → **Settings** → **Environment variables**
2. Add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | Production |

3. Click **Save**

### Step 9: Enable CI/CD with GitHub

1. Cloudflare Dashboard → Pages → `cryptonpay` → **Settings** → **Builds & deployments**
2. Connect your GitHub repository
3. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank)
4. Every push to `main` auto-deploys

### Step 10: Configure SPA Routing

Create `public/_redirects`:
```
/*  /index.html  200
```

Or create `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 3. Option B: VM with Docker Compose

### Step 1: Provision a Server

**Minimum specs:**
- 2 vCPU, 4 GB RAM, 40 GB SSD
- Ubuntu 22.04 LTS or Debian 12
- Public IPv4 address

**Providers (cheapest → most reliable):**
- Hetzner Cloud CX21: ~€5/mo
- DigitalOcean Basic: ~$12/mo
- AWS Lightsail: ~$10/mo

### Step 2: Initial Server Setup

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Create a non-root user
adduser cryptonpay
usermod -aG sudo cryptonpay
su - cryptonpay

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker
docker --version
docker compose version
```

### Step 3: Clone and Configure

```bash
git clone https://github.com/your-org/cryptonpay.git
cd cryptonpay

# Copy example env file
cp .env.example .env
```

### Step 4: Edit Environment Variables

```bash
nano .env
```

```ini
# ─── Frontend ───
VITE_API_BASE_URL=https://api.yourdomain.com

# ─── Backend API ───
DATABASE_URL=postgres://cryptonpay:CHANGE_THIS_PASSWORD@postgres:5432/cryptonpay
REDIS_URL=redis://redis:6379
JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING
API_PORT=3000

# ─── Signer (isolated) ───
SIGNER_PORT=8080
SIGNER_SECRET=GENERATE_ANOTHER_64_CHAR_STRING

# ─── Domain ───
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com
```

**Generate secure secrets:**
```bash
openssl rand -hex 32  # Run twice, use one for each secret
```

### Step 5: Docker Compose File

Create `docker-compose.yml`:

```yaml
version: "3.9"

services:
  # ─── Frontend (Nginx serving static files) ───
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot-data:/etc/letsencrypt:ro
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - frontend

  # ─── Backend API ───
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

  # ─── Background Workers (Watchers, Webhook Dispatcher) ───
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

  # ─── Isolated Signer ───
  signer:
    build:
      context: ./signer
      dockerfile: Dockerfile
    env_file: .env
    expose:
      - "8080"
    restart: unless-stopped
    networks:
      - signer-net  # ONLY accessible from worker

  # ─── PostgreSQL ───
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cryptonpay
      POSTGRES_USER: cryptonpay
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cryptonpay"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - backend

  # ─── Redis ───
  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - backend

  # ─── Certbot (SSL) ───
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
    internal: true  # No internet access
  signer-net:
    driver: bridge
    internal: true  # Signer isolated from everything except worker
```

### Step 6: Frontend Dockerfile

Create `Dockerfile.frontend`:

```dockerfile
# ─── Stage 1: Build ───
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ─── Stage 2: Serve ───
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

### Step 7: Nginx Configuration

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Frontend
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://api:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;
}
```

### Step 8: Initial SSL Certificate

```bash
# First, start nginx without SSL (comment out the 443 server block)
docker compose up -d frontend

# Get SSL certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email

# Now uncomment the 443 server block and restart
docker compose up -d
```

### Step 9: Start Everything

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f api
docker compose logs -f worker
```

### Step 10: Database Migration

```bash
# Run migrations inside the api container
docker compose exec api node dist/migrate.js
```

### Step 11: Create Admin User

```bash
docker compose exec api node dist/create-admin.js \
  --email admin@yourdomain.com \
  --password "YOUR_SECURE_PASSWORD"
```

---

## 4. DNS & SSL Setup

### For Cloudflare (Pages)

DNS is automatic when you add a custom domain in Cloudflare Pages.

### For VM Deployment

Add these DNS records at your registrar or DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_SERVER_IP` | 300 |
| A | `api` | `YOUR_SERVER_IP` | 300 |
| CNAME | `www` | `yourdomain.com` | 300 |

**Verify DNS propagation:**
```bash
dig yourdomain.com +short
# Should return YOUR_SERVER_IP
```

---

## 5. Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL | `https://api.yourdomain.com` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://redis:6379` |
| `JWT_SECRET` | ✅ | 64-char hex string for JWT signing | `openssl rand -hex 32` |
| `SIGNER_SECRET` | ✅ | Shared secret for signer auth | `openssl rand -hex 32` |
| `SIGNER_URL` | ✅ | Internal signer URL | `http://signer:8080` |
| `WEBHOOK_HMAC_SECRET` | ✅ | Default HMAC secret for webhooks | `openssl rand -hex 32` |
| `API_PORT` | ❌ | API listen port (default: 3000) | `3000` |
| `LOG_LEVEL` | ❌ | Logging level | `info` |
| `CORS_ORIGINS` | ❌ | Allowed CORS origins | `https://yourdomain.com` |
| `RATE_LIMIT_RPM` | ❌ | API rate limit per minute | `100` |

---

## 6. Post-Deployment Checklist

Run through every item after deployment:

- [ ] **Frontend loads** — Visit `https://yourdomain.com`, verify landing page renders
- [ ] **API responds** — `curl https://api.yourdomain.com/v1/health` returns `{"status":"ok"}`
- [ ] **Login works** — Sign in with admin credentials
- [ ] **SSL valid** — Check `https://yourdomain.com` shows padlock, no mixed content
- [ ] **HSTS active** — `curl -I https://yourdomain.com` shows `Strict-Transport-Security`
- [ ] **CSP headers** — `curl -I` shows security headers (X-Frame-Options, etc.)
- [ ] **Database connected** — Dashboard shows stats (even if zeros)
- [ ] **Redis connected** — No "Redis connection failed" in logs
- [ ] **Signer isolated** — `docker exec worker ping signer` works, `docker exec api ping signer` fails
- [ ] **Webhook delivery** — Create test webhook, click "Test", verify delivery log entry
- [ ] **Charge creation** — Create a test charge, verify checkout page loads at `/pay/:id`
- [ ] **QR code renders** — Checkout page shows QR code for deposit address
- [ ] **Auto-renewal** — `docker compose logs certbot` shows "no action taken" (cert not due)
- [ ] **Backups configured** — `pg_dump` cron job running (see Monitoring section)

---

## 7. Monitoring & Maintenance

### Automated Backups (PostgreSQL)

```bash
# Create backup script
cat > /home/cryptonpay/backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/cryptonpay/backups
mkdir -p $BACKUP_DIR
docker compose exec -T postgres pg_dump -U cryptonpay cryptonpay | gzip > $BACKUP_DIR/cryptonpay_$TIMESTAMP.sql.gz
# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo "Backup completed: cryptonpay_$TIMESTAMP.sql.gz"
EOF

chmod +x /home/cryptonpay/backup.sh

# Add to crontab (daily at 3 AM)
echo "0 3 * * * /home/cryptonpay/backup.sh >> /home/cryptonpay/backup.log 2>&1" | crontab -
```

### Health Check Script

```bash
cat > /home/cryptonpay/healthcheck.sh << 'EOF'
#!/bin/bash
API_URL="https://api.yourdomain.com/v1/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$RESPONSE" != "200" ]; then
    echo "$(date) — API DOWN (HTTP $RESPONSE)" >> /home/cryptonpay/healthcheck.log
    docker compose restart api
fi
EOF

chmod +x /home/cryptonpay/healthcheck.sh

# Check every 5 minutes
echo "*/5 * * * * /home/cryptonpay/healthcheck.sh" >> /tmp/cron_tmp && crontab /tmp/cron_tmp
```

### Log Rotation

```bash
sudo cat > /etc/logrotate.d/cryptonpay << 'EOF'
/home/cryptonpay/cryptonpay/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

### Updating the Application

```bash
cd /home/cryptonpay/cryptonpay

# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime)
docker compose up -d --build --force-recreate

# Run any new migrations
docker compose exec api node dist/migrate.js

# Verify
docker compose ps
curl -s https://api.yourdomain.com/v1/health
```

---

## 8. Troubleshooting

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| White page / blank screen | Build failed or wrong `VITE_API_BASE_URL` | Check `dist/index.html` exists, verify env var |
| 502 Bad Gateway | API container not running | `docker compose logs api`, check DATABASE_URL |
| CORS errors in browser | `CORS_ORIGINS` not set | Add your frontend domain to `CORS_ORIGINS` |
| "Connection refused" on API | Port not exposed or firewall | `sudo ufw allow 80,443/tcp` |
| SSL cert errors | Cert not issued yet | Run certbot command again, check DNS |
| Signer unreachable | Wrong network config | Verify `signer-net` in docker-compose |
| Redis connection failed | Redis not started | `docker compose up -d redis`, check logs |
| Slow page loads | No gzip / no caching | Verify nginx gzip and cache headers |
| Login redirect loop | JWT_SECRET changed | Clear browser localStorage, verify secret |

### Debug Commands

```bash
# Check all container status
docker compose ps -a

# View real-time logs
docker compose logs -f --tail=100

# Shell into a container
docker compose exec api sh

# Check database connection
docker compose exec postgres psql -U cryptonpay -c "SELECT 1"

# Check Redis
docker compose exec redis redis-cli ping

# Network inspection
docker network inspect cryptonpay_backend
docker network inspect cryptonpay_signer-net

# Disk usage
docker system df

# Clean up unused images/volumes
docker system prune -af
```

### Getting Help

1. Check logs: `docker compose logs -f`
2. Check the `/v1/health` endpoint
3. Open an issue on GitHub with logs attached
4. Join the community Discord

---

## Security Hardening (Production)

```bash
# ─── Firewall ───
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# ─── Fail2Ban (brute-force protection) ───
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# ─── SSH hardening ───
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# ─── Automatic security updates ───
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 9. Systemd Service (Alternative to Docker)

If you prefer running directly on the VM without Docker:

### Create the systemd unit file

```bash
sudo cat > /etc/systemd/system/cryptonpay-api.service << 'EOF'
[Unit]
Description=Cryptonpay API Server
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=cryptonpay
Group=cryptonpay
WorkingDirectory=/home/cryptonpay/cryptonpay/backend
Environment=NODE_ENV=production
EnvironmentFile=/home/cryptonpay/cryptonpay/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cryptonpay-api

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/cryptonpay/cryptonpay/backend/logs
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

### Create the worker service

```bash
sudo cat > /etc/systemd/system/cryptonpay-worker.service << 'EOF'
[Unit]
Description=Cryptonpay Background Worker
After=network.target postgresql.service redis.service cryptonpay-api.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=cryptonpay
Group=cryptonpay
WorkingDirectory=/home/cryptonpay/cryptonpay/backend
Environment=NODE_ENV=production
EnvironmentFile=/home/cryptonpay/cryptonpay/.env
ExecStart=/usr/bin/node dist/worker.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cryptonpay-worker

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and start

```bash
sudo systemctl daemon-reload
sudo systemctl enable cryptonpay-api cryptonpay-worker
sudo systemctl start cryptonpay-api cryptonpay-worker

# Check status
sudo systemctl status cryptonpay-api
sudo systemctl status cryptonpay-worker

# View logs
journalctl -u cryptonpay-api -f
journalctl -u cryptonpay-worker -f
```

---

*Last updated: 2026-02-21 · Cryptonpay v1.0*
