import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export function useRecurringExpenses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
          *,
          category:expense_categories(id, name, icon)
        `)
        .eq('user_id', user!.id)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      return data as RecurringExpense[];
    },
    enabled: !!user,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: {
      category_id: string | null;
      amount: number;
      description: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      next_due_date: string;
    }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({
          user_id: user!.id,
          ...expense,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast.success('Recurring expense created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast.success('Recurring expense updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast.success('Recurring expense deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useProcessDueRecurringExpenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all due recurring expenses
      const { data: dueExpenses, error: fetchError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .lte('next_due_date', today);

      if (fetchError) throw fetchError;
      if (!dueExpenses || dueExpenses.length === 0) return { processed: 0 };

      // Create expenses for each due recurring expense
      const expensesToInsert = dueExpenses.map(re => ({
        user_id: user!.id,
        category_id: re.category_id,
        amount: re.amount,
        expense_date: re.next_due_date,
        remarks: `[Recurring] ${re.description}`,
      }));

      const { error: insertError } = await supabase
        .from('expenses')
        .insert(expensesToInsert);

      if (insertError) throw insertError;

      // Update next_due_date for each recurring expense
      for (const re of dueExpenses) {
        const nextDate = calculateNextDueDate(re.next_due_date, re.frequency);
        await supabase
          .from('recurring_expenses')
          .update({ next_due_date: nextDate })
          .eq('id', re.id);
      }

      return { processed: dueExpenses.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (result.processed > 0) {
        toast.success(`Processed ${result.processed} recurring expense(s)`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

function calculateNextDueDate(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
}