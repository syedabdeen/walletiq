import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import Onboarding from "./pages/Onboarding";
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
  const [showSplash, setShowSplash] = useState(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isFirstLoad = !sessionStorage.getItem('app-loaded');
    // Skip splash on onboarding to show content immediately
    const isOnboarding = window.location.pathname === '/onboarding';
    return (isPWA || isFirstLoad) && !isOnboarding;
  });

  useEffect(() => {
    if (!showSplash) {
      sessionStorage.setItem('app-loaded', 'true');
    }
  }, [showSplash]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('app-loaded', 'true');
    setShowSplash(false);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <AuthProvider>
            <SettingsProvider>
              <TooltipProvider>
                {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/install" element={<Install />} />
                    
                    {/* Protected Customer App Routes */}
                    <Route path="/" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
                    <Route path="/expenses" element={<SubscriptionGuard><Expenses /></SubscriptionGuard>} />
                    <Route path="/reports" element={<SubscriptionGuard><Reports /></SubscriptionGuard>} />
                    <Route path="/history" element={<SubscriptionGuard><History /></SubscriptionGuard>} />
                    <Route path="/budget" element={<SubscriptionGuard><Budget /></SubscriptionGuard>} />
                    <Route path="/recurring" element={<SubscriptionGuard><Recurring /></SubscriptionGuard>} />
                    <Route path="/categories" element={<SubscriptionGuard><Categories /></SubscriptionGuard>} />
                    <Route path="/profile" element={<SubscriptionGuard><Profile /></SubscriptionGuard>} />
                    <Route path="/settings" element={<SubscriptionGuard><Settings /></SubscriptionGuard>} />
                    
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
