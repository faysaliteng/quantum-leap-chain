# Cryptoniumpay — Operations Runbook

> Operational procedures for managing the Cryptoniumpay platform in production.

**Version:** 1.0.0
**Last updated:** 2026-02-22

---

## Table of Contents

1. [Secret Rotation](#1-secret-rotation)
2. [Database Operations](#2-database-operations)
3. [Scaling Workers](#3-scaling-workers)
4. [Failed Webhook Recovery](#4-failed-webhook-recovery)
5. [Incident Response](#5-incident-response)
6. [Backup & Restore](#6-backup--restore)
7. [Monitoring & Alerts](#7-monitoring--alerts)
8. [Common Issues](#8-common-issues)

---

## 1. Secret Rotation

### Rotate JWT_SECRET

**Impact:** All active sessions will be invalidated.

```bash
# 1. Generate new secret
openssl rand -hex 32

# 2. Update .env on the server
nano /opt/cryptoniumpay/.env
# Change JWT_SECRET=<new_value>

# 3. Restart API + worker
docker compose restart api worker

# 4. Verify
curl -s https://api.yourdomain.com/v1/health | jq .
# Expected: { "status": "ok", ... }
```

### Rotate SIGNER_SECRET

```bash
# 1. Generate new secret
openssl rand -hex 32

# 2. Update .env
nano /opt/cryptoniumpay/.env
# Change SIGNER_SECRET=<new_value>

# 3. Restart signer + worker (both must share the secret)
docker compose restart signer worker

# 4. Verify signer health
docker compose exec worker curl -s http://signer:8080/health
# Expected: { "status": "ok" }
```

### Rotate Database Password

```bash
# 1. Connect to Postgres and change password
docker compose exec postgres psql -U cryptoniumpay -c "ALTER USER cryptoniumpay PASSWORD 'NEW_PASSWORD_HERE';"

# 2. Update .env
nano /opt/cryptoniumpay/.env
# Update DATABASE_URL with new password

# 3. Restart API + worker
docker compose restart api worker
```

---

## 2. Database Operations

### Run Migrations

```bash
# Via Docker
docker compose exec api npx prisma migrate deploy

# Verify
docker compose exec api npx prisma migrate status
```

### Rollback Last Migration

```bash
# Check current status
docker compose exec api npx prisma migrate status

# Manually apply down migration
docker compose exec postgres psql -U cryptoniumpay -f /path/to/down.sql
```

### Create New Migration

```bash
# In development
cd backend
npx prisma migrate dev --name describe_change
```

### Database Shell

```bash
docker compose exec postgres psql -U cryptoniumpay -d cryptoniumpay
```

### Useful Queries

```sql
-- Active charges count
SELECT status, COUNT(*) FROM charges GROUP BY status;

-- Webhook delivery failures in last 24h
SELECT webhook_id, COUNT(*) as failures
FROM webhook_deliveries
WHERE status_code IS NULL OR status_code >= 400
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY webhook_id;

-- Watcher lag per chain
SELECT chain, lag, last_updated FROM watcher_checkpoints;

-- Top merchants by volume
SELECT m.name, COUNT(c.id) as charges, 
       SUM(CAST(c.local_amount AS DECIMAL)) as volume
FROM charges c
JOIN merchants m ON c.merchant_id = m.id
WHERE c.status = 'PAID'
GROUP BY m.name
ORDER BY volume DESC
LIMIT 10;
```

---

## 3. Scaling Workers

### Scale Horizontally

```bash
# Scale worker containers
docker compose up -d --scale worker=3

# Verify all workers are processing
docker compose logs --tail=20 worker
```

### Monitor Queue Depth

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Check BullMQ queue lengths
LLEN bull:webhook-dispatch:wait
LLEN bull:sweep-execution:wait
LLEN bull:charge-expiry:wait
LLEN bull:blockchain-events:wait
```

### Clear Stuck Jobs

```bash
# Via Redis CLI
docker compose exec redis redis-cli

# Clear failed jobs in webhook queue
DEL bull:webhook-dispatch:failed
```

---

## 4. Failed Webhook Recovery

### View Failed Deliveries

```sql
SELECT wd.id, we.url, wd.event_type, wd.status_code, wd.attempt, wd.created_at
FROM webhook_deliveries wd
JOIN webhook_endpoints we ON wd.webhook_id = we.id
WHERE wd.status_code IS NULL OR wd.status_code >= 400
ORDER BY wd.created_at DESC
LIMIT 20;
```

### Retry Failed Deliveries

```bash
# Re-enqueue specific delivery
docker compose exec api node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('webhook-dispatch', { connection: { host: 'redis' } });
  q.add('retry', { deliveryId: 'DELIVERY_ID_HERE' });
"
```

### Disable Failing Endpoint

```sql
UPDATE webhook_endpoints SET active = false WHERE id = 'ENDPOINT_ID';
```

---

## 5. Incident Response

### Suspected Key Compromise

1. **Immediately rotate** the compromised secret (see Section 1)
2. **Revoke** all API keys for affected merchants
3. **Check audit log** for unauthorized actions:
   ```sql
   SELECT * FROM audit_logs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```
4. **Notify** affected merchants
5. **Review** access logs in nginx

### Database Breach

1. **Isolate** the server (firewall rules)
2. **Rotate** all secrets (JWT, DB password, signer)
3. **Audit** what data was accessed
4. **Reset** all user passwords (force re-login)
5. **Notify** affected users per legal requirements

### Service Outage

1. **Check** health endpoint: `curl https://api.yourdomain.com/v1/health`
2. **Check** container status: `docker compose ps`
3. **Check** logs: `docker compose logs --tail=100 api`
4. **Check** database: `docker compose exec postgres pg_isready`
5. **Check** Redis: `docker compose exec redis redis-cli ping`
6. **Restart** failed services: `docker compose restart <service>`

---

## 6. Backup & Restore

### Automated Daily Backup

```bash
# Add to crontab (crontab -e)
0 3 * * * /opt/cryptoniumpay/scripts/backup.sh >> /var/log/cryptoniumpay-backup.log 2>&1
```

### backup.sh

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/cryptoniumpay"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

# Dump database
docker compose -f /opt/cryptoniumpay/docker-compose.yml exec -T postgres \
  pg_dump -U cryptoniumpay -Fc cryptoniumpay > "$BACKUP_DIR/db_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/db_$DATE.dump"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "$(date): Backup completed: db_$DATE.dump.gz"
```

### Restore from Backup

```bash
# Stop services that write to DB
docker compose stop api worker

# Restore
gunzip -k /opt/backups/cryptoniumpay/db_20260222_030000.dump.gz
docker compose exec -T postgres pg_restore -U cryptoniumpay -d cryptoniumpay --clean \
  < /opt/backups/cryptoniumpay/db_20260222_030000.dump

# Restart
docker compose start api worker
```

---

## 7. Monitoring & Alerts

### Health Check Endpoints

```bash
# API health
curl -s https://api.yourdomain.com/v1/health | jq .
# Expected: { "status": "ok", "version": "1.0.0", "uptime": 86400 }

# Admin system health (requires admin JWT)
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/v1/admin/health | jq .
```

### Uptime Monitoring (cron)

```bash
# Add to crontab
*/5 * * * * curl -sf https://api.yourdomain.com/v1/health > /dev/null || \
  echo "Cryptoniumpay API DOWN at $(date)" | mail -s "ALERT: API Down" ops@yourdomain.com
```

### Key Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| API response time (p95) | > 500ms | > 2000ms |
| Watcher lag (blocks) | > 10 | > 50 |
| Webhook queue depth | > 100 | > 1000 |
| Failed webhook rate | > 5%/hr | > 20%/hr |
| Disk usage | > 80% | > 95% |
| Memory usage | > 80% | > 95% |

---

## 8. Common Issues

### "Connection refused" on API

```bash
# Check if container is running
docker compose ps api
# Check logs
docker compose logs --tail=50 api
# Common fix: database not ready
docker compose restart api
```

### Watcher stuck / not advancing

```bash
# Check checkpoint
docker compose exec postgres psql -U cryptoniumpay -c \
  "SELECT chain, current_block, latest_block, lag FROM watcher_checkpoints;"

# Check RPC health
docker compose exec api curl -s http://localhost:3000/v1/admin/health | jq .rpc_status

# Restart watcher
docker compose restart worker
```

### Redis out of memory

```bash
# Check Redis memory
docker compose exec redis redis-cli INFO memory | grep used_memory_human

# Flush expired data
docker compose exec redis redis-cli
> FLUSHDB  # WARNING: clears all queues

# Better: increase maxmemory in docker-compose.yml
```

### SSL certificate expired

```bash
# Renew manually
docker compose run --rm certbot renew

# Restart nginx
docker compose restart frontend
```
