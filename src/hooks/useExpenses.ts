import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/defaultExpenseCategories';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  expense_date: string;
  remarks: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  expense_categories?: {
    id: string;
    name: string;
    icon: string;
  } | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ExpenseHistory {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  category_breakdown: Record<string, { name: string; amount: number }>;
  created_at: string;
}

export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const fetchCategories = async () =>
        supabase
          .from('expense_categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

      const { data, error } = await fetchCategories();
      if (error) throw error;

      // If a user has no categories yet, seed the default set once.
      if (!data || data.length === 0) {
        const { error: seedError } = await supabase.from('expense_categories').insert(
          DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
            user_id: user.id,
            name: c.name,
            icon: c.icon,
            is_default: true,
            is_active: true,
          }))
        );

        if (seedError) throw seedError;

        const { data: seeded, error: seededError } = await fetchCategories();
        if (seededError) throw seededError;
        return (seeded ?? []) as Category[];
      }

      return data as Category[];
    },
    enabled: !!user,
  });
}

export function useExpenses(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (
            id,
            name,
            icon
          )
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: {
      category_id: string;
      amount: number;
      expense_date: string;
      remarks?: string;
      attachment_url?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add expense: ' + error.message);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      category_id?: string;
      amount?: number;
      expense_date?: string;
      remarks?: string;
      attachment_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update expense: ' + error.message);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete expense: ' + error.message);
    },
  });
}

export function useExpenseHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expense-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expense_history')
        .select('*')
        .eq('user_id', user.id)
        .order('period_end', { ascending: false });

      if (error) throw error;
      return data as ExpenseHistory[];
    },
    enabled: !!user,
  });
}

export function useSaveAndResetExpenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Get all expenses in the period
      const { data: expenses, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('expense_date', periodStart)
        .lte('expense_date', periodEnd);

      if (fetchError) throw fetchError;

      if (!expenses || expenses.length === 0) {
        throw new Error('No expenses to save in this period');
      }

      // Calculate totals
      const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const categoryBreakdown: Record<string, { name: string; amount: number }> = {};

      expenses.forEach((exp) => {
        const catId = exp.category_id || 'uncategorized';
        const catName = exp.expense_categories?.name || 'Uncategorized';
        
        if (!categoryBreakdown[catId]) {
          categoryBreakdown[catId] = { name: catName, amount: 0 };
        }
        categoryBreakdown[catId].amount += Number(exp.amount);
      });

      // Save to history
      const { error: insertError } = await supabase
        .from('expense_history')
        .insert({
          user_id: user.id,
          period_start: periodStart,
          period_end: periodEnd,
          total_amount: totalAmount,
          category_breakdown: categoryBreakdown,
        });

      if (insertError) throw insertError;

      // Delete expenses in the period
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('user_id', user.id)
        .gte('expense_date', periodStart)
        .lte('expense_date', periodEnd);

      if (deleteError) throw deleteError;

      return { totalAmount, categoryBreakdown };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-history'] });
      toast.success('Expenses saved and reset successfully');
    },
    onError: (error) => {
      toast.error('Failed to save expenses: ' + error.message);
    },
  });
}
