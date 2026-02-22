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

export type WalletType = "hot" | "cold";
export type WalletStatus = "active" | "inactive" | "locked";

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
  key: string;
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
  total_payments_received?: number;
  success_rate?: number;
  volume_chart?: { date: string; amount: number }[];
  holdings?: { symbol: string; percentage: number; amount: string; usd_value: string }[];
}

export interface AdminStats {
  total_merchants: number;
  active_charges: number;
  transactions_today: number;
  total_transactions?: number;
  completed?: number;
  processing?: number;
  rejected?: number;
  failed?: number;
  flagged?: number;
  volume_chart?: { date: string; amount: number }[];
  holdings?: { symbol: string; percentage: number; amount: string; usd_value: string }[];
  recent_activity?: { id: string; action: string; detail: string; time: string }[];
}

// ── Fee Management ──

export interface FeeConfig {
  rate_percent: number;
  min_fee_usd: number;
  model: "flat" | "tiered";
}

export interface MerchantFeeOverride {
  merchant_id: string;
  rate_percent: number;
  created_at: string;
}

// ── Revenue ──

export interface RevenueStats {
  total_revenue_usd: string;
  fees_today_usd: string;
  total_transactions: number;
  active_merchants: number;
  revenue_change_pct: number;
  daily_revenue: { date: string; amount: number }[];
  revenue_by_chain?: { chain: string; amount: number }[];
  transaction_volume?: { date: string; count: number }[];
}

export interface TopMerchant {
  merchant_id: string;
  name: string;
  volume_usd: string;
  fees_usd: string;
  tx_count: number;
  rate_percent: number;
}

// ── CMS ──

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  og_image?: string;
  status: "published" | "draft";
  updated_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  type: "info" | "warning" | "promo";
  active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  tags: string[];
  status: "published" | "draft" | "scheduled";
  author: string;
  published_at?: string;
  created_at: string;
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  visible: boolean;
  created_at: string;
}

export interface CMSSettings {
  site_title_template: string;
  default_og_image: string;
  social_urls: Record<string, string>;
  analytics_id: string;
  maintenance_mode: boolean;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
  notes?: string;
}

export interface CMSStats {
  total_pages: number;
  total_posts: number;
  total_announcements: number;
  total_faqs: number;
  total_contacts: number;
  unread_contacts: number;
  recent_activity: { id: string; type: string; title: string; action: string; time: string }[];
}

// ── Wallet types ──

export interface WalletConfig {
  id: string;
  label: string;
  type: WalletType;
  chain: ChainId;
  address: string;
  xpub?: string;
  derivation_path?: string;
  balance: string;
  balance_usd: number;
  status: WalletStatus;
  last_activity?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  tx_hash: string;
  direction: "in" | "out";
  amount: string;
  asset: AssetSymbol;
  chain: ChainId;
  confirmed: boolean;
  timestamp: string;
}

export interface WalletStats {
  total_hot_wallets: number;
  total_cold_wallets: number;
  total_balance_usd: number;
  hot_balance_usd: number;
  cold_balance_usd: number;
  wallets: WalletConfig[];
}

// ── Invoices ──

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  merchant_id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  items: InvoiceItem[];
  subtotal: string;
  tax_rate: number;
  tax_amount: string;
  total: string;
  currency: string;
  chains: ChainId[];
  status: InvoiceStatus;
  due_date: string;
  notes?: string;
  charge_id?: string;
  payment_url?: string;
  sent_at?: string;
  paid_at?: string;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

export interface CreateInvoiceRequest {
  customer_name: string;
  customer_email: string;
  items: Omit<InvoiceItem, "amount">[];
  currency: string;
  chains: ChainId[];
  tax_rate?: number;
  due_date: string;
  notes?: string;
}

// ── i18n ──

export type Locale = "en" | "es" | "fr" | "de" | "ja" | "zh" | "ko" | "pt" | "ar" | "ru";

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
