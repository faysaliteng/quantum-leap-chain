# Cryptoniumpay — Complete Deployment Guide (Noob-Friendly)

> **Last Updated:** February 22, 2026  
> **VPS:** DigitalOcean Droplet (1 vCPU, 2GB RAM, Ubuntu 24.04)  
> **IP:** 139.59.56.210  

---

## Table of Contents

1. [VPS Initial Setup](#1-vps-initial-setup)
2. [Install Docker](#2-install-docker)
3. [Clone the Repository](#3-clone-the-repository)
4. [Generate Secrets](#4-generate-secrets)
5. [Configure Environment](#5-configure-environment)
6. [Build & Start Containers](#6-build--start-containers)
7. [Run Database Migration & Seed](#7-run-database-migration--seed)
8. [Verify Everything Works](#8-verify-everything-works)
9. [Frontend Deployment (Cloudflare Pages)](#9-frontend-deployment-cloudflare-pages)
10. [Connect Frontend to Backend](#10-connect-frontend-to-backend)
11. [Login Credentials](#11-login-credentials)
12. [Useful Commands](#12-useful-commands)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. VPS Initial Setup

SSH into your server:
```bash
ssh root@139.59.56.210
```

Create swap (prevents out-of-memory on small VPS):
```bash
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

✅ **Result:** 1GB swap space active.

---

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Verify:
```bash
docker --version
# Should show: Docker version 29.x.x
```

✅ **Result:** Docker Engine + Docker Compose installed.

---

## 3. Clone the Repository

```bash
cd /opt
git clone https://github.com/faysaliteng/quantum-leap-chain.git cryptoniumpay
cd cryptoniumpay/backend
```

✅ **Result:** Code lives at `/opt/cryptoniumpay/`.

---

## 4. Generate Secrets

Run these commands to generate random secrets:
```bash
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "SIGNER_SECRET=$(openssl rand -hex 32)"
PG_PASS=$(openssl rand -base64 24 | tr -d '=/+')
echo "POSTGRES_PASSWORD=$PG_PASS"
echo "DATABASE_URL=postgresql://cryptoniumpay:${PG_PASS}@db:5432/cryptoniumpay?schema=public"
```

**⚠️ IMPORTANT:** Copy these output values somewhere safe! You need them in the next step.

Example output:
```
JWT_SECRET=e50eb9b946dfe343f6b46c9ec834bca51a39f8828e644304947d34df9df354b9
SIGNER_SECRET=d139a2eb7a9d3ee740043f833262c57fca1492db4a4a29d27fa170473bfb9ba6
POSTGRES_PASSWORD=VpVCMmnGE1ELhmyHKl2jpI56id8gKYmQ
DATABASE_URL=postgresql://cryptoniumpay:VpVCMmnGE1ELhmyHKl2jpI56id8gKYmQ@db:5432/cryptoniumpay?schema=public
```

---

## 5. Configure Environment

### 5a. Backend .env

```bash
cd /opt/cryptoniumpay/backend
cp .env.example .env
nano .env
```

Fill in these values (replace with YOUR generated secrets from Step 4):
```env
PORT=3000
DATABASE_URL=postgresql://cryptoniumpay:YOUR_PG_PASS@db:5432/cryptoniumpay?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=YOUR_JWT_SECRET
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
SIGNER_URL=http://signer:3001
SIGNER_SECRET=YOUR_SIGNER_SECRET
CORS_ORIGINS=https://your-frontend-domain.pages.dev
POSTGRES_PASSWORD=YOUR_PG_PASS
```

Save: `Ctrl+X` → `Y` → `Enter`

### 5b. Docker Compose .env

```bash
echo "POSTGRES_PASSWORD=YOUR_PG_PASS" > /opt/cryptoniumpay/infra/.env
```

Replace `YOUR_PG_PASS` with the actual password from Step 4.

---

## 6. Build & Start Containers

```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml up -d --build
```

This takes ~5-10 minutes the first time. Wait for it to finish.

Check all containers are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

✅ **Expected:** All containers show `Up` or `Healthy` status:
- `infra-db-1` — PostgreSQL (healthy)
- `infra-redis-1` — Redis (healthy)
- `infra-api-1` — Backend API (running)
- `infra-worker-1` — Background worker (running)
- `infra-nginx-1` — Reverse proxy (running)
- `infra-certbot-1` — SSL certificates (running)

---

## 7. Run Database Migration & Seed

### 7a. Run Prisma Migrations (creates all tables)

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

✅ **Result:** All database tables created.

### 7b. Seed the Database (creates admin & merchant users)

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

✅ **Result:** You'll see:
```
✅ Admin user created: primox2014@gmail.com
✅ Merchant user created: user@example.com
✅ Chain configs seeded
✅ Super Admin role assigned
✅ Security policies seeded
✅ CMS pages seeded
🎉 Seed complete!
```

---

## 8. Verify Everything Works

### Test the health endpoint:
```bash
curl http://localhost:3000/api/v1/health
```

✅ **Expected:** `{"status":"ok"}` or similar JSON response.

### Test login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"primox2014@gmail.com","password":"Ff01817018512"}'
```

✅ **Expected:** JSON response with `token` field.

---

## 9. Frontend Deployment (Cloudflare Pages)

### Option A: Via Cloudflare Dashboard (Easiest)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** → **Create** → **Pages**
3. Connect your GitHub repo: `faysaliteng/quantum-leap-chain`
4. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave empty/root)
5. Click **Save and Deploy**

### Option B: Via Wrangler CLI

```bash
# On your LOCAL machine (not the VPS):
npm install -g wrangler
wrangler login
cd /path/to/quantum-leap-chain
npm run build
wrangler pages deploy dist --project-name=cryptoniumpay
```

✅ **Result:** Frontend live at `https://cryptoniumpay.pages.dev`

---

## 10. Connect Frontend to Backend

Update the frontend API base URL to point to your VPS:

In your Cloudflare Pages project, add an environment variable:
- **Variable name:** `VITE_API_BASE_URL`
- **Value:** `http://139.59.56.210:3000/api/v1`

Or if using a domain with SSL: `https://api.yourdomain.com/api/v1`

Then redeploy the frontend.

Also update `CORS_ORIGINS` in `/opt/cryptoniumpay/backend/.env`:
```bash
nano /opt/cryptoniumpay/backend/.env
# Set: CORS_ORIGINS=https://cryptoniumpay.pages.dev
```

Then restart the API:
```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml restart api worker
```

---

## 11. Login Credentials

| Role | Email | Password | Panel |
|------|-------|----------|-------|
| **Super Admin** | primox2014@gmail.com | Ff01817018512 | `/admin` |
| **Merchant** | user@example.com | Ff01817018512 | `/dashboard` |

⚠️ **CHANGE THESE PASSWORDS AFTER FIRST LOGIN!**

---

## 12. Useful Commands

### View logs (all containers):
```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml logs -f
```

### View logs (specific container):
```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f db
```

### Restart everything:
```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop everything:
```bash
docker compose -f docker-compose.prod.yml down
```

### Update code & rebuild:
```bash
cd /opt/cryptoniumpay
git pull
cd infra
docker compose -f docker-compose.prod.yml up -d --build
```

### Open database shell:
```bash
docker compose -f docker-compose.prod.yml exec db psql -U cryptoniumpay -d cryptoniumpay
```

### Open Prisma Studio (GUI for database):
```bash
docker compose -f docker-compose.prod.yml exec api npx prisma studio
```

---

## 13. Troubleshooting

### Container won't start?
```bash
docker compose -f docker-compose.prod.yml logs <container-name>
```

### Database connection error?
- Check `DATABASE_URL` in `backend/.env` uses `db` as hostname (not `localhost`)
- Check `POSTGRES_PASSWORD` matches in both `backend/.env` and `infra/.env`

### API returns 500?
```bash
docker compose -f docker-compose.prod.yml logs api --tail 50
```

### Need to reset everything?
```bash
cd /opt/cryptoniumpay/infra
docker compose -f docker-compose.prod.yml down -v   # ⚠️ DELETES ALL DATA
docker compose -f docker-compose.prod.yml up -d --build
# Then re-run migrations and seed (Step 7)
```

### Check disk space:
```bash
df -h
docker system prune -a  # Clean unused Docker images
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│           Cloudflare Pages (Frontend)       │
│        https://cryptoniumpay.pages.dev      │
└─────────────────┬───────────────────────────┘
                  │ API calls
                  ▼
┌─────────────────────────────────────────────┐
│         VPS (139.59.56.210)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Nginx   │→ │   API    │→ │ PostgreSQL│ │
│  │  :80/443 │  │  :3000   │  │  :5432    │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                ┌──────────┐  ┌───────────┐ │
│                │  Worker  │→ │   Redis   │ │
│                │ (BullMQ) │  │  :6379    │ │
│                └──────────┘  └───────────┘ │
└─────────────────────────────────────────────┘
```
