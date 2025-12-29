import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useSettingsContext } from '@/contexts/SettingsContext';
import type { Expense } from '@/hooks/useExpenses';

interface RecentExpensesProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function RecentExpenses({ expenses, onEdit, onDelete }: RecentExpensesProps) {
  const { formatAmount } = useSettingsContext();
  const recentExpenses = expenses.slice(0, 5);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {recentExpenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No expenses yet. Add your first expense!
          </p>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CategoryIcon 
                      icon={expense.expense_categories?.icon || 'folder'} 
                      className="w-4 h-4 text-primary" 
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {expense.expense_categories?.name || 'Uncategorized'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatAmount(Number(expense.amount))}
                    </p>
                    {expense.remarks && (
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {expense.remarks}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(expense)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
