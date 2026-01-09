import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/hooks/useDeviceId';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  deviceBlocked: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceBlocked, setDeviceBlocked] = useState(false);

  const checkDeviceAccess = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase.rpc('check_device_access', {
        _user_id: userId,
        _device_id: deviceId,
      });

      if (error) {
        console.error('Device check error:', error);
        return true; // Allow on error to not block users
      }

      const result = data as unknown as { allowed: boolean; reason: string };
      
      if (!result.allowed) {
        toast.error('This account is already registered on another device. Please use the original device to access your account.');
        setDeviceBlocked(true);
        await supabase.auth.signOut();
        return false;
      }

      setDeviceBlocked(false);
      return true;
    } catch (err) {
      console.error('Device check error:', err);
      return true; // Allow on error
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        // Check device access
        const allowed = await checkDeviceAccess(session.user.id);
        if (!allowed) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);

      // Avoid ending loading early during the initial bootstrap.
      if (event !== 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    // Bootstrap session (also handles OAuth callback tokens in the URL)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        const allowed = await checkDeviceAccess(session.user.id);
        if (!allowed) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkDeviceAccess]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const isEmbeddedPreview = window.self !== window.top;

    // Google blocks OAuth flows initiated from embedded/sandboxed iframes.
    // In that case we fail fast with a clear message so users can open the app directly in a normal tab.
    if (isEmbeddedPreview) {
      return {
        error: new Error(
          'Google sign-in is blocked inside the embedded preview. Open the app URL in a normal browser tab (not inside the editor) and try again.'
        ),
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, deviceBlocked, signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
