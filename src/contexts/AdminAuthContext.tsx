import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  markPasswordChanged: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('role, must_change_password')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (error || !data) {
      setIsSuperAdmin(false);
      setMustChangePassword(false);
      return false;
    }

    setIsSuperAdmin(true);
    setMustChangePassword(data.must_change_password);
    return true;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsSuperAdmin(false);
          setMustChangePassword(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error as Error };
    }

    if (data.user) {
      const isAdmin = await checkAdminStatus(data.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        return { error: new Error('Access denied. Admin privileges required.') };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsSuperAdmin(false);
    setMustChangePassword(false);
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const markPasswordChanged = async () => {
    if (!user) return;
    
    await supabase
      .from('admin_roles')
      .update({ must_change_password: false })
      .eq('user_id', user.id);
    
    setMustChangePassword(false);
  };

  return (
    <AdminAuthContext.Provider value={{
      user,
      session,
      loading,
      isSuperAdmin,
      mustChangePassword,
      signIn,
      signOut,
      updatePassword,
      markPasswordChanged,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
