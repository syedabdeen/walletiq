import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useSettingsContext } from '@/contexts/SettingsContext';

interface StatsCardsProps {
  expenses: Array<{ amount: number; expense_date: string }>;
}

export function StatsCards({ expenses }: StatsCardsProps) {
  const { currencyCode } = useSettingsContext();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthExpenses = expenses.filter((exp) => {
    const date = new Date(exp.expense_date);
    return date >= monthStart && date <= monthEnd;
  });

  const totalThisMonth = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalAll = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const avgPerDay = currentMonthExpenses.length > 0 
    ? totalThisMonth / new Date().getDate() 
    : 0;

  const stats = [
    {
      label: 'This Month',
      value: totalThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      icon: Calendar,
      suffix: currencyCode,
      trend: null,
    },
    {
      label: 'Total Expenses',
      value: totalAll.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      icon: Wallet,
      suffix: currencyCode,
      trend: null,
    },
    {
      label: 'Daily Average',
      value: avgPerDay.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      icon: TrendingUp,
      suffix: currencyCode,
      trend: null,
    },
    {
      label: 'Transactions',
      value: currentMonthExpenses.length.toString(),
      icon: TrendingDown,
      suffix: 'this month',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          className="overflow-hidden animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
