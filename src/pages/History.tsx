import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenseHistory } from '@/hooks/useExpenses';
import { format } from 'date-fns';
import { Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

export default function History() {
  const { currencyCode, formatAmount } = useSettingsContext();
  const { data: history = [], isLoading } = useExpenseHistory();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-primary font-semibold">
            {formatAmount(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense History</h1>
          <p className="text-muted-foreground">View your archived expense periods</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No History Yet</h3>
              <p className="text-muted-foreground">
                When you save and reset your expenses, they'll appear here as historical records.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {history.map((record) => {
              const breakdown = record.category_breakdown as Record<string, { name: string; amount: number }>;
              const pieData = Object.entries(breakdown)
                .map(([id, { name, amount }]) => ({ id, name, value: amount }))
                .sort((a, b) => b.value - a.value);

              return (
                <Card key={record.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {format(new Date(record.period_start), 'MMM d, yyyy')} - {format(new Date(record.period_end), 'MMM d, yyyy')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Saved on {format(new Date(record.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-primary">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-2xl font-bold">
                            {Number(record.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-sm text-muted-foreground">{currencyCode}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
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
                      </div>

                      {/* Category List */}
                      <div className="space-y-2">
                        {pieData.map((cat, index) => {
                          const percentage = ((cat.value / Number(record.total_amount)) * 100).toFixed(1);
                          return (
                            <div
                              key={cat.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium">{cat.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold">
                                  {formatAmount(cat.value)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">({percentage}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
