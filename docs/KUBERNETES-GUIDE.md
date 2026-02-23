# Cryptoniumpay — Kubernetes (K3s) Self-Hosting Guide

> **Complete, noob-friendly, atomic-level guide** for deploying the Cryptoniumpay backend on your own Kubernetes cluster using K3s.  
> Written for someone who has **never used Kubernetes before**.  
> Every single command is copy-pasteable.  
> **Last updated:** February 23, 2026

---

## Table of Contents

1. [What is Kubernetes & Why K3s?](#1-what-is-kubernetes--why-k3s)
2. [Requirements](#2-requirements)
3. [Install K3s (1 Command)](#3-install-k3s-1-command)
4. [Verify K3s is Running](#4-verify-k3s-is-running)
5. [Clone the Repository](#5-clone-the-repository)
6. [Create Kubernetes Namespace](#6-create-kubernetes-namespace)
7. [Create Secrets](#7-create-secrets)
8. [Deploy PostgreSQL](#8-deploy-postgresql)
9. [Deploy Redis](#9-deploy-redis)
10. [Deploy the API](#10-deploy-the-api)
11. [Deploy the Worker](#11-deploy-the-worker)
12. [Deploy Nginx Ingress](#12-deploy-nginx-ingress)
13. [Run Database Migration & Seed](#13-run-database-migration--seed)
14. [Verify Everything Works](#14-verify-everything-works)
15. [Connect Frontend (Cloudflare)](#15-connect-frontend-cloudflare)
16. [Useful kubectl Commands](#16-useful-kubectl-commands)
17. [Updating the Application](#17-updating-the-application)
18. [Scaling](#18-scaling)
19. [Monitoring & Logs](#19-monitoring--logs)
20. [Backup & Restore](#20-backup--restore)
21. [Troubleshooting](#21-troubleshooting)
22. [Kubernetes vs Docker Compose — Comparison](#22-kubernetes-vs-docker-compose--comparison)
23. [Complete Manifest Files](#23-complete-manifest-files)

---

## 1. What is Kubernetes & Why K3s?

### What is Kubernetes?

Kubernetes (K8s) is a system that manages containers (like Docker containers) automatically. Instead of manually running `docker compose up`, Kubernetes:
- **Auto-restarts** crashed containers
- **Scales** services up/down
- **Load-balances** traffic
- **Manages secrets** securely
- **Rolling updates** with zero downtime

### Why K3s instead of full Kubernetes?

| Feature | Full K8s | K3s |
|---------|---------|-----|
| Install size | ~1 GB | ~60 MB |
| Memory usage | 2+ GB | ~512 MB |
| Install time | 30+ minutes | **30 seconds** |
| Complexity | High | Low |
| Production-ready | ✅ | ✅ |
| Single-node support | Needs config | **Built-in** |

**K3s = Kubernetes minus the bloat.** Perfect for self-hosting on a single server.

### Architecture in K8s

```
┌──────────────────────────────────────────────────────────┐
│  K3s Cluster (your Ubuntu server)                         │
│                                                          │
│  Namespace: cryptoniumpay                                │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Pod: api     │  │ Pod: worker │  │ Pod: nginx       │ │
│  │ (NestJS)     │  │ (BullMQ +   │  │ (reverse proxy)  │ │
│  │ Port: 3000   │  │  watcher)   │  │ Ports: 80, 443   │ │
│  │ Replicas: 1-3│  │ Replicas:1-2│  │ Replicas: 1      │ │
│  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘ │
│         │                 │                   │           │
│  ┌──────▼─────────────────▼───────────────────┘         │
│  │                                                       │
│  │  ┌──────────────┐    ┌──────────────┐                │
│  │  │ Pod: postgres │    │ Pod: redis    │                │
│  │  │ Port: 5432    │    │ Port: 6379    │                │
│  │  │ PVC: 10Gi     │    │ PVC: 1Gi      │                │
│  │  └──────────────┘    └──────────────┘                │
│  │                                                       │
│  │  Secrets: cryptoniumpay-secrets                       │
│  │  ConfigMap: cryptoniumpay-config                      │
│  └───────────────────────────────────────────────────────┘
│                                                          │
│  Traefik Ingress (built into K3s)                        │
│  Routes: *.yourdomain.com → api Service                  │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Requirements

### Hardware (Minimum)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |

### Software

- Ubuntu 22.04 or 24.04 (fresh install is fine)
- Root access or sudo
- Internet connection
- A static IP address (if hosting publicly)

### What You DON'T Need

- ❌ Docker (K3s has its own container runtime)
- ❌ Docker Compose
- ❌ Kubernetes knowledge
- ❌ Cloud provider account

---

## 3. Install K3s (1 Command)

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Install K3s:

```bash
curl -sfL https://get.k3s.io | sh -
```

**That's it.** One command. K3s is now installed and running.

**Expected output:**
```
[INFO]  Finding release for channel stable
[INFO]  Using v1.29.x+k3s1 as release
[INFO]  Downloading hash
[INFO]  Installing k3s to /usr/local/bin/k3s
[INFO]  systemd: Creating service file
[INFO]  systemd: Enabling k3s unit
[INFO]  systemd: Starting k3s
```

---

## 4. Verify K3s is Running

```bash
# Check K3s service
sudo systemctl status k3s
# Expected: Active: active (running)

# Check kubectl works
sudo kubectl get nodes
# Expected:
# NAME           STATUS   ROLES                  AGE   VERSION
# your-server    Ready    control-plane,master   30s   v1.29.x+k3s1
```

### Set up kubectl shortcut (optional but recommended)

```bash
# So you don't need sudo every time
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

# Now this works without sudo:
kubectl get nodes
```

### Install kubectl alias (saves typing)

```bash
echo 'alias k=kubectl' >> ~/.bashrc
source ~/.bashrc

# Now you can use 'k' instead of 'kubectl':
k get nodes
```

---

## 5. Clone the Repository

```bash
cd /opt
git clone https://github.com/faysaliteng/quantum-leap-chain.git cryptoniumpay
cd cryptoniumpay
```

Create the K8s manifests directory:

```bash
mkdir -p infra/k8s
```

---

## 6. Create Kubernetes Namespace

A namespace is like a folder that keeps all your Cryptoniumpay stuff separate from other apps.

```bash
kubectl create namespace cryptoniumpay
```

**Expected output:**
```
namespace/cryptoniumpay created
```

Set it as default so you don't have to type `-n cryptoniumpay` every time:

```bash
kubectl config set-context --current --namespace=cryptoniumpay
```

---

## 7. Create Secrets

Generate secrets first:

```bash
# Generate random secrets
JWT_SECRET=$(openssl rand -hex 32)
SIGNER_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
EDGE_SECRET=$(openssl rand -hex 32)

# Print them (save these somewhere safe!)
echo "JWT_SECRET=$JWT_SECRET"
echo "SIGNER_SECRET=$SIGNER_SECRET"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "EDGE_SECRET=$EDGE_SECRET"
```

Create the Kubernetes secret:

```bash
kubectl create secret generic cryptoniumpay-secrets \
  --namespace=cryptoniumpay \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --from-literal=SIGNER_SECRET=$SIGNER_SECRET \
  --from-literal=POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  --from-literal=EDGE_SECRET=$EDGE_SECRET \
  --from-literal=DATABASE_URL="postgresql://cryptoniumpay:${POSTGRES_PASSWORD}@postgres:5432/cryptoniumpay?schema=public" \
  --from-literal=REDIS_URL="redis://redis:6379"
```

**Expected output:**
```
secret/cryptoniumpay-secrets created
```

Verify:

```bash
kubectl get secrets
# Expected: cryptoniumpay-secrets   Opaque   6   <age>
```

---

## 8. Deploy PostgreSQL

Create the PostgreSQL manifest file:

```bash
cat > /opt/cryptoniumpay/infra/k8s/postgres.yaml << 'EOF'
# ── PostgreSQL PersistentVolumeClaim (stores data permanently) ──
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: cryptoniumpay
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
# ── PostgreSQL Deployment ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: cryptoniumpay
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: "cryptoniumpay"
            - name: POSTGRES_DB
              value: "cryptoniumpay"
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: POSTGRES_PASSWORD
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "cryptoniumpay"]
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", "cryptoniumpay"]
            initialDelaySeconds: 15
            periodSeconds: 20
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
---
# ── PostgreSQL Service (internal DNS: postgres:5432) ──
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: cryptoniumpay
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
EOF
```

Apply it:

```bash
kubectl apply -f /opt/cryptoniumpay/infra/k8s/postgres.yaml
```

**Expected output:**
```
persistentvolumeclaim/postgres-pvc created
deployment.apps/postgres created
service/postgres created
```

Wait for PostgreSQL to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
# Expected: pod/postgres-xxxxx condition met
```

---

## 9. Deploy Redis

```bash
cat > /opt/cryptoniumpay/infra/k8s/redis.yaml << 'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: cryptoniumpay
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: cryptoniumpay
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]
          ports:
            - containerPort: 6379
          volumeMounts:
            - name: redis-data
              mountPath: /data
          resources:
            requests:
              memory: "64Mi"
              cpu: "100m"
            limits:
              memory: "192Mi"
              cpu: "250m"
          readinessProbe:
            exec:
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 15
            periodSeconds: 20
      volumes:
        - name: redis-data
          persistentVolumeClaim:
            claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: cryptoniumpay
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
  type: ClusterIP
EOF

kubectl apply -f /opt/cryptoniumpay/infra/k8s/redis.yaml
```

Wait for Redis:

```bash
kubectl wait --for=condition=ready pod -l app=redis --timeout=60s
```

---

## 10. Deploy the API

First, build the Docker image locally (K3s uses containerd, but can import Docker images):

```bash
cd /opt/cryptoniumpay/backend

# Build the image using K3s's built-in container tool
sudo k3s ctr images import - < <(docker build -q -t cryptoniumpay-api:latest . | xargs docker save)

# OR if Docker is not installed, use nerdctl (K3s compatible):
# Option A: Build directly with K3s
sudo nerdctl --namespace k8s.io build -t cryptoniumpay-api:latest /opt/cryptoniumpay/backend/
```

**If you don't have Docker or nerdctl**, install nerdctl:

```bash
# Install nerdctl (lightweight Docker alternative that works with K3s)
wget https://github.com/containerd/nerdctl/releases/download/v1.7.3/nerdctl-1.7.3-linux-amd64.tar.gz
sudo tar xzf nerdctl-1.7.3-linux-amd64.tar.gz -C /usr/local/bin/
rm nerdctl-1.7.3-linux-amd64.tar.gz

# Install buildkit (needed for nerdctl build)
wget https://github.com/moby/buildkit/releases/download/v0.13.0/buildkit-v0.13.0.linux-amd64.tar.gz
sudo tar xzf buildkit-v0.13.0.linux-amd64.tar.gz -C /usr/local/
rm buildkit-v0.13.0.linux-amd64.tar.gz

# Start buildkit
sudo nohup buildkitd &

# Now build
sudo nerdctl --namespace k8s.io build -t cryptoniumpay-api:latest /opt/cryptoniumpay/backend/
```

**Alternatively (easiest):** Just install Docker alongside K3s — they coexist fine:

```bash
curl -fsSL https://get.docker.com | sh
cd /opt/cryptoniumpay/backend
docker build -t cryptoniumpay-api:latest .
# Import into K3s
docker save cryptoniumpay-api:latest | sudo k3s ctr images import -
```

Now create the API deployment:

```bash
cat > /opt/cryptoniumpay/infra/k8s/api.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: cryptoniumpay
  labels:
    app: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: cryptoniumpay-api:latest
          imagePullPolicy: Never    # Use local image, don't try to pull from Docker Hub
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: ENABLE_WATCHER
              value: "false"
            - name: EXPORT_DIR
              value: "/data/exports"
            - name: CORS_ORIGINS
              value: "https://cryptoniumpay.pages.dev"
            - name: JWT_ACCESS_TTL
              value: "15m"
            - name: JWT_REFRESH_TTL
              value: "7d"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: DATABASE_URL
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: REDIS_URL
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: JWT_SECRET
            - name: SIGNER_SECRET
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: SIGNER_SECRET
            - name: EDGE_SECRET
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: EDGE_SECRET
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "1000m"
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 30
          volumeMounts:
            - name: exports
              mountPath: /data/exports
      volumes:
        - name: exports
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: cryptoniumpay
spec:
  selector:
    app: api
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
EOF

kubectl apply -f /opt/cryptoniumpay/infra/k8s/api.yaml
```

Wait for API to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=api --timeout=180s
```

---

## 11. Deploy the Worker

```bash
cat > /opt/cryptoniumpay/infra/k8s/worker.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: cryptoniumpay
  labels:
    app: worker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
        - name: worker
          image: cryptoniumpay-api:latest       # Same image as API
          imagePullPolicy: Never
          command: ["node", "dist/main"]
          env:
            - name: NODE_ENV
              value: "production"
            - name: ENABLE_WATCHER
              value: "true"
            - name: EXPORT_DIR
              value: "/data/exports"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: DATABASE_URL
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: REDIS_URL
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: JWT_SECRET
            - name: SIGNER_SECRET
              valueFrom:
                secretKeyRef:
                  name: cryptoniumpay-secrets
                  key: SIGNER_SECRET
          resources:
            requests:
              memory: "192Mi"
              cpu: "200m"
            limits:
              memory: "384Mi"
              cpu: "500m"
          volumeMounts:
            - name: exports
              mountPath: /data/exports
      volumes:
        - name: exports
          emptyDir: {}
EOF

kubectl apply -f /opt/cryptoniumpay/infra/k8s/worker.yaml
```

---

## 12. Deploy Nginx Ingress

K3s comes with Traefik ingress built-in, but if you prefer Nginx (same as current Docker setup):

```bash
cat > /opt/cryptoniumpay/infra/k8s/ingress.yaml << 'EOF'
# ── Traefik IngressRoute (built into K3s) ──
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cryptoniumpay-ingress
  namespace: cryptoniumpay
  annotations:
    # Rate limiting
    traefik.ingress.kubernetes.io/rate-limit: "average=30, burst=50"
spec:
  rules:
    - http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 3000
EOF

kubectl apply -f /opt/cryptoniumpay/infra/k8s/ingress.yaml
```

**Verify ingress:**

```bash
kubectl get ingress
# Expected:
# NAME                     CLASS     HOSTS   ADDRESS         PORTS   AGE
# cryptoniumpay-ingress    traefik   *       YOUR_SERVER_IP  80      10s
```

Now test from the server:

```bash
curl http://localhost/api/v1/health
# Expected: {"status":"ok",...}
```

And from outside:

```bash
curl http://YOUR_SERVER_IP/api/v1/health
# Expected: {"status":"ok",...}
```

---

## 13. Run Database Migration & Seed

Find the API pod name:

```bash
kubectl get pods -l app=api
# Example output:
# NAME                   READY   STATUS    RESTARTS   AGE
# api-7b9f8d6c4f-x2k9j   1/1     Running   0          2m
```

Push the schema:

```bash
# Replace api-xxxxx with your actual pod name from above
kubectl exec -it $(kubectl get pod -l app=api -o jsonpath='{.items[0].metadata.name}') -- npx prisma@5 db push --accept-data-loss
```

**Expected output:**
```
Your database is now in sync with your Prisma schema.
```

Seed the database:

```bash
kubectl exec -it $(kubectl get pod -l app=api -o jsonpath='{.items[0].metadata.name}') -- npx tsx prisma/seed.ts
```

**Expected output:**
```
Seeding complete!
```

Restart the API and worker to pick up the seeded data:

```bash
kubectl rollout restart deployment api worker
```

---

## 14. Verify Everything Works

### Check all pods are running:

```bash
kubectl get pods
```

**Expected:**
```
NAME                        READY   STATUS    RESTARTS   AGE
postgres-xxxxx              1/1     Running   0          5m
redis-xxxxx                 1/1     Running   0          4m
api-xxxxx                   1/1     Running   0          3m
worker-xxxxx                1/1     Running   0          2m
```

All should show `Running` and `1/1` ready.

### Test health endpoint:

```bash
curl http://localhost/api/v1/health
# Expected: {"status":"ok","version":"1.0.0","uptime":...}
```

### Test login:

```bash
curl -s -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"primox2014@gmail.com","password":"Ff01817018512"}'
# Expected: {"token":"eyJ...","user":{...}}
```

### Test from outside (if publicly accessible):

```bash
curl http://YOUR_SERVER_IP/api/v1/health
```

---

## 15. Connect Frontend (Cloudflare)

Update your Cloudflare Worker gateway's `BACKEND_ORIGIN` to point to your K3s server:

```bash
# If your server IP is e.g. 203.0.113.50
# Use sslip.io for Cloudflare compatibility:
cd /path/to/cloudflare/worker-gateway

# Edit wrangler.toml:
# BACKEND_ORIGIN = "http://203-0-113-50.sslip.io"

wrangler deploy
```

Then rebuild and redeploy the frontend:

```bash
# Windows PowerShell:
$env:VITE_API_BASE_URL="https://cryptoniumpay-api-gateway.mailg.workers.dev/api"
npm run build
npx wrangler pages deploy dist --project-name=cryptoniumpay

# macOS/Linux:
export VITE_API_BASE_URL="https://cryptoniumpay-api-gateway.mailg.workers.dev/api"
npm run build
npx wrangler pages deploy dist --project-name=cryptoniumpay
```

---

## 16. Useful kubectl Commands

### Logs

```bash
# API logs (live stream)
kubectl logs -f deployment/api

# Worker logs
kubectl logs -f deployment/worker

# PostgreSQL logs
kubectl logs -f deployment/postgres

# All pods
kubectl logs -f -l app=api --all-containers
```

### Shell into a pod

```bash
# Shell into API pod
kubectl exec -it deployment/api -- sh

# Shell into PostgreSQL
kubectl exec -it deployment/postgres -- psql -U cryptoniumpay -d cryptoniumpay

# Shell into Redis
kubectl exec -it deployment/redis -- redis-cli
```

### Pod management

```bash
# List all pods
kubectl get pods

# Describe a pod (shows events, errors, etc.)
kubectl describe pod api-xxxxx

# Delete a pod (Kubernetes auto-creates a new one)
kubectl delete pod api-xxxxx

# Restart a deployment
kubectl rollout restart deployment api
kubectl rollout restart deployment worker

# Restart everything
kubectl rollout restart deployment --all
```

### Resource usage

```bash
# CPU and memory per pod
kubectl top pods

# CPU and memory per node
kubectl top nodes
```

---

## 17. Updating the Application

### When you push code changes to GitHub:

```bash
ssh root@YOUR_SERVER_IP

# 1. Pull latest code
cd /opt/cryptoniumpay
git pull origin main

# 2. Rebuild the Docker image
cd backend
docker build -t cryptoniumpay-api:latest .

# 3. Import into K3s
docker save cryptoniumpay-api:latest | sudo k3s ctr images import -

# 4. If schema changed, push new tables:
kubectl exec -it $(kubectl get pod -l app=api -o jsonpath='{.items[0].metadata.name}') -- npx prisma@5 db push --accept-data-loss

# 5. Restart pods to use the new image
kubectl rollout restart deployment api worker

# 6. Watch the rollout
kubectl rollout status deployment/api
# Expected: deployment "api" successfully rolled out

# 7. Verify health
sleep 15
curl http://localhost/api/v1/health
```

### Zero-downtime update (if you have 2+ API replicas)

```bash
# Scale to 2 replicas first
kubectl scale deployment api --replicas=2

# Wait for both to be ready
kubectl rollout status deployment/api

# Now update — Kubernetes will update one at a time
kubectl rollout restart deployment api

# Scale back down if needed
kubectl scale deployment api --replicas=1
```

---

## 18. Scaling

### Scale the API horizontally

```bash
# Scale to 3 API replicas
kubectl scale deployment api --replicas=3

# Scale workers
kubectl scale deployment worker --replicas=2

# Check
kubectl get pods
# Should show 3 api-xxxxx pods and 2 worker-xxxxx pods
```

### Auto-scaling (HPA)

```bash
# Auto-scale API between 1 and 5 replicas based on CPU usage
kubectl autoscale deployment api --min=1 --max=5 --cpu-percent=70

# Check HPA status
kubectl get hpa
```

---

## 19. Monitoring & Logs

### Quick health check script

```bash
cat > /opt/cryptoniumpay/infra/k8s/health-check.sh << 'SCRIPT'
#!/bin/bash
echo "=== Pod Status ==="
kubectl get pods -n cryptoniumpay
echo ""
echo "=== Resource Usage ==="
kubectl top pods -n cryptoniumpay 2>/dev/null || echo "(metrics-server not installed)"
echo ""
echo "=== API Health ==="
curl -s http://localhost/api/v1/health | python3 -m json.tool 2>/dev/null || echo "API not responding"
echo ""
echo "=== Recent Events ==="
kubectl get events -n cryptoniumpay --sort-by='.lastTimestamp' | tail -10
SCRIPT

chmod +x /opt/cryptoniumpay/infra/k8s/health-check.sh
```

Run it:

```bash
bash /opt/cryptoniumpay/infra/k8s/health-check.sh
```

### Set up cron health monitoring

```bash
# Check health every 5 minutes, log failures
(crontab -l 2>/dev/null; echo '*/5 * * * * curl -sf http://localhost/api/v1/health > /dev/null || echo "API DOWN at $(date)" >> /var/log/cryptoniumpay-health.log') | crontab -
```

---

## 20. Backup & Restore

### Backup PostgreSQL

```bash
# One-time backup
kubectl exec deployment/postgres -- pg_dump -U cryptoniumpay -Fc cryptoniumpay > /opt/backups/db_$(date +%Y%m%d_%H%M%S).dump

# Set up daily backup cron
mkdir -p /opt/backups
(crontab -l 2>/dev/null; echo '0 3 * * * kubectl exec deployment/postgres -n cryptoniumpay -- pg_dump -U cryptoniumpay -Fc cryptoniumpay > /opt/backups/db_$(date +\%Y\%m\%d).dump && find /opt/backups -name "*.dump" -mtime +30 -delete') | crontab -
```

### Restore PostgreSQL

```bash
# Stop API and worker
kubectl scale deployment api worker --replicas=0

# Restore
cat /opt/backups/db_20260223.dump | kubectl exec -i deployment/postgres -- pg_restore -U cryptoniumpay -d cryptoniumpay --clean

# Start API and worker
kubectl scale deployment api --replicas=1
kubectl scale deployment worker --replicas=1
```

---

## 21. Troubleshooting

### Pod won't start (CrashLoopBackOff)

```bash
# Check what's wrong
kubectl describe pod api-xxxxx
kubectl logs api-xxxxx --previous   # Logs from the crashed container
```

**Common causes:**
- Database not ready → Wait for PostgreSQL pod to be `Ready`
- Wrong secrets → Check `kubectl get secret cryptoniumpay-secrets -o yaml`
- Image not found → Re-run `docker save ... | sudo k3s ctr images import -`

### Pod stuck in Pending

```bash
kubectl describe pod api-xxxxx
# Look at "Events" section at the bottom
```

**Common causes:**
- Not enough CPU/memory → Reduce resource requests in the YAML
- PVC not bound → Check `kubectl get pvc`

### Can't connect from outside

```bash
# Check if K3s Traefik is listening
sudo ss -tlnp | grep ':80'
# Expected: LISTEN ... traefik

# Check firewall
sudo ufw status
# Port 80 and 443 must be allowed

# Check ingress
kubectl get ingress
```

### Delete everything and start fresh

```bash
# ⚠️ THIS DELETES ALL DATA
kubectl delete namespace cryptoniumpay

# Re-create
kubectl create namespace cryptoniumpay
kubectl config set-context --current --namespace=cryptoniumpay

# Re-apply all manifests
kubectl apply -f /opt/cryptoniumpay/infra/k8s/
```

### K3s itself is broken

```bash
# Restart K3s
sudo systemctl restart k3s

# Check K3s logs
sudo journalctl -u k3s -f

# Nuclear option: reinstall K3s
/usr/local/bin/k3s-uninstall.sh
curl -sfL https://get.k3s.io | sh -
```

---

## 22. Kubernetes vs Docker Compose — Comparison

| Feature | Docker Compose | Kubernetes (K3s) |
|---------|---------------|------------------|
| Setup time | 5 minutes | 15 minutes |
| Learning curve | Low | Medium |
| Auto-restart | ✅ `restart: always` | ✅ Built-in |
| Auto-scaling | ❌ Manual | ✅ HPA |
| Rolling updates | ❌ Downtime | ✅ Zero-downtime |
| Health checks | Basic | Advanced (liveness + readiness) |
| Secret management | `.env` files | Encrypted Secrets |
| Load balancing | ❌ | ✅ Built-in |
| Resource limits | Basic | Granular (requests + limits) |
| Multi-node | ❌ | ✅ Easy to add nodes |
| Monitoring | Docker stats | kubectl top + HPA |
| SSL/TLS | Manual (Certbot) | Traefik auto-TLS |

**Recommendation:** Use Docker Compose for simplicity on a single server. Use K3s when you need scaling, zero-downtime updates, or plan to add more servers.

---

## 23. Complete Manifest Files

All Kubernetes manifests are in `/opt/cryptoniumpay/infra/k8s/`:

```
infra/k8s/
├── postgres.yaml      # PostgreSQL deployment + PVC + service
├── redis.yaml         # Redis deployment + PVC + service
├── api.yaml           # NestJS API deployment + service
├── worker.yaml        # BullMQ worker deployment
├── ingress.yaml       # Traefik ingress route
└── health-check.sh    # Quick health check script
```

### Apply all at once:

```bash
kubectl apply -f /opt/cryptoniumpay/infra/k8s/
```

### Delete all at once:

```bash
kubectl delete -f /opt/cryptoniumpay/infra/k8s/
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| See all pods | `kubectl get pods` |
| API logs | `kubectl logs -f deployment/api` |
| Worker logs | `kubectl logs -f deployment/worker` |
| DB shell | `kubectl exec -it deployment/postgres -- psql -U cryptoniumpay` |
| Restart API | `kubectl rollout restart deployment api` |
| Scale API | `kubectl scale deployment api --replicas=3` |
| Push schema | `kubectl exec -it deployment/api -- npx prisma@5 db push` |
| Seed DB | `kubectl exec -it deployment/api -- npx tsx prisma/seed.ts` |
| Health check | `curl http://localhost/api/v1/health` |
| Delete all | `kubectl delete namespace cryptoniumpay` |

---

*Cryptoniumpay on Kubernetes — Enterprise-grade, self-hosted, zero cost.*
