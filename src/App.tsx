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
    return isPWA || isFirstLoad;
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
                    {/* Customer App Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/budget" element={<Budget />} />
                    <Route path="/recurring" element={<Recurring />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/install" element={<Install />} />
                    
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
