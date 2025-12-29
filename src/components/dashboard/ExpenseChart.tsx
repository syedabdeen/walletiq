import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSettingsContext } from '@/contexts/SettingsContext';

interface ExpenseChartProps {
  expenses: Array<{
    amount: number;
    expense_categories?: {
      id: string;
      name: string;
    } | null;
  }>;
}

const COLORS = [
  'hsl(168, 76%, 36%)',   // Primary teal
  'hsl(180, 70%, 32%)',   // Darker teal
  'hsl(200, 60%, 45%)',   // Blue
  'hsl(220, 50%, 50%)',   // Indigo
  'hsl(260, 45%, 55%)',   // Purple
  'hsl(300, 40%, 50%)',   // Magenta
  'hsl(340, 50%, 55%)',   // Pink
  'hsl(20, 70%, 50%)',    // Orange
  'hsl(45, 80%, 50%)',    // Yellow
  'hsl(100, 50%, 45%)',   // Green
];

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  const { formatAmount } = useSettingsContext();
  // Group expenses by category
  const categoryTotals: Record<string, { name: string; amount: number }> = {};

  expenses.forEach((exp) => {
    const catId = exp.expense_categories?.id || 'uncategorized';
    const catName = exp.expense_categories?.name || 'Uncategorized';
    
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { name: catName, amount: 0 };
    }
    categoryTotals[catId].amount += Number(exp.amount);
  });

  const data = Object.entries(categoryTotals)
    .map(([id, { name, amount }]) => ({
      id,
      name,
      value: amount,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Expense Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No expenses to display</p>
        </CardContent>
      </Card>
    );
  }

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
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Expense Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
