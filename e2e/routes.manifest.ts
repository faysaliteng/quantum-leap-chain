/**
 * Cryptoniumpay — Route Manifest (Single Source of Truth)
 * Total: 65 routes
 */

export const publicRoutes = [
  { key: "landing", path: "/" },
  { key: "login", path: "/login" },
  { key: "signup", path: "/signup" },
  { key: "verify-email", path: "/verify-email" },
  { key: "verify-2fa", path: "/verify-2fa" },
  { key: "forgot-password", path: "/forgot-password" },
  { key: "reset-password", path: "/reset-password" },
  { key: "terms", path: "/terms" },
  { key: "privacy", path: "/privacy" },
  { key: "pricing", path: "/pricing" },
  { key: "contact", path: "/contact" },
  { key: "blog", path: "/blog" },
  { key: "faq", path: "/faq" },
] as const;

export const docsRoutes = [
  { key: "docs-architecture", path: "/docs/architecture" },
  { key: "docs-security", path: "/docs/security" },
  { key: "docs-schema", path: "/docs/schema" },
  { key: "docs-api", path: "/docs/api" },
  { key: "docs-singularitycoin", path: "/docs/singularitycoin" },
] as const;

export const merchantRoutes = [
  { key: "dashboard-home", path: "/dashboard" },
  { key: "dashboard-charges", path: "/dashboard/charges" },
  { key: "dashboard-charges-new", path: "/dashboard/charges/new" },
  { key: "dashboard-reports", path: "/dashboard/reports" },
  { key: "dashboard-wallets", path: "/dashboard/wallets" },
  { key: "dashboard-wallet-transactions", path: "/dashboard/wallets/transactions" },
  { key: "dashboard-invoices", path: "/dashboard/invoices" },
  { key: "dashboard-invoices-new", path: "/dashboard/invoices/new" },
  { key: "dashboard-notifications", path: "/dashboard/notifications" },
  { key: "dashboard-settings-settlement", path: "/dashboard/settings/settlement" },
  { key: "dashboard-settings-api-keys", path: "/dashboard/settings/api-keys" },
  { key: "dashboard-settings-webhooks", path: "/dashboard/settings/webhooks" },
  { key: "dashboard-settings-addresses", path: "/dashboard/settings/addresses" },
  { key: "dashboard-settings-security", path: "/dashboard/settings/security" },
  { key: "dashboard-exports", path: "/dashboard/exports" },
  { key: "dashboard-intelligence", path: "/dashboard/intelligence" },
] as const;

export const adminRoutes = [
  { key: "admin-home", path: "/admin" },
  { key: "admin-revenue", path: "/admin/revenue" },
  { key: "admin-fees", path: "/admin/fees" },
  { key: "admin-merchants", path: "/admin/merchants" },
  { key: "admin-chains", path: "/admin/chains" },
  { key: "admin-monitoring", path: "/admin/monitoring" },
  { key: "admin-audit-log", path: "/admin/audit-log" },
  { key: "admin-wallets", path: "/admin/wallets" },
  { key: "admin-wallet-transactions", path: "/admin/wallets/transactions" },
  { key: "admin-security-policies", path: "/admin/security-policies" },
  { key: "admin-roles", path: "/admin/roles" },
  { key: "admin-notifications", path: "/admin/notifications" },
  { key: "admin-cms", path: "/admin/cms" },
  { key: "admin-cms-pages", path: "/admin/cms/pages" },
  { key: "admin-cms-blog", path: "/admin/cms/blog" },
  { key: "admin-cms-announcements", path: "/admin/cms/announcements" },
  { key: "admin-cms-faq", path: "/admin/cms/faq" },
  { key: "admin-cms-contacts", path: "/admin/cms/contacts" },
  { key: "admin-cms-social", path: "/admin/cms/social" },
  { key: "admin-cms-settings", path: "/admin/cms/settings" },
  { key: "admin-exports", path: "/admin/exports" },
  { key: "admin-intelligence", path: "/admin/intelligence" },
  { key: "admin-api-settings", path: "/admin/api-settings" },
] as const;

export const dynamicRoutes = [
  { key: "checkout", path: "/pay/:chargeId", example: "/pay/test-charge-1" },
  { key: "dashboard-charge-detail", path: "/dashboard/charges/:id", example: "/dashboard/charges/test-charge-1" },
  { key: "dashboard-invoice-detail", path: "/dashboard/invoices/:id", example: "/dashboard/invoices/test-invoice-1" },
] as const;

export const errorRoutes = [
  { key: "not-found", path: "/nonexistent-route-404" },
] as const;

export const allRoutes = [
  ...publicRoutes,
  ...docsRoutes,
  ...merchantRoutes,
  ...adminRoutes,
  ...errorRoutes,
] as const;
