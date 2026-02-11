import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  variant?: 'default' | 'primary' | 'accent';
  description?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
}

export default function QuickActions({ actions, columns = 2 }: QuickActionsProps) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={cn(
          "grid gap-3",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-3",
          columns === 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        )}>
          {actions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-5 flex-col gap-3 group transition-all duration-300 hover-lift border-muted/60 relative overflow-hidden",
                  action.variant === 'primary' && "hover:border-primary/30 hover:shadow-primary/10",
                  action.variant === 'accent' && "hover:border-accent/30 hover:shadow-accent/10"
                )}
              >
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-primary/5",
                  action.variant === 'accent' && "to-accent/5"
                )} />

                <div className={cn(
                  "p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm",
                  action.variant === 'primary' ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground" :
                    action.variant === 'accent' ? "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground" :
                      "bg-muted/50 text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                )}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-semibold">{action.label}</span>
                  {action.description && (
                    <span className="text-[10px] text-muted-foreground">{action.description}</span>
                  )}
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}