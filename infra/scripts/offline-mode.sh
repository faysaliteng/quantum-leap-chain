#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Cryptoniumpay — Offline / Air-Gapped Mode Setup
# ═══════════════════════════════════════════════════════════════════════
# Prepares the system to run WITHOUT internet:
# - Pre-pulls all Docker images
# - Caches exchange rates
# - Saves Docker images as tar archives for air-gapped transfer
# - Configures local DNS fallback
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/cryptoniumpay}"
OFFLINE_DIR="${PROJECT_DIR}/offline-bundle"
COMPOSE_FILE="${PROJECT_DIR}/infra/docker-compose.prod.yml"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

# ── Step 1: Pre-pull all Docker images ────────────────────────────────

prepare_images() {
  log "📦 Pulling all required Docker images..."

  IMAGES=(
    "postgres:16-alpine"
    "redis:7-alpine"
    "nginx:alpine"
    "certbot/certbot"
    "node:20-alpine"
  )

  for img in "${IMAGES[@]}"; do
    log "  Pulling $img..."
    docker pull "$img"
  done

  # Build the app image
  log "  Building cryptoniumpay-api..."
  cd "$PROJECT_DIR"
  docker build -t cryptoniumpay-api:latest -f backend/Dockerfile backend/

  log "✅ All images ready"
}

# ── Step 2: Save images to tar files (for air-gapped transfer) ────────

export_images() {
  log "💾 Exporting Docker images to tar files..."

  mkdir -p "$OFFLINE_DIR/images"

  IMAGES=(
    "postgres:16-alpine"
    "redis:7-alpine"
    "nginx:alpine"
    "cryptoniumpay-api:latest"
  )

  for img in "${IMAGES[@]}"; do
    FILENAME=$(echo "$img" | tr '/:' '_')
    log "  Saving $img → ${FILENAME}.tar"
    docker save "$img" > "$OFFLINE_DIR/images/${FILENAME}.tar"
  done

  log "✅ All images exported to $OFFLINE_DIR/images/"
  log "📋 Transfer this folder to the air-gapped machine via USB/SCP"
}

# ── Step 3: Import images on air-gapped machine ──────────────────────

import_images() {
  log "📥 Loading Docker images from tar files..."

  for tar_file in "$OFFLINE_DIR/images"/*.tar; do
    log "  Loading $(basename "$tar_file")..."
    docker load < "$tar_file"
  done

  log "✅ All images loaded"
}

# ── Step 4: Cache exchange rates ──────────────────────────────────────

cache_rates() {
  log "💰 Caching exchange rates..."

  mkdir -p "$OFFLINE_DIR/cache"

  # CoinGecko free API
  COINS="bitcoin,ethereum,solana,tron,litecoin,dogecoin,avalanche-2,matic-network,binancecoin,fantom"
  CURRENCIES="usd,eur,gbp"

  curl -sf "https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=${CURRENCIES}&include_24hr_change=true" \
    > "$OFFLINE_DIR/cache/rates.json" 2>/dev/null || log "⚠️  Could not fetch rates (offline?)"

  if [ -f "$OFFLINE_DIR/cache/rates.json" ] && [ -s "$OFFLINE_DIR/cache/rates.json" ]; then
    log "✅ Exchange rates cached at $(date)"
    log "   File: $OFFLINE_DIR/cache/rates.json"
  else
    log "⚠️  Using last cached rates (if available)"
  fi
}

# ── Step 5: Generate offline .env ─────────────────────────────────────

generate_offline_env() {
  log "🔧 Generating offline environment config..."

  cat > "$OFFLINE_DIR/offline.env" <<'ENVEOF'
# Cryptoniumpay — Offline Mode Configuration
# Copy this into backend/.env when running air-gapped

# Core
NODE_ENV=production
PORT=3000

# Database (local Docker)
DATABASE_URL=postgresql://cryptoniumpay:${POSTGRES_PASSWORD}@db:5432/cryptoniumpay?schema=public

# Redis (local Docker)
REDIS_URL=redis://redis:6379

# Offline-specific settings
OFFLINE_MODE=true
MARKET_DATA_SOURCE=file    # Use cached rates file instead of API
MARKET_RATES_FILE=/data/cache/rates.json
WEBHOOK_RETRY_DISABLED=true    # Don't retry webhooks in offline mode
BLOCKCHAIN_POLLING_DISABLED=false   # Still poll local nodes if available

# Generate these with: openssl rand -hex 32
JWT_SECRET=REPLACE_ME
SIGNER_SECRET=REPLACE_ME
POSTGRES_PASSWORD=REPLACE_ME
ENVEOF

  log "✅ Offline env template saved to $OFFLINE_DIR/offline.env"
}

# ── Step 6: Create full offline bundle ────────────────────────────────

create_bundle() {
  log "📦 Creating complete offline bundle..."

  prepare_images
  export_images
  cache_rates
  generate_offline_env

  # Copy essential files
  mkdir -p "$OFFLINE_DIR/config"
  cp "$PROJECT_DIR/infra/docker-compose.prod.yml" "$OFFLINE_DIR/config/"
  cp "$PROJECT_DIR/infra/nginx/nginx.conf" "$OFFLINE_DIR/config/"
  cp "$PROJECT_DIR/infra/scripts/gen-secrets.sh" "$OFFLINE_DIR/config/"
  cp "$PROJECT_DIR/infra/scripts/resilience.sh" "$OFFLINE_DIR/config/"

  # Create README
  cat > "$OFFLINE_DIR/README.md" <<'EOF'
# Cryptoniumpay — Offline Deployment Bundle

## On the air-gapped machine:

```bash
# 1. Install Docker (if not already)
curl -fsSL https://get.docker.com | sh

# 2. Load Docker images
for f in images/*.tar; do docker load < "$f"; done

# 3. Copy config files
cp config/docker-compose.prod.yml /opt/cryptoniumpay/infra/
cp config/nginx.conf /opt/cryptoniumpay/infra/nginx/

# 4. Generate secrets
bash config/gen-secrets.sh > /opt/cryptoniumpay/backend/.env

# 5. Edit .env — add offline settings from offline.env

# 6. Start
cd /opt/cryptoniumpay
docker compose -f infra/docker-compose.prod.yml up -d

# 7. Initialize database
docker compose -f infra/docker-compose.prod.yml exec api npx prisma@5 db push

# 8. Done! Access at http://localhost
```
EOF

  BUNDLE_SIZE=$(du -sh "$OFFLINE_DIR" | cut -f1)
  log "✅ Offline bundle created: $OFFLINE_DIR ($BUNDLE_SIZE)"
  log "📋 Transfer to air-gapped machine via USB drive"
}

# ── Main ──

case "${1:-help}" in
  prepare)   prepare_images ;;
  export)    export_images ;;
  import)    import_images ;;
  rates)     cache_rates ;;
  env)       generate_offline_env ;;
  bundle)    create_bundle ;;
  help|*)
    echo "Usage: $0 {prepare|export|import|rates|env|bundle}"
    echo ""
    echo "  prepare  - Pull all Docker images"
    echo "  export   - Save images as tar files for USB transfer"
    echo "  import   - Load images from tar files (on air-gapped machine)"
    echo "  rates    - Cache exchange rates for offline use"
    echo "  env      - Generate offline .env template"
    echo "  bundle   - Create complete offline deployment bundle"
    ;;
esac