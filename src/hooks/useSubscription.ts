import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type SubscriptionType = 'free_trial' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface SubscriptionPlan {
  id: string;
  plan_type: SubscriptionType;
  name: string;
  description: string | null;
  price: number;
  currency_code: string;
  duration_days: number;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_type: SubscriptionType;
  status: SubscriptionStatus;
  amount_paid: number;
  start_date: string;
  end_date: string;
  is_renewal: boolean;
  created_at: string;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useUserSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user,
  });
}

export function useHasActiveSubscription() {
  const { data: subscription, isLoading } = useUserSubscription();
  
  const isActive = subscription 
    ? subscription.status === 'active' && new Date(subscription.end_date) > new Date()
    : false;

  return { hasActiveSubscription: isActive, isLoading, subscription };
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ planType, amountPaid }: { planType: SubscriptionType; amountPaid: number }) => {
      if (!user) throw new Error('User not authenticated');

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
          user_id: user.id,
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
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast.success('Subscription activated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to activate subscription: ' + error.message);
    },
  });
}

export function useActiveOffers() {
  return useQuery({
    queryKey: ['active-offers'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('subscription_offers')
        .select('*')
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now);

      if (error) throw error;
      return data;
    },
  });
}
