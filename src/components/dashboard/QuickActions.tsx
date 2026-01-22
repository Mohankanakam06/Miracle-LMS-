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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "grid gap-3",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-2 md:grid-cols-4"
        )}>
          {actions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-4 flex-col gap-2 group transition-all hover-lift",
                  action.variant === 'primary' && "border-primary/50 hover:bg-primary/5",
                  action.variant === 'accent' && "border-accent/50 hover:bg-accent/5 bg-accent/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  action.variant === 'primary' ? "bg-primary/10 group-hover:bg-primary/20" :
                    action.variant === 'accent' ? "bg-accent/10 group-hover:bg-accent/20" :
                      "bg-muted group-hover:bg-muted/80"
                )}>
                  <action.icon className={cn(
                    "h-5 w-5",
                    action.variant === 'primary' ? "text-primary" :
                      action.variant === 'accent' ? "text-accent" :
                        "text-muted-foreground"
                  )} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                {action.description && (
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                )}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}