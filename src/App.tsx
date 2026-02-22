import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import Verify2FA from "./pages/Verify2FA";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

import DashboardHome from "./pages/dashboard/DashboardHome";
import ChargesList from "./pages/dashboard/ChargesList";
import ChargeDetail from "./pages/dashboard/ChargeDetail";
import CreateCharge from "./pages/dashboard/CreateCharge";
import Reports from "./pages/dashboard/Reports";
import SettlementSettings from "./pages/dashboard/settings/SettlementSettings";
import ApiKeysSettings from "./pages/dashboard/settings/ApiKeysSettings";
import WebhookSettings from "./pages/dashboard/settings/WebhookSettings";
import AddressPool from "./pages/dashboard/settings/AddressPool";
import SecuritySettings from "./pages/dashboard/settings/SecuritySettings";
import MerchantWallets from "./pages/dashboard/MerchantWallets";
import InvoicesList from "./pages/dashboard/InvoicesList";
import CreateInvoice from "./pages/dashboard/CreateInvoice";
import InvoiceDetail from "./pages/dashboard/InvoiceDetail";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import WalletTransactionHistory from "./pages/dashboard/WalletTransactionHistory";

import AdminHome from "./pages/admin/AdminHome";
import MerchantManagement from "./pages/admin/MerchantManagement";
import ChainConfig from "./pages/admin/ChainConfig";
import SystemMonitoring from "./pages/admin/SystemMonitoring";
import AuditLog from "./pages/admin/AuditLog";
import FeeManagement from "./pages/admin/FeeManagement";
import RevenueDashboard from "./pages/admin/RevenueDashboard";
import AdminWalletManagement from "./pages/admin/WalletManagement";
import AdminSecurityPolicies from "./pages/admin/SecurityPolicies";
import AdminRoleManagement from "./pages/admin/RoleManagement";
import AdminWalletTransactions from "./pages/admin/WalletTransactions";

import CMSDashboard from "./pages/admin/cms/CMSDashboard";
import PageManager from "./pages/admin/cms/PageManager";
import BlogManager from "./pages/admin/cms/BlogManager";
import AnnouncementManager from "./pages/admin/cms/AnnouncementManager";
import FAQManager from "./pages/admin/cms/FAQManager";
import CMSSettings from "./pages/admin/cms/CMSSettings";
import ContactSubmissions from "./pages/admin/cms/ContactSubmissions";
import SocialLinksManager from "./pages/admin/cms/SocialLinksManager";

import CheckoutPage from "./pages/checkout/CheckoutPage";
import ArchitectureDocs from "./pages/docs/ArchitectureDocs";
import SecurityDocs from "./pages/docs/SecurityDocs";
import SchemaDocs from "./pages/docs/SchemaDocs";
import ApiDocs from "./pages/docs/ApiDocs";
import SingularityCoinDocs from "./pages/docs/SingularityCoinDocs";

import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <OfflineBanner />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-2fa" element={<Verify2FA />} />
              <Route path="/pay/:chargeId" element={<CheckoutPage />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/faq" element={<FAQ />} />

              <Route path="/docs/architecture" element={<ArchitectureDocs />} />
              <Route path="/docs/security" element={<SecurityDocs />} />
              <Route path="/docs/schema" element={<SchemaDocs />} />
              <Route path="/docs/api" element={<ApiDocs />} />
              <Route path="/docs/singularitycoin" element={<SingularityCoinDocs />} />

              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="charges" element={<ChargesList />} />
                <Route path="charges/new" element={<CreateCharge />} />
                <Route path="charges/:id" element={<ChargeDetail />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings/settlement" element={<SettlementSettings />} />
                <Route path="settings/api-keys" element={<ApiKeysSettings />} />
                <Route path="settings/webhooks" element={<WebhookSettings />} />
                <Route path="settings/addresses" element={<AddressPool />} />
                <Route path="settings/security" element={<SecuritySettings />} />
                <Route path="wallets" element={<MerchantWallets />} />
                <Route path="wallets/transactions" element={<WalletTransactionHistory />} />
                <Route path="invoices" element={<InvoicesList />} />
                <Route path="invoices/new" element={<CreateInvoice />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminHome />} />
                <Route path="revenue" element={<RevenueDashboard />} />
                <Route path="fees" element={<FeeManagement />} />
                <Route path="merchants" element={<MerchantManagement />} />
                <Route path="chains" element={<ChainConfig />} />
                <Route path="monitoring" element={<SystemMonitoring />} />
                <Route path="audit-log" element={<AuditLog />} />
                <Route path="wallets" element={<AdminWalletManagement />} />
                <Route path="wallets/transactions" element={<AdminWalletTransactions />} />
                <Route path="security-policies" element={<AdminSecurityPolicies />} />
                <Route path="roles" element={<AdminRoleManagement />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="cms" element={<CMSDashboard />} />
                <Route path="cms/pages" element={<PageManager />} />
                <Route path="cms/blog" element={<BlogManager />} />
                <Route path="cms/announcements" element={<AnnouncementManager />} />
                <Route path="cms/faq" element={<FAQManager />} />
                <Route path="cms/contacts" element={<ContactSubmissions />} />
                <Route path="cms/social" element={<SocialLinksManager />} />
                <Route path="cms/settings" element={<CMSSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
