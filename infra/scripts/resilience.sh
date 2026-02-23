#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Cryptoniumpay — Apocalypse-Proof Resilience System
# ═══════════════════════════════════════════════════════════════════════
# Features:
# - Auto-restart crashed services
# - Health self-healing (restart unhealthy containers)
# - Automated database backups (hourly + daily)
# - Graceful shutdown with data export
# - Service monitoring with alerting
# - Disk space watchdog
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/cryptoniumpay}"
BACKUP_DIR="${BACKUP_DIR:-/opt/cryptoniumpay/backups}"
COMPOSE_FILE="${PROJECT_DIR}/infra/docker-compose.prod.yml"
LOG_FILE="/var/log/cryptoniumpay-resilience.log"
MAX_BACKUPS=168  # 7 days of hourly backups

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

# ── Health Check & Self-Heal ──────────────────────────────────────────

health_check() {
  log "Running health check..."

  cd "$PROJECT_DIR"

  # Check each service
  for service in api worker db redis; do
    status=$(docker compose -f "$COMPOSE_FILE" ps --format json "$service" 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "missing")

    if [ "$status" != "running" ]; then
      log "⚠️  Service '$service' is $status — restarting..."
      docker compose -f "$COMPOSE_FILE" up -d "$service"
      sleep 10

      # Verify restart
      new_status=$(docker compose -f "$COMPOSE_FILE" ps --format json "$service" 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "failed")
      if [ "$new_status" = "running" ]; then
        log "✅ Service '$service' recovered"
      else
        log "❌ Service '$service' FAILED to restart — manual intervention needed"
      fi
    fi
  done

  # API endpoint health check
  if curl -sf http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    log "✅ API health check passed"
  else
    log "⚠️  API health check FAILED — restarting api service..."
    docker compose -f "$COMPOSE_FILE" restart api
    sleep 15
    if curl -sf http://localhost:3000/api/v1/health > /dev/null 2>&1; then
      log "✅ API recovered after restart"
    else
      log "❌ API still down after restart"
    fi
  fi

  # Redis connectivity
  if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    log "✅ Redis health check passed"
  else
    log "⚠️  Redis not responding — restarting..."
    docker compose -f "$COMPOSE_FILE" restart redis
  fi
}

# ── Database Backup ───────────────────────────────────────────────────

backup_database() {
  log "Starting database backup..."

  mkdir -p "$BACKUP_DIR"
  cd "$PROJECT_DIR"

  TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
  BACKUP_FILE="$BACKUP_DIR/cryptoniumpay_${TIMESTAMP}.sql.gz"

  # Dump and compress
  docker compose -f "$COMPOSE_FILE" exec -T db \
    pg_dump -U "${POSTGRES_USER:-cryptoniumpay}" -d "${POSTGRES_DB:-cryptoniumpay}" \
    --no-owner --no-privileges --clean --if-exists \
    | gzip > "$BACKUP_FILE"

  if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup completed: $BACKUP_FILE ($SIZE)"
  else
    log "❌ Backup FAILED — file is empty or missing"
    rm -f "$BACKUP_FILE"
    return 1
  fi

  # Rotate old backups
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/cryptoniumpay_*.sql.gz 2>/dev/null | wc -l)
  if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    DELETE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    ls -1t "$BACKUP_DIR"/cryptoniumpay_*.sql.gz | tail -n "$DELETE_COUNT" | xargs rm -f
    log "🗑️  Rotated $DELETE_COUNT old backups"
  fi
}

# ── Restore Database ─────────────────────────────────────────────────

restore_database() {
  local backup_file="${1:-}"

  if [ -z "$backup_file" ]; then
    # Use most recent backup
    backup_file=$(ls -1t "$BACKUP_DIR"/cryptoniumpay_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$backup_file" ]; then
      log "❌ No backups found in $BACKUP_DIR"
      return 1
    fi
  fi

  log "Restoring database from: $backup_file"

  cd "$PROJECT_DIR"
  gunzip -c "$backup_file" | docker compose -f "$COMPOSE_FILE" exec -T db \
    psql -U "${POSTGRES_USER:-cryptoniumpay}" -d "${POSTGRES_DB:-cryptoniumpay}" --single-transaction

  log "✅ Database restored from $backup_file"
}

# ── Graceful Shutdown with Data Export ────────────────────────────────

graceful_shutdown() {
  log "🛑 Graceful shutdown initiated..."

  # Emergency backup before shutdown
  backup_database || true

  # Export critical data as JSON
  cd "$PROJECT_DIR"
  EXPORT_DIR="$BACKUP_DIR/emergency_$(date '+%Y%m%d_%H%M%S')"
  mkdir -p "$EXPORT_DIR"

  # Export all tables as JSON
  for table in merchants charges api_keys webhooks; do
    docker compose -f "$COMPOSE_FILE" exec -T db \
      psql -U "${POSTGRES_USER:-cryptoniumpay}" -d "${POSTGRES_DB:-cryptoniumpay}" \
      -c "COPY (SELECT row_to_json(t) FROM $table t) TO STDOUT" \
      > "$EXPORT_DIR/${table}.jsonl" 2>/dev/null || true
  done

  log "📦 Emergency data exported to $EXPORT_DIR"

  # Stop services gracefully
  docker compose -f "$COMPOSE_FILE" down --timeout 30

  log "✅ Graceful shutdown complete"
}

# ── Disk Space Watchdog ──────────────────────────────────────────────

disk_watchdog() {
  USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')

  if [ "$USAGE" -gt 90 ]; then
    log "🚨 CRITICAL: Disk usage at ${USAGE}%!"

    # Clean Docker resources
    docker system prune -f --volumes 2>/dev/null || true

    # Clean old logs
    find /var/log -name "*.gz" -mtime +7 -delete 2>/dev/null || true
    truncate -s 0 "$LOG_FILE" 2>/dev/null || true

    log "🧹 Emergency cleanup performed"
  elif [ "$USAGE" -gt 80 ]; then
    log "⚠️  Disk usage at ${USAGE}% — consider cleanup"
  fi
}

# ── Full System Status ───────────────────────────────────────────────

system_status() {
  echo "═══════════════════════════════════════════"
  echo " Cryptoniumpay System Status"
  echo "═══════════════════════════════════════════"
  echo ""

  cd "$PROJECT_DIR"

  echo "── Docker Services ──"
  docker compose -f "$COMPOSE_FILE" ps 2>/dev/null || echo "Docker Compose not running"
  echo ""

  echo "── API Health ──"
  curl -sf http://localhost:3000/api/v1/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "API unreachable"
  echo ""

  echo "── Disk Usage ──"
  df -h / | tail -1
  echo ""

  echo "── Memory ──"
  free -h | head -2
  echo ""

  echo "── Latest Backup ──"
  ls -1t "$BACKUP_DIR"/cryptoniumpay_*.sql.gz 2>/dev/null | head -1 || echo "No backups found"
  echo ""

  echo "── Uptime ──"
  uptime
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────────

case "${1:-help}" in
  health)     health_check ;;
  backup)     backup_database ;;
  restore)    restore_database "${2:-}" ;;
  shutdown)   graceful_shutdown ;;
  disk)       disk_watchdog ;;
  status)     system_status ;;
  monitor)
    # Continuous monitoring loop
    log "Starting continuous monitoring..."
    while true; do
      health_check
      disk_watchdog
      sleep 300  # Every 5 minutes
    done
    ;;
  all)
    # Run all checks once
    health_check
    backup_database
    disk_watchdog
    ;;
  help|*)
    echo "Usage: $0 {health|backup|restore [file]|shutdown|disk|status|monitor|all}"
    echo ""
    echo "  health    - Check and self-heal services"
    echo "  backup    - Create database backup"
    echo "  restore   - Restore from backup (latest or specify file)"
    echo "  shutdown  - Graceful shutdown with emergency data export"
    echo "  disk      - Check disk space, cleanup if critical"
    echo "  status    - Full system status report"
    echo "  monitor   - Continuous health monitoring (run as daemon)"
    echo "  all       - Run health + backup + disk check once"
    ;;
esac