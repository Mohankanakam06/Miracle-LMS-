import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface AttendanceChartProps {
  present: number;
  absent: number;
  late: number;
}

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)'];

export default function AttendanceChart({ present, absent, late }: AttendanceChartProps) {
  const total = present + absent + late;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const data = [
    { name: 'Present', value: present, color: 'hsl(142, 71%, 45%)' },
    { name: 'Absent', value: absent, color: 'hsl(0, 84%, 60%)' },
    { name: 'Late', value: late, color: 'hsl(38, 92%, 50%)' },
  ].filter(d => d.value > 0);

  // If no data, show empty state
  if (total === 0) {
    data.push({ name: 'No Data', value: 1, color: 'hsl(215, 16%, 47%)' });
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold font-display">{percentage}%</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Present</span>
              <span className="ml-auto font-semibold">{present}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Absent</span>
              <span className="ml-auto font-semibold">{absent}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Late</span>
              <span className="ml-auto font-semibold">{late}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Classes</span>
                <span className="font-bold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}