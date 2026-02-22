// ── Enums ──

export type ChargeStatus =
  | "NEW"
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "EXPIRED"
  | "CANCELED"
  | "UNDERPAID"
  | "OVERPAID";

export type PricingType = "fixed_price" | "no_price";

export type ChainId =
  | "btc"
  | "eth"
  | "arbitrum"
  | "optimism"
  | "polygon";

export type AssetSymbol = "BTC" | "ETH" | "USDC" | "USDT" | "MATIC";

export type SweepMode = "immediate" | "batched";

export type WebhookEventType =
  | "charge.created"
  | "charge.pending"
  | "charge.confirmed"
  | "charge.paid"
  | "charge.expired"
  | "charge.underpaid"
  | "charge.overpaid"
  | "settlement.sweep.initiated"
  | "settlement.sweep.confirmed"
  | "settlement.sweep.failed";

export type ApiKeyScope = "read" | "write" | "admin";

// ── Core models ──

export interface Merchant {
  id: string;
  name: string;
  email: string;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export interface Charge {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  pricing_type: PricingType;
  local_price?: { amount: string; currency: string };
  requested_crypto?: { chain: ChainId; asset: AssetSymbol; amount: string };
  status: ChargeStatus;
  addresses: Record<string, { chain: ChainId; asset: AssetSymbol; address: string; amount: string }>;
  hosted_url: string;
  expires_at: string;
  metadata?: Record<string, unknown>;
  redirect_url?: string;
  cancel_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChargePayment {
  id: string;
  charge_id: string;
  chain: ChainId;
  asset: AssetSymbol;
  tx_hash: string;
  amount: string;
  confirmations: number;
  required_confirmations: number;
  block_number?: number;
  block_hash?: string;
  status: "detected" | "confirming" | "confirmed" | "reorged";
  created_at: string;
}

export interface DepositAddress {
  id: string;
  chain: ChainId;
  address: string;
  status: "available" | "allocated" | "exhausted";
  charge_id?: string;
  derivation_index?: number;
  created_at: string;
}

export interface Sweep {
  id: string;
  charge_id: string;
  chain: ChainId;
  asset: AssetSymbol;
  from_address: string;
  to_address: string;
  amount: string;
  tx_hash?: string;
  status: "pending" | "initiated" | "confirmed" | "failed";
  created_at: string;
}

export interface ApiKey {
  id: string;
  merchant_id: string;
  name: string;
  prefix: string;
  scopes: ApiKeyScope[];
  last_used_at?: string;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string; // full key, shown once
}

export interface WebhookEndpoint {
  id: string;
  merchant_id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  event_id: string;
  status_code?: number;
  latency_ms?: number;
  attempt: number;
  max_attempts: number;
  next_retry_at?: string;
  created_at: string;
}

export interface SettlementConfig {
  chain: ChainId;
  asset: AssetSymbol;
  address: string;
  sweep_mode: SweepMode;
  min_sweep_threshold: string;
}

export interface ChainConfig {
  chain: ChainId;
  name: string;
  enabled: boolean;
  confirmation_threshold: number;
  rpc_endpoints: RpcEndpoint[];
}

export interface RpcEndpoint {
  id: string;
  url: string;
  priority: number;
  status: "healthy" | "degraded" | "down";
  latency_ms?: number;
}

export interface AssetConfig {
  chain: ChainId;
  symbol: AssetSymbol;
  name: string;
  contract_address?: string;
  decimals: number;
  enabled: boolean;
}

export interface WatcherCheckpoint {
  chain: ChainId;
  current_block: number;
  latest_block: number;
  lag: number;
  last_updated: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_email?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface SystemHealth {
  watchers: WatcherCheckpoint[];
  rpc_status: { chain: ChainId; healthy: number; total: number }[];
  webhook_queue: { pending: number; failed: number };
  uptime_seconds: number;
}

export interface DashboardStats {
  total_charges: number;
  pending_payments: number;
  confirmed_today: number;
  total_volume_usd: string;
}

export interface AdminStats {
  total_merchants: number;
  active_charges: number;
  transactions_today: number;
}

// ── API request/response types ──

export interface CreateChargeRequest {
  name: string;
  description?: string;
  pricing_type: PricingType;
  local_price?: { amount: string; currency: string };
  requested_crypto?: { chain: ChainId; asset: AssetSymbol; amount: string };
  expires_in_minutes?: number;
  metadata?: Record<string, unknown>;
  redirect_url?: string;
  cancel_url?: string;
}

export interface ListChargesParams {
  status?: ChargeStatus;
  from?: string;
  to?: string;
  asset?: AssetSymbol;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: "merchant" | "admin"; merchant_id?: string };
}

export interface HealthResponse {
  status: "ok" | "degraded";
  version: string;
  uptime: number;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: ApiKeyScope[];
}

export interface CreateWebhookRequest {
  url: string;
  events: WebhookEventType[];
}

export interface AddressPoolUpload {
  chain: ChainId;
  addresses: string[];
}

export interface AddressPoolStats {
  chain: ChainId;
  total: number;
  allocated: number;
  available: number;
}

// ── Signup ──

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  token: string;
  user: { id: string; email: string; role: "merchant" | "admin"; merchant_id?: string };
}
