import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExpenses, useCategories } from '@/hooks/useExpenses';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsContext } from '@/contexts/SettingsContext';

const COLORS = [
  'hsl(168, 76%, 36%)',
  'hsl(180, 70%, 32%)',
  'hsl(200, 60%, 45%)',
  'hsl(220, 50%, 50%)',
  'hsl(260, 45%, 55%)',
  'hsl(300, 40%, 50%)',
  'hsl(340, 50%, 55%)',
  'hsl(20, 70%, 50%)',
  'hsl(45, 80%, 50%)',
  'hsl(100, 50%, 45%)',
];

export default function Reports() {
  const { currencyCode, formatAmount } = useSettingsContext();
  const now = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(now));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(now));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: categories = [] } = useCategories();
  const { data: expenses = [], isLoading } = useExpenses(
    startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate ? format(endDate, 'yyyy-MM-dd') : undefined
  );

  const filteredExpenses = categoryFilter === 'all'
    ? expenses
    : expenses.filter((exp) => exp.category_id === categoryFilter);

  // Calculate category totals
  const categoryTotals: Record<string, { name: string; amount: number; icon: string }> = {};
  filteredExpenses.forEach((exp) => {
    const catId = exp.expense_categories?.id || 'uncategorized';
    const catName = exp.expense_categories?.name || 'Uncategorized';
    const catIcon = exp.expense_categories?.icon || 'folder';
    
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { name: catName, amount: 0, icon: catIcon };
    }
    categoryTotals[catId].amount += Number(exp.amount);
  });

  const pieData = Object.entries(categoryTotals)
    .map(([id, { name, amount }]) => ({ id, name, value: amount }))
    .sort((a, b) => b.value - a.value);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-primary font-semibold">
            {formatAmount(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const setQuickRange = (months: number) => {
    const end = new Date();
    const start = subMonths(end, months);
    setStartDate(startOfMonth(start));
    setEndDate(endOfMonth(end));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Analysis</h1>
          <p className="text-muted-foreground">Detailed breakdown of your spending</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Date Range & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickRange(1)}>
                  1M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange(3)}>
                  3M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange(6)}>
                  6M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange(12)}>
                  1Y
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                Total Expenses for Selected Period
              </p>
              <p className="text-4xl font-bold">
                {formatAmount(totalExpenses)}
              </p>
              <p className="text-primary-foreground/60 text-sm mt-2">
                {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        ) : pieData.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No expenses in selected period</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Totals</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pieData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toLocaleString()}`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Breakdown Table */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pieData.map((cat, index) => {
                  const catData = categoryTotals[cat.id];
                  const percentage = ((cat.value / totalExpenses) * 100).toFixed(1);
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="p-2 rounded-lg bg-background">
                          <CategoryIcon icon={catData?.icon || 'folder'} className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatAmount(cat.value)}
                        </p>
                        <p className="text-sm text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
