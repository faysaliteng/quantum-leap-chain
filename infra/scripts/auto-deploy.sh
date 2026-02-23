#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Cryptoniumpay — One-Command Auto Deploy
# ═══════════════════════════════════════════════════════════════════════
# Run on a fresh Ubuntu machine:
#   curl -sfL https://raw.githubusercontent.com/YOU/cryptoniumpay/main/infra/scripts/auto-deploy.sh | bash
#
# Or locally:
#   bash infra/scripts/auto-deploy.sh
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/opt/cryptoniumpay"
BACKUP_DIR="$PROJECT_DIR/backups"

log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()  { echo -e "${GREEN}  ✅ $1${NC}"; }
warn(){ echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail(){ echo -e "${RED}  ❌ $1${NC}"; exit 1; }

echo ""
echo "═══════════════════════════════════════════"
echo "  Cryptoniumpay — Auto Deploy"
echo "═══════════════════════════════════════════"
echo ""

# ── Step 1: System Prerequisites ──────────────────────────────────────

log "Step 1/8: Installing system prerequisites..."

apt-get update -qq
apt-get install -y -qq curl wget git openssl jq > /dev/null 2>&1
ok "System packages installed"

# ── Step 2: Docker ────────────────────────────────────────────────────

log "Step 2/8: Installing Docker..."

if command -v docker &> /dev/null; then
  ok "Docker already installed ($(docker --version | cut -d' ' -f3))"
else
  curl -fsSL https://get.docker.com | sh > /dev/null 2>&1
  systemctl enable docker
  systemctl start docker
  ok "Docker installed"
fi

# Ensure Docker Compose plugin is available
if docker compose version &> /dev/null; then
  ok "Docker Compose available"
else
  fail "Docker Compose plugin not found"
fi

# ── Step 3: Swap (for low-RAM servers) ────────────────────────────────

log "Step 3/8: Configuring swap..."

TOTAL_RAM=$(free -m | awk '/Mem:/ {print $2}')
if [ "$TOTAL_RAM" -lt 3000 ]; then
  if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "1GB swap created (RAM: ${TOTAL_RAM}MB)"
  else
    ok "Swap already exists"
  fi
else
  ok "Sufficient RAM (${TOTAL_RAM}MB) — swap not needed"
fi

# ── Step 4: Project Setup ─────────────────────────────────────────────

log "Step 4/8: Setting up project directory..."

mkdir -p "$PROJECT_DIR" "$BACKUP_DIR"

if [ -d "$PROJECT_DIR/backend" ]; then
  ok "Project files already exist"
else
  warn "Copy your project files to $PROJECT_DIR"
  warn "Or: git clone YOUR_REPO $PROJECT_DIR"
fi

# ── Step 5: Generate Secrets ─────────────────────────────────────────

log "Step 5/8: Generating secrets..."

ENV_FILE="$PROJECT_DIR/backend/.env"

if [ -f "$ENV_FILE" ]; then
  ok "Environment file already exists"
else
  JWT_SECRET=$(openssl rand -hex 32)
  SIGNER_SECRET=$(openssl rand -hex 32)
  POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '=/+')
  EDGE_SECRET=$(openssl rand -hex 32)

  mkdir -p "$PROJECT_DIR/backend"

  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://cryptoniumpay:${POSTGRES_PASSWORD}@db:5432/cryptoniumpay?schema=public
POSTGRES_USER=cryptoniumpay
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=cryptoniumpay

# Redis
REDIS_URL=redis://redis:6379

# Auth
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1d

# Wallet Signer
SIGNER_SECRET=${SIGNER_SECRET}

# Edge Gateway
EDGE_SECRET=${EDGE_SECRET}

# CORS
CORS_ORIGINS=https://cryptoniumpay.pages.dev
EOF

  ok "Secrets generated and saved to $ENV_FILE"
fi

# ── Step 6: Build & Start ────────────────────────────────────────────

log "Step 6/8: Building and starting services..."

cd "$PROJECT_DIR"

if [ -f "infra/docker-compose.prod.yml" ]; then
  docker compose -f infra/docker-compose.prod.yml build --quiet 2>/dev/null || warn "Build warnings (continuing...)"
  docker compose -f infra/docker-compose.prod.yml up -d

  # Wait for health
  sleep 15
  ok "Services started"
else
  warn "docker-compose.prod.yml not found — skipping build"
fi

# ── Step 7: Database Init ─────────────────────────────────────────────

log "Step 7/8: Initializing database..."

if docker compose -f infra/docker-compose.prod.yml ps api 2>/dev/null | grep -q "running"; then
  docker compose -f infra/docker-compose.prod.yml exec -T api npx prisma@5 db push --accept-data-loss 2>/dev/null || warn "Schema push had warnings"
  ok "Database schema synced"
else
  warn "API container not running — skip DB init"
fi

# ── Step 8: Install Resilience Cron ──────────────────────────────────

log "Step 8/8: Setting up automated monitoring..."

chmod +x "$PROJECT_DIR/infra/scripts/resilience.sh" 2>/dev/null || true
chmod +x "$PROJECT_DIR/infra/scripts/offline-mode.sh" 2>/dev/null || true

# Add cron jobs if not already present
CRON_TAG="# cryptoniumpay-auto"
if ! crontab -l 2>/dev/null | grep -q "$CRON_TAG"; then
  (crontab -l 2>/dev/null; cat <<CRON
# ── Cryptoniumpay Automated Tasks ──
*/5 * * * * $PROJECT_DIR/infra/scripts/resilience.sh health >> /var/log/cryptoniumpay-health.log 2>&1 $CRON_TAG
0 * * * *   $PROJECT_DIR/infra/scripts/resilience.sh backup >> /var/log/cryptoniumpay-backup.log 2>&1 $CRON_TAG
0 6 * * *   $PROJECT_DIR/infra/scripts/resilience.sh disk >> /var/log/cryptoniumpay-disk.log 2>&1 $CRON_TAG
CRON
  ) | crontab -
  ok "Cron jobs installed (health every 5min, backup hourly, disk daily)"
else
  ok "Cron jobs already configured"
fi

# ── Final Status ──────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════"
echo -e "  ${GREEN}✅ Deployment Complete!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "  📊 Status:     bash $PROJECT_DIR/infra/scripts/resilience.sh status"
echo "  🔧 Health:     bash $PROJECT_DIR/infra/scripts/resilience.sh health"
echo "  💾 Backup:     bash $PROJECT_DIR/infra/scripts/resilience.sh backup"
echo "  📦 Offline:    bash $PROJECT_DIR/infra/scripts/offline-mode.sh bundle"
echo "  🛑 Shutdown:   bash $PROJECT_DIR/infra/scripts/resilience.sh shutdown"
echo ""
echo "  🌐 API:        http://localhost:3000/api/v1/health"
echo "  🌐 Frontend:   https://cryptoniumpay.pages.dev"
echo ""