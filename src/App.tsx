import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OAuthCallback from "./pages/OAuthCallback";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import Budget from "./pages/Budget";
import Recurring from "./pages/Recurring";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";
// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminChangePassword from "./pages/admin/AdminChangePassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminReports from "./pages/admin/AdminReports";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <AuthProvider>
            <SettingsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppErrorBoundary>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/auth/callback" element={<OAuthCallback />} />
                      <Route path="/login" element={<Auth />} />
                      <Route path="/install" element={<Install />} />

                      {/* Back-compat: old subscription/pricing URLs now always go to login */}
                      <Route path="/subscription" element={<Navigate to="/auth" replace />} />
                      <Route path="/subscriptions" element={<Navigate to="/auth" replace />} />
                      <Route path="/pricing" element={<Navigate to="/auth" replace />} />
                      <Route path="/plans" element={<Navigate to="/auth" replace />} />
                      <Route path="/subscribe" element={<Navigate to="/auth" replace />} />

                      {/* Protected Customer App Routes */}
                      <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
                      <Route path="/expenses" element={<AuthGuard><Expenses /></AuthGuard>} />
                      <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
                      <Route path="/history" element={<AuthGuard><History /></AuthGuard>} />
                      <Route path="/budget" element={<AuthGuard><Budget /></AuthGuard>} />
                      <Route path="/recurring" element={<AuthGuard><Recurring /></AuthGuard>} />
                      <Route path="/categories" element={<AuthGuard><Categories /></AuthGuard>} />
                      <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />

                      {/* Super Admin Routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/change-password" element={<AdminChangePassword />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/offers" element={<AdminOffers />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                      <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppErrorBoundary>
                </BrowserRouter>
              </TooltipProvider>
            </SettingsProvider>
          </AuthProvider>
        </AdminAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
