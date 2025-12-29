import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExpenses, useCategories } from '@/hooks/useExpenses';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [trendView, setTrendView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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

  // Calculate spending trends over time
  const trendData = useMemo(() => {
    if (!startDate || !endDate || filteredExpenses.length === 0) return [];

    const getIntervals = () => {
      switch (trendView) {
        case 'daily':
          return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
            start: date,
            end: date,
            label: format(date, 'MMM d'),
          }));
        case 'weekly':
          return eachWeekOfInterval({ start: startDate, end: endDate }).map(weekStart => ({
            start: weekStart,
            end: endOfWeek(weekStart),
            label: format(weekStart, 'MMM d'),
          }));
        case 'monthly':
          return eachMonthOfInterval({ start: startDate, end: endDate }).map(monthStart => ({
            start: startOfMonth(monthStart),
            end: endOfMonth(monthStart),
            label: format(monthStart, 'MMM yyyy'),
          }));
      }
    };

    const intervals = getIntervals();
    
    return intervals.map(({ start, end, label }) => {
      const periodExpenses = filteredExpenses.filter(exp => {
        const expDate = parseISO(exp.expense_date);
        return isWithinInterval(expDate, { start, end });
      });
      
      const amount = periodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const count = periodExpenses.length;
      
      return { label, amount, count };
    });
  }, [startDate, endDate, filteredExpenses, trendView]);

  // Calculate trend comparison (current period vs previous)
  const trendComparison = useMemo(() => {
    if (trendData.length < 2) return null;
    
    const currentTotal = trendData.reduce((sum, d) => sum + d.amount, 0);
    const midPoint = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, midPoint).reduce((sum, d) => sum + d.amount, 0);
    const secondHalf = trendData.slice(midPoint).reduce((sum, d) => sum + d.amount, 0);
    
    if (firstHalf === 0) return null;
    
    const percentChange = ((secondHalf - firstHalf) / firstHalf) * 100;
    return {
      percentChange,
      isIncreasing: percentChange > 0,
    };
  }, [trendData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalExpenses > 0 ? ((data.value / totalExpenses) * 100).toFixed(1) : '0';
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

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-primary font-semibold">
            {formatAmount(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {payload[0].payload.count} transaction{payload[0].payload.count !== 1 ? 's' : ''}
          </p>
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
          <div className="space-y-6">
            <Skeleton className="h-[350px]" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </div>
          </div>
        ) : pieData.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No expenses in selected period</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Spending Trends Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Spending Trends</CardTitle>
                  {trendComparison && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                      trendComparison.isIncreasing 
                        ? "bg-destructive/10 text-destructive" 
                        : "bg-green-500/10 text-green-600"
                    )}>
                      {trendComparison.isIncreasing ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{Math.abs(trendComparison.percentChange).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <Tabs value={trendView} onValueChange={(v) => setTrendView(v as any)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
                    <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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
          </>
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
