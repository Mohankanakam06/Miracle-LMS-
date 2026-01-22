import { useAuth } from '@/hooks/useAuth';
import { useTimetable, useClasses } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const subjectColors: Record<string, string> = {
  'Data Structures & Algorithms': 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 border-none',
  'Database Management Systems': 'bg-purple-600 text-white shadow-md hover:bg-purple-700 border-none',
  'Operating Systems': 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 border-none',
  'Computer Networks': 'bg-amber-500 text-black shadow-md hover:bg-amber-600 border-none',
  'Software Engineering': 'bg-sky-600 text-white shadow-md hover:bg-sky-700 border-none',
  'default': 'bg-secondary text-secondary-foreground shadow-sm border-none',
};

export default function Timetable() {
  const { user, userRole } = useAuth();
  const isTeacher = userRole === 'teacher';

  const { data: timetableData, isLoading } = useTimetable(user?.id);

  const getScheduleForSlot = (day: string, time: string) => {
    return timetableData?.find(entry =>
      entry.day_of_week === day && entry.start_time.startsWith(time)
    );
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetableData?.filter(entry => entry.day_of_week === today) || [];
  };

  const getSubjectColor = (courseName?: string) => {
    if (!courseName) return subjectColors.default;
    return subjectColors[courseName] || subjectColors.default;
  };

  const uniqueSubjects = [...new Set(timetableData?.map(t => t.classes?.courses?.name).filter(Boolean))];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 stagger-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Timetable</h1>
            <p className="text-muted-foreground">
              {isTeacher ? 'Your teaching schedule' : 'Your class schedule for this semester'}
            </p>
          </div>
          {isTeacher && (
            <Button variant="hero">
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          )}
        </div>

        {/* Today's Classes Quick View */}
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Classes
            </CardTitle>
            <CardDescription>Quick overview of your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {getTodaySchedule().length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {getTodaySchedule().slice(0, 4).map((item, index) => (
                  <div key={item.id} className={cn(
                    "p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                    getSubjectColor(item.classes?.courses?.name)
                  )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                    </div>
                    <p className="font-semibold">{item.classes?.courses?.name || 'Unknown Subject'}</p>
                    <div className="mt-2 space-y-1 text-sm opacity-90">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.classes?.profiles?.full_name || 'TBA'}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.room || item.classes?.room || 'TBA'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No classes scheduled for today</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Timetable */}
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="font-display">Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {timetableData && timetableData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-left font-medium text-muted-foreground w-20">Time</th>
                      {days.map(day => (
                        <th key={day} className="p-3 text-left font-medium text-muted-foreground">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time, timeIndex) => (
                      <tr key={time} className={timeIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-3 font-medium text-sm text-muted-foreground border-r">{time}</td>
                        {days.map(day => {
                          const schedule = getScheduleForSlot(day, time);
                          return (
                            <td key={day} className="p-2 border-r last:border-r-0">
                              {schedule && (
                                <div className={cn(
                                  "p-2 rounded-md text-xs shadow-sm transition-colors",
                                  getSubjectColor(schedule.classes?.courses?.name)
                                )}>
                                  <p className="font-semibold">{schedule.classes?.courses?.name}</p>
                                  <p className="opacity-90">{schedule.room || schedule.classes?.room}</p>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No timetable entries found</p>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        {uniqueSubjects.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Subject Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {uniqueSubjects.map((subject) => (
                  <Badge key={subject} variant="outline" className={cn("font-normal", getSubjectColor(subject))}>
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
