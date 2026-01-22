import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedCounter from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';

interface StatsCardProps {
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

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/5 border-primary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  info: 'bg-info/5 border-info/20',
  destructive: 'bg-destructive/5 border-destructive/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
};

export default function StatsCard({ title, value, icon, description, trend, variant = 'default' }: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numericValue);
  const prefix = typeof value === 'string' ? value.match(/^[^\d]+/)?.[0] || '' : '';
  const suffix = typeof value === 'string' ? value.match(/[^\d]+$/)?.[0] || '' : '';

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-all duration-300 hover-lift border-border/50", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-display font-bold">
                {isNumeric ? (
                  <AnimatedCounter value={numericValue} prefix={prefix} suffix={suffix} />
                ) : (
                  value
                )}
              </p>
              {trend && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  trend.isPositive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                )}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground font-medium">{description}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:scale-110", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
