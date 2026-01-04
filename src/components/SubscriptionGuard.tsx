import { ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCreateSubscription, useHasActiveSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import walletiqLogo from '@/assets/walletiq-logo.png';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, isLoading: subLoading, subscription } = useHasActiveSubscription();
  const createSubscription = useCreateSubscription();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [bootstrappingTrial, setBootstrappingTrial] = useState(false);
  const [stuckLoading, setStuckLoading] = useState(false);


  // Prevent infinite retry loops if trial activation fails.
  const autoTrialAttemptedForUser = useRef<string | null>(null);

  useEffect(() => {
    autoTrialAttemptedForUser.current = null;
  }, [user?.id]);

  // Check if user is super admin (bypass subscription check)
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setAdminLoading(false);
        return;
      }

      const { data } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      setIsSuperAdmin(!!data);
      setAdminLoading(false);
    };

    if (!authLoading) {
      checkSuperAdmin();
    }
  }, [user, authLoading]);
  // Auto-start free trial for brand-new users (no subscription yet)
  useEffect(() => {
    if (authLoading || subLoading || adminLoading) return;
    if (!user || isSuperAdmin) return;
    if (subscription !== null) return; // null = no subscription row, undefined = still loading
    if (bootstrappingTrial || createSubscription.isPending) return;
    if (autoTrialAttemptedForUser.current === user.id) return;

    autoTrialAttemptedForUser.current = user.id;
    setBootstrappingTrial(true);

    createSubscription
      .mutateAsync({ planType: 'free_trial', amountPaid: 0 })
      .catch(() => {
        // If it fails, we'll show the onboarding CTA below.
      })
      .finally(() => setBootstrappingTrial(false));
  }, [
    user,
    subscription,
    isSuperAdmin,
    authLoading,
    subLoading,
    adminLoading,
    bootstrappingTrial,
    createSubscription,
  ]);

  const isGateLoading = authLoading || subLoading || adminLoading || bootstrappingTrial || createSubscription.isPending;

  useEffect(() => {
    if (!isGateLoading) {
      setStuckLoading(false);
      return;
    }
    const t = window.setTimeout(() => setStuckLoading(true), 8000);
    return () => window.clearTimeout(t);
  }, [isGateLoading]);

  // If not authenticated, immediately send to login (after all hooks are declared).
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }


  // Still loading
  if (isGateLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>

          {stuckLoading && (
            <Card className="glass border-border/30">
              <CardHeader>
                <CardTitle>Still loading…</CardTitle>
                <CardDescription>
                  This usually means an old cached build or a stalled request. Use the buttons below to recover.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="gradient" onClick={() => (window.location.href = '/auth')}>
                  Go to Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button className="w-full" variant="outline" onClick={() => (window.location.href = '/auth?resetCache=1')}>
                  Reset Cache & Reload
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/auth';
                  }}
                >
                  Sign out
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>authLoading: {String(authLoading)}</div>
                  <div>subLoading: {String(subLoading)}</div>
                  <div>adminLoading: {String(adminLoading)}</div>
                  <div>bootstrappingTrial: {String(bootstrappingTrial)}</div>
                  <div>creatingSubscription: {String(createSubscription.isPending)}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Not logged in - show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Super admin bypasses subscription check
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Has active subscription - show the app
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // No subscription yet (new user) - start trial or choose a plan
  if (subscription === null) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img src={walletiqLogo} alt="WalletIQ" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">Welcome to WalletIQ</h1>
            <p className="text-primary-foreground/70">Start with your free trial to continue</p>
          </div>

          <Card className="glass border-border/30">
            <CardHeader className="text-center">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Your free trial will be activated automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => createSubscription.mutate({ planType: 'free_trial', amountPaid: 0 })}
                disabled={createSubscription.isPending}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding')}>
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Subscription expired - show renewal screen
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src={walletiqLogo} alt="WalletIQ" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">Subscription Required</h1>
          <p className="text-primary-foreground/70">Your subscription has expired</p>
        </div>

        <Card className="glass border-border/30">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Your {subscription?.plan_type?.replace('_', ' ')} subscription expired
              {subscription?.end_date && ` on ${format(new Date(subscription.end_date), 'PPP')}`}. 
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Previous Plan</p>
              <p className="font-semibold capitalize">{subscription?.plan_type?.replace('_', ' ') || 'None'}</p>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={() => navigate('/onboarding')}
            >
              Renew Subscription
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                // Sign out first, then redirect to auth
                const { supabase } = await import('@/integrations/supabase/client');
                await supabase.auth.signOut();
                navigate('/auth');
              }}
            >
              Sign in with different account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
