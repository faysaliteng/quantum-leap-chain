#!/bin/bash
# Generate secure random secrets for Cryptoniumpay
set -euo pipefail

echo "Generating secrets..."

JWT_SECRET=$(openssl rand -hex 32)
SIGNER_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '=/+')

cat <<EOF

# ── Generated Secrets ──
# Add these to your backend/.env file

JWT_SECRET=${JWT_SECRET}
SIGNER_SECRET=${SIGNER_SECRET}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://cryptoniumpay:${POSTGRES_PASSWORD}@db:5432/cryptoniumpay?schema=public

EOF

echo "Done! Copy the above into backend/.env"
