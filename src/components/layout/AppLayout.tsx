import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import walletiqLogo from '@/assets/walletiq-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  // Fetch fresh profile name from database for mobile header
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get first name for compact display
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName ? fullName.split(' ')[0] : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex fixed left-0 top-0 bottom-0 w-64" />
      
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={walletiqLogo} alt="WalletIQ" className="w-8 h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm leading-tight">WalletIQ</span>
              {firstName && (
                <span className="text-xs text-muted-foreground leading-tight">Hi, {firstName}</span>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      {/* Main content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
}