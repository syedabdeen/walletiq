import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { ResetExpensesModal } from '@/components/modals/ResetExpensesModal';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, BarChart3 } from 'lucide-react';
import { useExpenses, useDeleteExpense, type Expense } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch profile for personalized greeting
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAddModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExpense.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    const name = profile?.full_name || user?.user_metadata?.full_name || '';
    const firstName = name ? name.split(' ')[0] : '';
    
    let timeGreeting: string;
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }
    
    return firstName ? `${timeGreeting}, ${firstName}!` : `${timeGreeting}!`;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* PWA Install Banner */}
        <InstallBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground animate-fade-in">
              {greeting()} 👋
            </h1>
            <p className="text-muted-foreground">
              Here's your expense overview
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
            <Button variant="outline" onClick={() => setResetModalOpen(true)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/reports">
                <BarChart3 className="w-4 h-4" />
                Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StatsCards expenses={expenses} />

        {/* Charts & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseChart expenses={expenses} />
          <RecentExpenses
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteId(id)}
          />
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      <ResetExpensesModal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
      />

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}