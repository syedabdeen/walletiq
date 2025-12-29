import { useEffect, useRef } from 'react';
import { useBudgetGoals } from './useBudgetGoals';
import { useExpenses } from './useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth } from 'date-fns';

export function useBudgetAlerts() {
  const { user } = useAuth();
  const { data: budgetGoals } = useBudgetGoals();
  const { data: expenses } = useExpenses();
  const hasShownAlerts = useRef(false);

  useEffect(() => {
    // Only run once per session when data is loaded
    if (!user || !budgetGoals || !expenses || hasShownAlerts.current) return;
    
    // Check if already shown this session
    const sessionKey = `budget-alerts-shown-${user.id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    // Calculate spending per category
    const monthlySpending = expenses.reduce((acc, expense) => {
      const expenseDate = new Date(expense.expense_date);
      if (expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd) {
        const categoryId = expense.category_id || 'uncategorized';
        acc[categoryId] = (acc[categoryId] || 0) + Number(expense.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    const totalMonthlySpending = Object.values(monthlySpending).reduce((a, b) => a + b, 0);

    // Check each budget goal
    const alerts: Array<{ name: string; percentage: number }> = [];

    budgetGoals.forEach((goal) => {
      const spent = goal.category_id 
        ? monthlySpending[goal.category_id] || 0
        : totalMonthlySpending;
      
      const percentage = (spent / goal.monthly_limit) * 100;
      
      if (percentage >= goal.alert_threshold) {
        const name = goal.category_id 
          ? goal.category?.name || 'Category'
          : 'Overall Budget';
        alerts.push({ name, percentage: Math.min(percentage, 100) });
      }
    });

    // Show alerts
    if (alerts.length > 0) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        alerts.forEach((alert, index) => {
          setTimeout(() => {
            toast.warning(`Budget Alert: ${alert.name}`, {
              description: `You've used ${alert.percentage.toFixed(0)}% of your budget limit!`,
              duration: 6000,
            });
          }, index * 1000); // Stagger notifications
        });
      }, 1500);
    }

    hasShownAlerts.current = true;
    sessionStorage.setItem(sessionKey, 'true');
  }, [user, budgetGoals, expenses]);
}
