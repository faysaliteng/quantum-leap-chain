import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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

import AdminHome from "./pages/admin/AdminHome";
import MerchantManagement from "./pages/admin/MerchantManagement";
import ChainConfig from "./pages/admin/ChainConfig";
import SystemMonitoring from "./pages/admin/SystemMonitoring";
import AuditLog from "./pages/admin/AuditLog";
import FeeManagement from "./pages/admin/FeeManagement";
import RevenueDashboard from "./pages/admin/RevenueDashboard";

import CMSDashboard from "./pages/admin/cms/CMSDashboard";
import PageManager from "./pages/admin/cms/PageManager";
import BlogManager from "./pages/admin/cms/BlogManager";
import AnnouncementManager from "./pages/admin/cms/AnnouncementManager";
import FAQManager from "./pages/admin/cms/FAQManager";
import CMSSettings from "./pages/admin/cms/CMSSettings";

import CheckoutPage from "./pages/checkout/CheckoutPage";
import ArchitectureDocs from "./pages/docs/ArchitectureDocs";
import SecurityDocs from "./pages/docs/SecurityDocs";
import SchemaDocs from "./pages/docs/SchemaDocs";
import ApiDocs from "./pages/docs/ApiDocs";
import SingularityCoinDocs from "./pages/docs/SingularityCoinDocs";

import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/pay/:chargeId" element={<CheckoutPage />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

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
              </Route>

              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminHome />} />
                <Route path="revenue" element={<RevenueDashboard />} />
                <Route path="fees" element={<FeeManagement />} />
                <Route path="merchants" element={<MerchantManagement />} />
                <Route path="chains" element={<ChainConfig />} />
                <Route path="monitoring" element={<SystemMonitoring />} />
                <Route path="audit-log" element={<AuditLog />} />
                <Route path="cms" element={<CMSDashboard />} />
                <Route path="cms/pages" element={<PageManager />} />
                <Route path="cms/blog" element={<BlogManager />} />
                <Route path="cms/announcements" element={<AnnouncementManager />} />
                <Route path="cms/faq" element={<FAQManager />} />
                <Route path="cms/settings" element={<CMSSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
