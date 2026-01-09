import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getParamFromUrl(key: string) {
  // Supabase can return params in either query (?error=...) or hash (#error=...)
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return queryParams.get(key) || hashParams.get(key);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const errorParam = getParamFromUrl('error');
    const errorDescription = getParamFromUrl('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    if (!loading && user) {
      navigate('/', { replace: true });
      return;
    }

    const t = window.setTimeout(() => {
      setTimedOut(true);
    }, 12000);

    return () => window.clearTimeout(t);
  }, [user, loading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-xl font-semibold text-destructive">Sign-in Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/login', { replace: true })}>Back to Login</Button>
        </div>
      </div>
    );
  }

  if (timedOut && !loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-xl font-semibold">Still signing you in…</h1>
          <p className="text-muted-foreground">
            This usually means Google sign-in isn’t enabled/configured in the backend or the redirect URL isn’t allowed.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => navigate('/login', { replace: true })}>Back to Login</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}

