import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  Charge, ChargePayment, CreateChargeRequest, ListChargesParams, PaginatedResponse,
  LoginRequest, LoginResponse, SignupRequest, SignupResponse, HealthResponse,
  ApiKey, ApiKeyCreated, CreateApiKeyRequest,
  WebhookEndpoint, WebhookDelivery, CreateWebhookRequest, SettlementConfig, DepositAddress,
  AddressPoolUpload, AddressPoolStats, Sweep, Merchant, ChainConfig, AssetConfig,
  SystemHealth, DashboardStats, AdminStats, AuditLogEntry,
  FeeConfig, MerchantFeeOverride, RevenueStats, TopMerchant,
  CMSPage, Announcement, BlogPost, FAQEntry, CMSSettings, CMSStats, ContactSubmission,
  WalletConfig, WalletStats,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("sp_token");
}

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE_URL, timeout: 30000 });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err: AxiosError<{ error?: string; message?: string }>) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("sp_token");
        if (window.location.pathname !== "/login") window.location.href = "/login";
      }
      return Promise.reject(err);
    }
  );

  return client;
}

const http = createClient();

// ── Auth ──
export const auth = {
  login: (data: LoginRequest) => http.post<LoginResponse>("/v1/auth/login", data).then((r) => r.data),
  signup: (data: SignupRequest) => http.post<SignupResponse>("/v1/auth/signup", data).then((r) => r.data),
  logout: () => http.delete("/v1/auth/logout"),
};

// ── Charges ──
export const charges = {
  create: (data: CreateChargeRequest, idempotencyKey?: string) =>
    http.post<Charge>("/v1/charges", data, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {} }).then((r) => r.data),
  get: (id: string) => http.get<Charge>(`/v1/charges/${id}`).then((r) => r.data),
  list: (params?: ListChargesParams) => http.get<PaginatedResponse<Charge>>("/v1/charges", { params }).then((r) => r.data),
  getTransactions: (chargeId: string) => http.get<ChargePayment[]>(`/v1/charges/${chargeId}/transactions`).then((r) => r.data),
};

// ── Public checkout (no auth) ──
export const checkout = {
  getCharge: (id: string) => axios.get<Charge>(`${BASE_URL}/v1/checkout/${id}`).then((r) => r.data),
};

// ── API Keys ──
export const apiKeys = {
  list: () => http.get<ApiKey[]>("/v1/api-keys").then((r) => r.data),
  create: (data: CreateApiKeyRequest) => http.post<ApiKeyCreated>("/v1/api-keys", data).then((r) => r.data),
  revoke: (id: string) => http.delete(`/v1/api-keys/${id}`),
};

// ── Webhooks ──
export const webhooks = {
  list: () => http.get<WebhookEndpoint[]>("/v1/webhooks").then((r) => r.data),
  create: (data: CreateWebhookRequest) => http.post<WebhookEndpoint>("/v1/webhooks", data).then((r) => r.data),
  delete: (id: string) => http.delete(`/v1/webhooks/${id}`),
  test: (id: string) => http.post(`/v1/webhooks/${id}/test`),
  deliveries: (id: string) => http.get<WebhookDelivery[]>(`/v1/webhooks/${id}/deliveries`).then((r) => r.data),
};

// ── Settlement ──
export const settlement = {
  getConfig: () => http.get<SettlementConfig[]>("/v1/settlement").then((r) => r.data),
  updateConfig: (data: SettlementConfig) => http.put("/v1/settlement", data),
  listSweeps: () => http.get<Sweep[]>("/v1/sweeps").then((r) => r.data),
};

// ── Deposit Addresses ──
export const addressPool = {
  stats: () => http.get<AddressPoolStats[]>("/v1/addresses/stats").then((r) => r.data),
  upload: (data: AddressPoolUpload) => http.post("/v1/addresses/upload", data),
  list: (chain?: string) => http.get<DepositAddress[]>("/v1/addresses", { params: { chain } }).then((r) => r.data),
};

// ── Merchant Wallets ──
export const wallets = {
  list: () => http.get<WalletConfig[]>("/v1/wallets").then((r) => r.data),
  add: (data: { label: string; chain: string; address: string; type: string }) =>
    http.post<WalletConfig>("/v1/wallets", data).then((r) => r.data),
  remove: (id: string) => http.delete(`/v1/wallets/${id}`),
};

// ── Dashboard ──
export const dashboard = {
  stats: () => http.get<DashboardStats>("/v1/dashboard/stats").then((r) => r.data),
};

// ── Admin ──
export const admin = {
  stats: () => http.get<AdminStats>("/v1/admin/stats").then((r) => r.data),
  merchants: {
    list: () => http.get<Merchant[]>("/v1/admin/merchants").then((r) => r.data),
    get: (id: string) => http.get<Merchant>(`/v1/admin/merchants/${id}`).then((r) => r.data),
    toggle: (id: string, enabled: boolean) => http.patch(`/v1/admin/merchants/${id}`, { status: enabled ? "active" : "disabled" }),
  },
  chains: {
    list: () => http.get<ChainConfig[]>("/v1/admin/chains").then((r) => r.data),
    update: (chain: string, data: Partial<ChainConfig>) => http.put(`/v1/admin/chains/${chain}`, data),
  },
  assets: {
    list: () => http.get<AssetConfig[]>("/v1/admin/assets").then((r) => r.data),
    toggle: (chain: string, symbol: string, enabled: boolean) => http.patch(`/v1/admin/assets/${chain}/${symbol}`, { enabled }),
  },
  fees: {
    getConfig: () => http.get<FeeConfig>("/v1/admin/fees").then((r) => r.data),
    updateConfig: (data: Partial<FeeConfig>) => http.put("/v1/admin/fees", data),
    listOverrides: () => http.get<MerchantFeeOverride[]>("/v1/admin/fees/overrides").then((r) => r.data),
    setOverride: (data: { merchant_id: string; rate_percent: number }) => http.post("/v1/admin/fees/overrides", data),
    removeOverride: (merchantId: string) => http.delete(`/v1/admin/fees/overrides/${merchantId}`),
  },
  revenue: {
    stats: () => http.get<RevenueStats>("/v1/admin/revenue").then((r) => r.data),
    topMerchants: () => http.get<TopMerchant[]>("/v1/admin/revenue/top-merchants").then((r) => r.data),
  },
  health: () => http.get<SystemHealth>("/v1/admin/health").then((r) => r.data),
  auditLog: (params?: { actor?: string; action?: string; from?: string; to?: string; page?: number }) =>
    http.get<PaginatedResponse<AuditLogEntry>>("/v1/admin/audit-log", { params }).then((r) => r.data),

  // ── Wallets ──
  wallets: {
    stats: () => http.get<WalletStats>("/v1/admin/wallets/stats").then((r) => r.data),
    add: (data: Partial<WalletConfig>) => http.post<WalletConfig>("/v1/admin/wallets", data).then((r) => r.data),
    update: (id: string, data: Partial<WalletConfig>) => http.put(`/v1/admin/wallets/${id}`, data),
    remove: (id: string) => http.delete(`/v1/admin/wallets/${id}`),
  },

  // ── CMS ──
  cms: {
    stats: () => http.get<CMSStats>("/v1/admin/cms/stats").then((r) => r.data),
    pages: {
      list: () => http.get<CMSPage[]>("/v1/admin/cms/pages").then((r) => r.data),
      update: (id: string, data: Partial<CMSPage>) => http.put(`/v1/admin/cms/pages/${id}`, data),
    },
    announcements: {
      list: () => http.get<Announcement[]>("/v1/admin/cms/announcements").then((r) => r.data),
      create: (data: Omit<Announcement, "id" | "created_at">) => http.post<Announcement>("/v1/admin/cms/announcements", data).then((r) => r.data),
      update: (id: string, data: Partial<Announcement>) => http.put(`/v1/admin/cms/announcements/${id}`, data),
      delete: (id: string) => http.delete(`/v1/admin/cms/announcements/${id}`),
    },
    blog: {
      list: () => http.get<BlogPost[]>("/v1/admin/cms/blog").then((r) => r.data),
      create: (data: Omit<BlogPost, "id" | "created_at">) => http.post<BlogPost>("/v1/admin/cms/blog", data).then((r) => r.data),
      update: (id: string, data: Partial<BlogPost>) => http.put(`/v1/admin/cms/blog/${id}`, data),
      delete: (id: string) => http.delete(`/v1/admin/cms/blog/${id}`),
    },
    faq: {
      list: () => http.get<FAQEntry[]>("/v1/admin/cms/faq").then((r) => r.data),
      create: (data: Omit<FAQEntry, "id" | "created_at">) => http.post<FAQEntry>("/v1/admin/cms/faq", data).then((r) => r.data),
      update: (id: string, data: Partial<FAQEntry>) => http.put(`/v1/admin/cms/faq/${id}`, data),
      delete: (id: string) => http.delete(`/v1/admin/cms/faq/${id}`),
    },
    settings: {
      get: () => http.get<CMSSettings>("/v1/admin/cms/settings").then((r) => r.data),
      update: (data: Partial<CMSSettings>) => http.put("/v1/admin/cms/settings", data),
    },
    contacts: {
      list: () => http.get<ContactSubmission[]>("/v1/admin/cms/contacts").then((r) => r.data),
      update: (id: string, data: Partial<ContactSubmission>) => http.put(`/v1/admin/cms/contacts/${id}`, data),
      delete: (id: string) => http.delete(`/v1/admin/cms/contacts/${id}`),
    },
  },
};

// ── Health ──
export const health = {
  check: () => http.get<HealthResponse>("/v1/health").then((r) => r.data),
};
