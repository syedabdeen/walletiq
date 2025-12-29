import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BudgetGoal {
  id: string;
  user_id: string;
  category_id: string | null;
  monthly_limit: number;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export function useBudgetGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_goals')
        .select(`
          *,
          category:expense_categories(id, name, icon)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BudgetGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateBudgetGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: {
      category_id: string | null;
      monthly_limit: number;
      alert_threshold: number;
    }) => {
      const { data, error } = await supabase
        .from('budget_goals')
        .insert({
          user_id: user!.id,
          category_id: goal.category_id,
          monthly_limit: goal.monthly_limit,
          alert_threshold: goal.alert_threshold,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Budget goal created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateBudgetGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('budget_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Budget goal updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteBudgetGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Budget goal deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}