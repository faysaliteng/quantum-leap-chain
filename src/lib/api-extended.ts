import { http } from "./api-client";
import type {
  Notification, NotificationPreference,
  SecurityPolicies,
  WalletTransaction,
  AdminRole, AdminUserRole, TeamInvite,
} from "./types-extended";
import type { PaginatedResponse } from "./types";

// ── Notifications ──
export const notifications = {
  list: (params?: { category?: string; read?: boolean; page?: number; per_page?: number }) =>
    http.get<PaginatedResponse<Notification>>("/v1/notifications", { params }).then((r) => r.data),
  unreadCount: () =>
    http.get<{ count: number }>("/v1/notifications/unread-count").then((r) => r.data),
  markRead: (id: string) =>
    http.post(`/v1/notifications/${id}/read`),
  markAllRead: () =>
    http.post("/v1/notifications/read-all"),
  remove: (id: string) =>
    http.delete(`/v1/notifications/${id}`),
  getPreferences: () =>
    http.get<NotificationPreference>("/v1/notifications/preferences").then((r) => r.data),
  updatePreferences: (data: Partial<NotificationPreference>) =>
    http.put("/v1/notifications/preferences", data),
};

// ── Security Policies (Admin) ──
export const securityPolicies = {
  get: () =>
    http.get<SecurityPolicies>("/v1/admin/security-policies").then((r) => r.data),
  update: (data: Partial<SecurityPolicies>) =>
    http.put<SecurityPolicies>("/v1/admin/security-policies", data).then((r) => r.data),
};

// ── Wallet Transactions ──
export const walletTransactions = {
  list: (params?: { wallet_id?: string; direction?: string; status?: string; from?: string; to?: string; cursor?: string; per_page?: number }) =>
    http.get<PaginatedResponse<WalletTransaction>>("/v1/wallets/transactions", { params }).then((r) => r.data),
};

// ── Admin Wallet Transactions ──
export const adminWalletTransactions = {
  list: (params?: { wallet_id?: string; direction?: string; status?: string; from?: string; to?: string; cursor?: string; per_page?: number }) =>
    http.get<PaginatedResponse<WalletTransaction>>("/v1/admin/wallets/transactions", { params }).then((r) => r.data),
};

// ── Admin Roles & Permissions ──
export const adminRoles = {
  list: () =>
    http.get<AdminRole[]>("/v1/admin/roles").then((r) => r.data),
  create: (data: { name: string; description: string; permissions: string[] }) =>
    http.post<AdminRole>("/v1/admin/roles", data).then((r) => r.data),
  update: (id: string, data: Partial<AdminRole>) =>
    http.put<AdminRole>(`/v1/admin/roles/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    http.delete(`/v1/admin/roles/${id}`),
  assignments: () =>
    http.get<AdminUserRole[]>("/v1/admin/roles/assignments").then((r) => r.data),
  assign: (data: { admin_user_id: string; role_id: string }) =>
    http.post("/v1/admin/roles/assign", data),
  revoke: (adminUserId: string) =>
    http.delete(`/v1/admin/roles/assignments/${adminUserId}`),
  invites: () =>
    http.get<TeamInvite[]>("/v1/admin/roles/invites").then((r) => r.data),
  sendInvite: (data: { email: string; role_id: string }) =>
    http.post<TeamInvite>("/v1/admin/roles/invites", data).then((r) => r.data),
  revokeInvite: (id: string) =>
    http.delete(`/v1/admin/roles/invites/${id}`),
};
