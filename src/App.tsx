import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { AdminAuthTest } from "./pages/AdminAuthTest";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import TestLogin from "./pages/TestLogin";
import ProductTest from "./pages/ProductTest";
import StorageTest from "./pages/StorageTest";
import SupabaseConnectionTest from "./pages/SupabaseConnectionTest";
import TestProductImages from "./pages/TestProductImages";
import SmartSizingManager from "./components/admin/SmartSizingManager";
import { autoDebugIfNeeded } from "@/utils/deploymentDebug";

const queryClient = new QueryClient();

// Auto-run deployment diagnostics if needed
autoDebugIfNeeded();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/test" element={<TestLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminDashboard />} />
              <Route path="/admin/collections" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminDashboard />} />
              <Route path="/admin/stripe-orders" element={<AdminDashboard />} />
              <Route path="/admin/customers" element={<AdminDashboard />} />
              <Route path="/admin/inventory" element={<AdminDashboard />} />
              <Route path="/admin/weddings" element={<AdminDashboard />} />
              <Route path="/admin/events" element={<AdminDashboard />} />
              <Route path="/admin/custom-orders" element={<AdminDashboard />} />
              <Route path="/admin/reviews" element={<AdminDashboard />} />
              <Route path="/admin/search" element={<AdminDashboard />} />
              <Route path="/admin/search-analytics" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<AdminDashboard />} />
              <Route path="/admin/integrations" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<AdminDashboard />} />
              <Route path="/admin/email-analytics" element={<AdminDashboard />} />
              <Route path="/admin/revenue-forecast" element={<AdminDashboard />} />
              <Route path="/admin/ai-recommendations" element={<AdminDashboard />} />
              <Route path="/admin/predictive-analytics" element={<AdminDashboard />} />
              <Route path="/admin/customer-lifetime-value" element={<AdminDashboard />} />
              <Route path="/admin/ab-testing" element={<AdminDashboard />} />
              <Route path="/admin/inventory-forecasting" element={<AdminDashboard />} />
              <Route path="/admin/automation" element={<AdminDashboard />} />
              <Route path="/admin/test-auth" element={<AdminAuthTest />} />
              <Route path="/product-test" element={<ProductTest />} />
              <Route path="/storage-test" element={<StorageTest />} />
              <Route path="/supabase-test" element={<SupabaseConnectionTest />} />
              <Route path="/test-images" element={<TestProductImages />} />
              <Route path="/admin/sizing" element={<SmartSizingManager />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
