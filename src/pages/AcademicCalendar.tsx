import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAcademicCalendar, useAddCalendarEvent } from '@/hooks/useEnhancedLMS';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Plus, PartyPopper, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import { format, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';

const EVENT_TYPES = [
  { value: 'holiday', label: 'Holiday', icon: PartyPopper, color: 'bg-success' },
  { value: 'exam', label: 'Examination', icon: GraduationCap, color: 'bg-destructive' },
  { value: 'event', label: 'Event', icon: Calendar, color: 'bg-primary' },
  { value: 'deadline', label: 'Deadline', icon: AlertCircle, color: 'bg-warning' },
  { value: 'semester_start', label: 'Semester Start', icon: Clock, color: 'bg-purple-500' },
  { value: 'semester_end', label: 'Semester End', icon: Clock, color: 'bg-purple-500' },
];

export default function AcademicCalendar() {
  const { user, userRole } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: events, isLoading } = useAcademicCalendar();
  const addEvent = useAddCalendarEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: '',
    end_date: '',
    department: '',
    is_holiday: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEvent.mutateAsync({
      ...formData,
      created_by: user?.id || null,
      end_date: formData.end_date || null,
      department: formData.department || null,
    });
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      event_type: '',
      start_date: '',
      end_date: '',
      department: '',
      is_holiday: false,
    });
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEventsForDay = (day: Date) => {
    return events?.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : startDate;
      return day >= startDate && day <= endDate;
    }) || [];
  };

  const getEventTypeConfig = (type: string) => EVENT_TYPES.find(t => t.value === type);

  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const upcomingEvents = events?.filter(e => new Date(e.start_date) >= new Date()).slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Calendar</h1>
            <p className="text-muted-foreground">View important dates and events</p>
          </div>

          {userRole === 'admin' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Calendar Event</DialogTitle>
                  <DialogDescription>Add a new event to the academic calendar</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Department (optional)</Label>
                      <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="All departments" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date (optional)</Label>
                      <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_holiday} onCheckedChange={(v) => setFormData({ ...formData, is_holiday: v })} />
                    <Label>Mark as holiday</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={addEvent.isPending}>
                      {addEvent.isPending ? 'Saving...' : 'Add Event'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar View */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>←</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>→</Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {days.map(day => {
                      const dayEvents = getEventsForDay(day);
                      const isCurrentDay = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`aspect-square p-1 border rounded-lg ${isCurrentDay ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                            } ${dayEvents.some(e => e.is_holiday) ? 'bg-green-50 dark:bg-green-950' : ''}`}
                        >
                          <div className={`text-sm ${isCurrentDay ? 'font-bold text-primary' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map(event => {
                              const config = getEventTypeConfig(event.event_type);
                              return (
                                <div
                                  key={event.id}
                                  className={`w-2 h-2 rounded-full ${config?.color || 'bg-gray-500'}`}
                                  title={event.title}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 5 events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => {
                  const config = getEventTypeConfig(event.event_type);
                  const Icon = config?.icon || Calendar;
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`p-2 rounded-lg ${config?.color || 'bg-gray-500'} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                          {event.end_date && event.end_date !== event.start_date && (
                            <> - {format(new Date(event.end_date), 'MMM d, yyyy')}</>
                          )}
                        </p>
                        {event.is_holiday && <Badge variant="secondary" className="mt-1">Holiday</Badge>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {EVENT_TYPES.map(type => (
                <div key={type.value} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  <span className="text-sm">{type.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
