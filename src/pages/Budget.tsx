import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBudgetGoals, useCreateBudgetGoal, useDeleteBudgetGoal, BudgetGoal } from '@/hooks/useBudgetGoals';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { Target, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Budget() {
  const { data: budgetGoals, isLoading: goalsLoading } = useBudgetGoals();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: settings } = useSettings();
  const createBudgetGoal = useCreateBudgetGoal();
  const deleteBudgetGoal = useDeleteBudgetGoal();
  
  // Initialize budget alerts on app open
  useBudgetAlerts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    category_id: '',
    monthly_limit: '',
    alert_threshold: '80',
  });

  const currencySymbol = settings?.currency_symbol || 'د.إ';
  const isLoading = goalsLoading || expensesLoading || categoriesLoading;

  // Calculate current month spending per category
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  
  const monthlySpending = expenses?.reduce((acc, expense) => {
    const expenseDate = new Date(expense.expense_date);
    if (expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd) {
      const categoryId = expense.category_id || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + Number(expense.amount);
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const totalMonthlySpending = Object.values(monthlySpending).reduce((a, b) => a + b, 0);

  // Find overall budget (category_id is null)
  const overallBudget = budgetGoals?.find(g => !g.category_id);
  const categoryBudgets = budgetGoals?.filter(g => g.category_id) || [];

  const handleCreateGoal = () => {
    createBudgetGoal.mutate({
      category_id: newGoal.category_id === 'overall' ? null : newGoal.category_id,
      monthly_limit: parseFloat(newGoal.monthly_limit),
      alert_threshold: parseInt(newGoal.alert_threshold),
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewGoal({ category_id: '', monthly_limit: '', alert_threshold: '80' });
      },
    });
  };

  const getSpendingPercentage = (goal: BudgetGoal) => {
    const spent = goal.category_id 
      ? monthlySpending[goal.category_id] || 0
      : totalMonthlySpending;
    return Math.min((spent / goal.monthly_limit) * 100, 100);
  };

  const getSpentAmount = (goal: BudgetGoal) => {
    return goal.category_id 
      ? monthlySpending[goal.category_id] || 0
      : totalMonthlySpending;
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
            <h1 className="text-2xl font-bold text-foreground">Budget Goals</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'MMMM yyyy')} spending limits
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Budget Type</Label>
                  <Select 
                    value={newGoal.category_id} 
                    onValueChange={(v) => setNewGoal({ ...newGoal, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Overall Monthly Budget</SelectItem>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon icon={cat.icon || 'folder'} className="w-4 h-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Monthly Limit ({currencySymbol})</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={newGoal.monthly_limit}
                    onChange={(e) => setNewGoal({ ...newGoal, monthly_limit: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Alert at (%)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    min="1"
                    max="100"
                    value={newGoal.alert_threshold}
                    onChange={(e) => setNewGoal({ ...newGoal, alert_threshold: e.target.value })}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateGoal} 
                  className="w-full"
                  disabled={!newGoal.category_id || !newGoal.monthly_limit || createBudgetGoal.isPending}
                >
                  {createBudgetGoal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Goal'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Budget */}
        {overallBudget && (
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Overall Monthly Budget</CardTitle>
                    <CardDescription>
                      {currencySymbol} {getSpentAmount(overallBudget).toFixed(2)} / {currencySymbol} {overallBudget.monthly_limit.toFixed(2)}
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteBudgetGoal.mutate(overallBudget.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress 
                  value={getSpendingPercentage(overallBudget)} 
                  className={getSpendingPercentage(overallBudget) >= overallBudget.alert_threshold ? 'bg-destructive/20' : ''}
                />
                {getSpendingPercentage(overallBudget) >= overallBudget.alert_threshold && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span>You've reached {getSpendingPercentage(overallBudget).toFixed(0)}% of your budget!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Budgets */}
        {categoryBudgets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {categoryBudgets.map((goal) => {
              const percentage = getSpendingPercentage(goal);
              const isWarning = percentage >= goal.alert_threshold;
              
              return (
                <Card key={goal.id} className="animate-fade-in">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/50">
                          <CategoryIcon icon={goal.category?.icon || 'folder'} className="w-5 h-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{goal.category?.name || 'Unknown'}</CardTitle>
                          <CardDescription className="text-sm">
                            {currencySymbol} {getSpentAmount(goal).toFixed(2)} / {currencySymbol} {goal.monthly_limit.toFixed(2)}
                          </CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteBudgetGoal.mutate(goal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress 
                        value={percentage}
                        className={isWarning ? 'bg-destructive/20' : ''}
                      />
                      {isWarning && (
                        <div className="flex items-center gap-2 text-xs text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{percentage.toFixed(0)}% used</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!budgetGoals?.length && (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No budget goals yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Set spending limits to track your monthly expenses
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}