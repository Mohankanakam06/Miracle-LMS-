import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface GradeData {
  subject: string;
  marks: number;
  maxMarks: number;
}

interface GradesChartProps {
  data: GradeData[];
}

export default function GradesChart({ data }: GradesChartProps) {
  const chartData = data.map(d => ({
    ...d,
    percentage: Math.round((d.marks / d.maxMarks) * 100),
  }));

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'hsl(142, 71%, 45%)';
    if (percentage >= 60) return 'hsl(217, 91%, 60%)';
    if (percentage >= 40) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
  };

  const averagePercentage = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, d) => sum + d.percentage, 0) / chartData.length)
    : 0;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            Academic Performance
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold font-display text-primary">{averagePercentage}%</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No grades data available yet
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tickFormatter={(value) => `${value}%`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="subject" 
                  width={80}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${props.payload.marks}/${props.payload.maxMarks} (${value}%)`,
                    'Score'
                  ]}
                />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}