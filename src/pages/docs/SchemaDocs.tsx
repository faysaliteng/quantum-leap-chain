import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocsNav } from "@/components/DocsNav";
import { SEOHead } from "@/components/SEOHead";
import { ShareBar } from "@/components/ShareBar";
import { useI18n } from "@/lib/i18n";

const tables = [
  { name: "users", cols: "id, email, password_hash, role, merchant_id?, totp_secret?, created_at, updated_at", indexes: "UNIQUE(email)" },
  { name: "sessions", cols: "id, user_id, token_hash, expires_at, ip_address, created_at", indexes: "INDEX(user_id), INDEX(token_hash)" },
  { name: "merchants", cols: "id, name, email, status, created_at, updated_at", indexes: "UNIQUE(email)" },
  { name: "projects", cols: "id, merchant_id, name, created_at", indexes: "INDEX(merchant_id)" },
  { name: "api_keys", cols: "id, merchant_id, name, key_hash, prefix, scopes[], last_used_at, created_at", indexes: "UNIQUE(key_hash), INDEX(merchant_id)" },
  { name: "webhook_endpoints", cols: "id, merchant_id, url, secret, events[], active, created_at", indexes: "INDEX(merchant_id)" },
  { name: "webhook_deliveries", cols: "id, webhook_id, event_type, event_id, payload, status_code, latency_ms, attempt, max_attempts, next_retry_at, created_at", indexes: "INDEX(webhook_id), INDEX(event_id)" },
  { name: "charges", cols: "id, merchant_id, name, description, pricing_type, local_price_json, requested_crypto_json, status, hosted_slug, expires_at, metadata, redirect_url, cancel_url, created_at, updated_at", indexes: "UNIQUE(hosted_slug), INDEX(merchant_id, status), INDEX(expires_at)" },
  { name: "charge_payments", cols: "id, charge_id, chain, asset, tx_hash, log_index, vout, amount, confirmations, required_confirmations, block_number, block_hash, status, created_at", indexes: "UNIQUE(tx_hash, log_index, chain), INDEX(charge_id)" },
  { name: "deposit_addresses", cols: "id, chain, address, status, charge_id, merchant_id, derivation_index, derivation_path, created_at", indexes: "UNIQUE(chain, address), INDEX(status, chain), INDEX(charge_id)" },
  { name: "chain_configs", cols: "chain, name, enabled, confirmation_threshold, created_at, updated_at", indexes: "PK(chain)" },
  { name: "asset_configs", cols: "chain, symbol, name, contract_address, decimals, enabled, created_at", indexes: "PK(chain, symbol)" },
  { name: "rpc_endpoints", cols: "id, chain, url, priority, status, latency_ms, created_at", indexes: "INDEX(chain, priority)" },
  { name: "checkpoints", cols: "chain, current_block, block_hash, updated_at", indexes: "PK(chain)" },
  { name: "sweeps", cols: "id, charge_id, chain, asset, from_address, to_address, amount, fee, tx_hash, status, created_at, confirmed_at", indexes: "INDEX(charge_id), INDEX(status)" },
  { name: "settlement_configs", cols: "id, merchant_id, chain, asset, address, sweep_mode, min_threshold, created_at", indexes: "UNIQUE(merchant_id, chain, asset)" },
  { name: "audit_logs", cols: "id, actor_id, actor_email, action, resource_type, resource_id, details_json, ip_address, created_at", indexes: "INDEX(actor_id), INDEX(action), INDEX(created_at)" },
  { name: "idempotency_keys", cols: "key, response_json, created_at, expires_at", indexes: "PK(key), INDEX(expires_at)" },
];

export default function SchemaDocs() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background" data-testid="page:docs-schema">
      <SEOHead title={t("docs.schema")} description="PostgreSQL database schema reference with 18 tables for the Cryptoniumpay payment gateway." />
      <DocsNav />
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">{t("docs.schema")}</h1>
          <ShareBar title="Cryptoniumpay Database Schema" />
        </div>
        <p className="text-sm text-muted-foreground">PostgreSQL schema with {tables.length} tables. All timestamps are UTC. UUIDs for primary keys unless noted.</p>

        <div className="space-y-4">
          {tables.map((t) => (
            <Card key={t.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">{t.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-muted-foreground font-mono leading-relaxed">{t.cols}</div>
                <div className="flex flex-wrap gap-1">
                  {t.indexes.split(", ").map((idx) => (
                    <Badge key={idx} variant="outline" className="text-xs font-mono">{idx}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Key Relationships</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-muted-foreground">{`
merchants ──1:N──▶ projects
merchants ──1:N──▶ api_keys
merchants ──1:N──▶ webhook_endpoints
merchants ──1:N──▶ charges
merchants ──1:N──▶ settlement_configs
charges   ──1:N──▶ charge_payments
charges   ──1:N──▶ deposit_addresses
charges   ──1:N──▶ sweeps
webhook_endpoints ──1:N──▶ webhook_deliveries
chain_configs ──1:N──▶ rpc_endpoints
chain_configs ──1:N──▶ asset_configs
users ──N:1──▶ merchants
            `}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
