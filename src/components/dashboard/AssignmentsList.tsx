import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  maxMarks: number;
  status?: 'pending' | 'submitted' | 'graded';
}

interface AssignmentsListProps {
  assignments: Assignment[];
  maxItems?: number;
}

export default function AssignmentsList({ assignments, maxItems = 4 }: AssignmentsListProps) {
  const getUrgencyBadge = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date)) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    }
    if (isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 2) })) {
      return <Badge className="bg-warning text-warning-foreground text-xs">Due Soon</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Upcoming</Badge>;
  };

  const displayAssignments = assignments.slice(0, maxItems);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <ClipboardList className="h-5 w-5 text-warning" />
            </div>
            Pending Assignments
          </CardTitle>
          {assignments.length > maxItems && (
            <Link to="/assignments">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayAssignments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No pending assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAssignments.map((assignment) => {
              const isOverdue = isPast(new Date(assignment.dueDate));
              
              return (
                <div
                  key={assignment.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:shadow-md group cursor-pointer",
                    isOverdue && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isOverdue ? "bg-destructive/10" : "bg-muted"
                    )}>
                      {isOverdue ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {assignment.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {assignment.course}
                          </p>
                        </div>
                        {getUrgencyBadge(assignment.dueDate)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                        </span>
                        <span className="text-xs font-medium">{assignment.maxMarks} marks</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}