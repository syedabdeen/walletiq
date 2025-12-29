import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  useRecurringExpenses, 
  useCreateRecurringExpense, 
  useDeleteRecurringExpense,
  useProcessDueRecurringExpenses,
  RecurringExpense 
} from '@/hooks/useRecurringExpenses';
import { useExpenses } from '@/hooks/useExpenses';
import { useSettings } from '@/hooks/useSettings';
import { Repeat, Plus, Trash2, Loader2, Calendar, Play } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { format, isToday, isPast, isTomorrow } from 'date-fns';

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function Recurring() {
  const { data: recurringExpenses, isLoading } = useRecurringExpenses();
  const { data: expenses } = useExpenses();
  const { data: settings } = useSettings();
  const createRecurring = useCreateRecurringExpense();
  const deleteRecurring = useDeleteRecurringExpense();
  const processDue = useProcessDueRecurringExpenses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<{
    category_id: string;
    amount: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    next_due_date: string;
  }>({
    category_id: '',
    amount: '',
    description: '',
    frequency: 'monthly',
    next_due_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const currencySymbol = settings?.currency_symbol || 'د.إ';

  // Get unique categories from expenses
  const categories = expenses?.reduce((acc, e) => {
    if (e.expense_categories && !acc.find(c => c.id === e.expense_categories?.id)) {
      acc.push(e.expense_categories);
    }
    return acc;
  }, [] as Array<{ id: string; name: string; icon: string }>) || [];

  // Check for due expenses on mount
  useEffect(() => {
    const checkDue = async () => {
      const today = new Date().toISOString().split('T')[0];
      const hasDue = recurringExpenses?.some(re => 
        re.is_active && re.next_due_date <= today
      );
      if (hasDue) {
        processDue.mutate();
      }
    };
    
    if (recurringExpenses?.length) {
      checkDue();
    }
  }, [recurringExpenses]);

  const handleCreate = () => {
    createRecurring.mutate({
      category_id: newExpense.category_id || null,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      frequency: newExpense.frequency,
      next_due_date: newExpense.next_due_date,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewExpense({
          category_id: '',
          amount: '',
          description: '',
          frequency: 'monthly',
          next_due_date: format(new Date(), 'yyyy-MM-dd'),
        });
      },
    });
  };

  const getDueBadge = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isToday(date)) {
      return <Badge variant="default">Due Today</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge variant="secondary">Tomorrow</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recurring Expenses</h1>
            <p className="text-muted-foreground">Manage subscriptions & scheduled bills</p>
          </div>
          
          <div className="flex gap-2">
            {recurringExpenses?.some(re => re.is_active && re.next_due_date <= new Date().toISOString().split('T')[0]) && (
              <Button 
                variant="outline" 
                onClick={() => processDue.mutate()}
                disabled={processDue.isPending}
              >
                {processDue.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Process Due
                  </>
                )}
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recurring
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Recurring Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Netflix, Gym membership, etc."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Amount ({currencySymbol})</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newExpense.category_id} 
                      onValueChange={(v) => setNewExpense({ ...newExpense, category_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select 
                      value={newExpense.frequency} 
                      onValueChange={(v) => 
                        setNewExpense({ ...newExpense, frequency: v as 'daily' | 'weekly' | 'monthly' | 'yearly' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Next Due Date</Label>
                    <Input
                      type="date"
                      value={newExpense.next_due_date}
                      onChange={(e) => setNewExpense({ ...newExpense, next_due_date: e.target.value })}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreate} 
                    className="w-full"
                    disabled={!newExpense.description || !newExpense.amount || createRecurring.isPending}
                  >
                    {createRecurring.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add Recurring Expense'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {recurringExpenses && recurringExpenses.length > 0 ? (
          <div className="grid gap-4">
            {recurringExpenses.map((expense) => (
              <Card key={expense.id} className="animate-fade-in">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <CategoryIcon 
                        icon={expense.category?.icon || 'repeat'} 
                        className="w-5 h-5 text-secondary-foreground" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{expense.description}</h3>
                        {getDueBadge(expense.next_due_date)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{expense.category?.name || 'Uncategorized'}</span>
                        <span>•</span>
                        <span>{frequencyLabels[expense.frequency]}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(expense.next_due_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground">
                      {currencySymbol} {expense.amount.toFixed(2)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteRecurring.mutate(expense.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Repeat className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No recurring expenses</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add subscriptions and bills to track automatically
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Recurring Expense
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}