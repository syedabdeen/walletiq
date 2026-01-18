import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionType, SubscriptionStatus } from './useSubscription';

// Subscription Plans Management
export function useAllSubscriptionPlans() {
  return useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ price: number; duration_days: number; is_active: boolean; description: string }> }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('Plan updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update plan: ' + error.message);
    },
  });
}

// System Settings
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
      });
      return settings;
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(`"${value}"`) })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update setting: ' + error.message);
    },
  });
}

// User & Subscription Monitoring
export interface UserDevice {
  device_id: string;
  registered_at: string;
  last_seen_at: string;
}

export interface UserWithSubscription {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  is_whitelisted: boolean;
  subscription: {
    plan_type: SubscriptionType;
    status: SubscriptionStatus;
    amount_paid: number;
    start_date: string;
    end_date: string;
  } | null;
  device: UserDevice | null;
}

export function useAllUsersWithSubscriptions() {
  return useQuery({
    queryKey: ['admin-users-subscriptions'],
    queryFn: async () => {
      // Fetch profiles, subscriptions, and devices in parallel
      const [profilesResult, subscriptionsResult, devicesResult] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, created_at, is_whitelisted'),
        supabase.from('user_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('user_devices').select('user_id, device_id, registered_at, last_seen_at'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (subscriptionsResult.error) throw subscriptionsResult.error;
      if (devicesResult.error) throw devicesResult.error;

      // Create a device map for quick lookup
      const deviceMap = new Map<string, UserDevice>();
      devicesResult.data?.forEach(device => {
        deviceMap.set(device.user_id, {
          device_id: device.device_id,
          registered_at: device.registered_at,
          last_seen_at: device.last_seen_at,
        });
      });

      // Combine the data
      const userMap = new Map<string, UserWithSubscription>();
      
      profilesResult.data?.forEach(profile => {
        userMap.set(profile.user_id, {
          id: profile.user_id,
          email: '',
          created_at: profile.created_at,
          full_name: profile.full_name,
          is_whitelisted: profile.is_whitelisted ?? false,
          subscription: null,
          device: deviceMap.get(profile.user_id) || null,
        });
      });

      // Add subscription data (take the most recent one per user)
      subscriptionsResult.data?.forEach(sub => {
        const existing = userMap.get(sub.user_id);
        if (existing && !existing.subscription) {
          existing.subscription = {
            plan_type: sub.plan_type as SubscriptionType,
            status: sub.status as SubscriptionStatus,
            amount_paid: sub.amount_paid,
            start_date: sub.start_date,
            end_date: sub.end_date,
          };
        }
      });

      return Array.from(userMap.values());
    },
  });
}

// Offers Management
export function useAllOffers() {
  return useQuery({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: {
      name: string;
      description?: string;
      discount_percent: number;
      applicable_plans: SubscriptionType[];
      for_new_subscribers: boolean;
      for_existing_subscribers: boolean;
      valid_from: string;
      valid_until: string;
    }) => {
      const { data, error } = await supabase
        .from('subscription_offers')
        .insert(offer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      toast.success('Offer created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create offer: ' + error.message);
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ is_active: boolean; discount_percent: number; valid_until: string }> }) => {
      const { data, error } = await supabase
        .from('subscription_offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      toast.success('Offer updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update offer: ' + error.message);
    },
  });
}

// Audit Logs
export function useAuditLogs() {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      action: string;
      entity_type: string;
      entity_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

// Analytics & Reporting
export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const stats = {
        totalUsers: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        trialUsers: 0,
        monthlyUsers: 0,
        yearlyUsers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
      };

      const uniqueUsers = new Set<string>();

      subscriptions?.forEach(sub => {
        uniqueUsers.add(sub.user_id);
        
        const isActive = sub.status === 'active' && new Date(sub.end_date) > now;
        
        if (isActive) {
          stats.activeSubscriptions++;
          if (sub.plan_type === 'free_trial') stats.trialUsers++;
          if (sub.plan_type === 'monthly') stats.monthlyUsers++;
          if (sub.plan_type === 'yearly') stats.yearlyUsers++;
        } else {
          stats.expiredSubscriptions++;
        }

        stats.totalRevenue += Number(sub.amount_paid);
        if (sub.plan_type === 'monthly') stats.monthlyRevenue += Number(sub.amount_paid);
        if (sub.plan_type === 'yearly') stats.yearlyRevenue += Number(sub.amount_paid);
      });

      stats.totalUsers = uniqueUsers.size;

      return stats;
    },
  });
}

// Admin user subscription management
export function useActivateUserSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, planType, amountPaid }: { userId: string; planType: SubscriptionType; amountPaid: number }) => {
      // Get the plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_type', planType)
        .eq('is_active', true)
        .single();

      if (planError || !plan) throw new Error('Plan not found');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          plan_type: planType,
          status: 'active',
          amount_paid: amountPaid,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-subscriptions'] });
      toast.success('Subscription activated successfully');
    },
    onError: (error) => {
      toast.error('Failed to activate subscription: ' + error.message);
    },
  });
}

// Update user profile (admin)
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-subscriptions'] });
      toast.success('User profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
}

// Delete user (admin) - uses edge function
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-subscriptions'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + error.message);
    },
  });
}

// Reset user device (unwhitelist - allows login from new device)
export function useResetUserDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-subscriptions'] });
      toast.success('Device lock reset - user can login from any device');
    },
    onError: (error) => {
      toast.error('Failed to reset device: ' + error.message);
    },
  });
}

// Toggle user whitelist status (whitelisted users can login from any device)
export function useToggleUserWhitelist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isWhitelisted }: { userId: string; isWhitelisted: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_whitelisted: isWhitelisted })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { isWhitelisted }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-subscriptions'] });
      toast.success(isWhitelisted 
        ? 'User whitelisted - can now login from any device' 
        : 'User removed from whitelist - restricted to registered device'
      );
    },
    onError: (error) => {
      toast.error('Failed to update whitelist status: ' + error.message);
    },
  });
}
