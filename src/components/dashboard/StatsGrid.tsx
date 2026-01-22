import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatItem {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}

interface StatsGridProps {
  stats: StatItem[];
}

const variantStyles = {
  default: {
    card: 'bg-card hover:bg-muted/50',
    icon: 'bg-muted text-muted-foreground',
  },
  primary: {
    card: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40',
    icon: 'bg-primary/10 text-primary',
  },
  success: {
    card: 'bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:border-success/40',
    icon: 'bg-success/10 text-success',
  },
  warning: {
    card: 'bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:border-warning/40',
    icon: 'bg-warning/10 text-warning',
  },
  info: {
    card: 'bg-gradient-to-br from-info/5 to-info/10 border-info/20 hover:border-info/40',
    icon: 'bg-info/10 text-info',
  },
  destructive: {
    card: 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 hover:border-destructive/40',
    icon: 'bg-destructive/10 text-destructive',
  },
};

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const variant = stat.variant || 'default';
        const styles = variantStyles[variant];

        return (
          <Card
            key={index}
            className={cn(
              "shadow-lg border transition-all duration-300 hover-lift",
              styles.card
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-xs font-semibold",
                        stat.trend.isPositive ? "text-success" : "text-destructive"
                      )}>
                        {stat.trend.isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(stat.trend.value)}%
                      </span>
                    )}
                  </div>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  )}
                </div>
                <div className={cn("p-3 rounded-xl", styles.icon)}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}