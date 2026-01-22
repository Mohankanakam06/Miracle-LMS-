import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  id: string;
  time: string;
  endTime?: string;
  subject: string;
  teacher?: string;
  room?: string;
  status?: 'ongoing' | 'upcoming' | 'completed';
}

interface UpcomingScheduleProps {
  title: string;
  date: string;
  items: ScheduleItem[];
}

export default function UpcomingSchedule({ title, date, items }: UpcomingScheduleProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-success text-success-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            {title}
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            {date}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No classes scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className={cn(
                  "relative p-4 rounded-xl border transition-all hover:shadow-md",
                  item.status === 'ongoing' && "border-success/50 bg-success/5",
                  item.status === 'completed' && "opacity-60"
                )}
              >
                {item.status === 'ongoing' && (
                  <div className="absolute top-4 right-4">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-center">
                    <div className={cn("px-3 py-1 rounded-lg text-xs font-semibold", getStatusColor(item.status))}>
                      {item.time}
                    </div>
                    {item.endTime && (
                      <p className="text-xs text-muted-foreground mt-1">{item.endTime}</p>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.subject}</h4>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {item.teacher && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.teacher}
                        </span>
                      )}
                      {item.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.room}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}