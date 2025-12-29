import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHasActiveSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import walletiqLogo from '@/assets/walletiq-logo.png';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, isLoading: subLoading, subscription } = useHasActiveSubscription();

  // Redirect to onboarding if not logged in
  useEffect(() => {
    if (!authLoading && !subLoading && !user) {
      navigate('/onboarding');
    }
  }, [user, authLoading, subLoading, navigate]);

  // Still loading
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  // Has active subscription - show the app
  if (hasActiveSubscription) {
    return <>{children}</>;
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
              Your {subscription?.plan_type.replace('_', ' ')} subscription expired
              {subscription?.end_date && ` on ${format(new Date(subscription.end_date), 'PPP')}`}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Previous Plan</p>
              <p className="font-semibold capitalize">{subscription?.plan_type.replace('_', ' ') || 'None'}</p>
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
              onClick={() => {
                // Allow signing out
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
