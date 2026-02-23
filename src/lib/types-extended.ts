// ── Notification types ──

export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationCategory = "system" | "charge" | "invoice" | "webhook" | "security" | "wallet" | "admin";

export interface Notification {
  id: string;
  user_id: string;
  role_scope: "merchant" | "admin" | "any";
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreference {
  user_id: string;
  categories_enabled: NotificationCategory[];
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── Security Policy types ──

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_number: boolean;
  require_symbol: boolean;
  history_count: number;
  expiry_days: number;
}

export interface SessionPolicy {
  access_token_ttl_minutes: number;
  refresh_token_ttl_days: number;
  max_sessions: number;
  mandatory_2fa_admin: boolean;
  idle_timeout_minutes: number;
}

export interface AccessPolicy {
  maintenance_mode: boolean;
  bypass_ips: string[];
  ip_allowlist_enabled: boolean;
  ip_allowlist: string[];
  geo_block_enabled: boolean;
  geo_blocked_countries: string[];
}

export interface RateLimitPolicy {
  public_rpm: number;
  auth_rpm: number;
  merchant_api_rpm: number;
  webhook_delivery_rpm: number;
}

export interface SecurityPolicies {
  password: PasswordPolicy;
  session: SessionPolicy;
  access: AccessPolicy;
  rate_limit: RateLimitPolicy;
  updated_by?: string;
  updated_at?: string;
}

// ── Wallet Transaction types ──

export type WalletTxDirection = "send" | "receive" | "withdraw" | "swap";
export type WalletTxStatus =
  | "drafted"
  | "pending"
  | "pending_signature"
  | "signed"
  | "broadcasted"
  | "confirmed"
  | "failed"
  | "cancelled";

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  chain: string;
  asset: string;
  direction: WalletTxDirection;
  amount: string;
  fee?: string;
  to_address: string;
  from_address?: string;
  memo?: string;
  status: WalletTxStatus;
  tx_hash?: string;
  explorer_url?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
}

// ── Admin Role & Permission types ──

export type AdminPermission =
  | "wallets.view"
  | "wallets.withdraw"
  | "wallets.approve"
  | "fees.view"
  | "fees.edit"
  | "chains.view"
  | "chains.edit"
  | "cms.view"
  | "cms.edit"
  | "merchants.view"
  | "merchants.manage"
  | "audit.view"
  | "revenue.view"
  | "monitoring.view"
  | "security.view"
  | "security.edit"
  | "roles.view"
  | "roles.manage"
  | "notifications.manage";

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: AdminPermission[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserRole {
  admin_user_id: string;
  admin_email: string;
  role_id: string;
  role_name: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role_id: string;
  role_name: string;
  status: "pending" | "accepted" | "expired";
  invited_by: string;
  created_at: string;
  expires_at: string;
}

// ── Password Reset types ──

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ── Data Export types ──

export type ExportKind =
  | "charges"
  | "invoices"
  | "wallet_transactions"
  | "webhook_deliveries"
  | "merchants"
  | "audit_logs"
  | "revenue"
  | "health_snapshot";

export type ExportStatus = "queued" | "running" | "completed" | "failed";

export interface DataExportJob {
  id: string;
  scope: "merchant" | "admin";
  requested_by_user_id: string;
  merchant_id?: string;
  kind: ExportKind;
  filters: Record<string, unknown>;
  status: ExportStatus;
  file_path?: string;
  file_format: "csv" | "json";
  size_bytes?: number;
  error_message?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}
