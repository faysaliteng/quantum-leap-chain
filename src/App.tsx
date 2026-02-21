import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
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

import CheckoutPage from "./pages/checkout/CheckoutPage";
import ArchitectureDocs from "./pages/docs/ArchitectureDocs";
import SecurityDocs from "./pages/docs/SecurityDocs";
import SchemaDocs from "./pages/docs/SchemaDocs";
import ApiDocs from "./pages/docs/ApiDocs";

import NotFound from "./pages/NotFound";

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
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pay/:chargeId" element={<CheckoutPage />} />

              <Route path="/docs/architecture" element={<ArchitectureDocs />} />
              <Route path="/docs/security" element={<SecurityDocs />} />
              <Route path="/docs/schema" element={<SchemaDocs />} />
              <Route path="/docs/api" element={<ApiDocs />} />

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
                <Route path="merchants" element={<MerchantManagement />} />
                <Route path="chains" element={<ChainConfig />} />
                <Route path="monitoring" element={<SystemMonitoring />} />
                <Route path="audit-log" element={<AuditLog />} />
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
