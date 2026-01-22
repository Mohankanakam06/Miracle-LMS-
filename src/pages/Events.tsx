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
import { useEvents, useCreateEvent, useRegisterForEvent, useMyEventRegistrations } from '@/hooks/useEnhancedLMS';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Plus, MapPin, Clock, Users, Star, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop', color: 'bg-primary' },
  { value: 'seminar', label: 'Seminar', color: 'bg-purple-500' },
  { value: 'cultural', label: 'Cultural', color: 'bg-pink-500' },
  { value: 'sports', label: 'Sports', color: 'bg-success' },
  { value: 'placement', label: 'Placement', color: 'bg-warning' },
  { value: 'tech_fest', label: 'Tech Fest', color: 'bg-info' },
];

export default function Events() {
  const { user, userRole } = useAuth();
  const [eventType, setEventType] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: events, isLoading } = useEvents(eventType || undefined);
  const { data: myRegistrations } = useMyEventRegistrations(user?.id || '');
  const createEvent = useCreateEvent();
  const registerForEvent = useRegisterForEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    venue: '',
    start_datetime: '',
    end_datetime: '',
    registration_required: false,
    max_participants: '',
    registration_deadline: '',
    organizer: '',
    department: '',
    is_featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent.mutateAsync({
      ...formData,
      created_by: user?.id || '',
      image_url: null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      end_datetime: formData.end_datetime || null,
      registration_deadline: formData.registration_deadline || null,
      venue: formData.venue || null,
      organizer: formData.organizer || null,
      department: formData.department || null,
    });
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      event_type: '',
      venue: '',
      start_datetime: '',
      end_datetime: '',
      registration_required: false,
      max_participants: '',
      registration_deadline: '',
      organizer: '',
      department: '',
      is_featured: false,
    });
  };

  const handleRegister = async (eventId: string) => {
    if (!user) return;
    await registerForEvent.mutateAsync({
      event_id: eventId,
      user_id: user.id,
    });
  };

  const getEventTypeConfig = (type: string) => EVENT_TYPES.find(t => t.value === type);

  const canCreateEvent = userRole === 'admin' || userRole === 'teacher';

  return (
    <DashboardLayout>
      <div className="space-y-6 stagger-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campus Events</h1>
            <p className="text-muted-foreground">Discover and register for upcoming events</p>
          </div>

          {canCreateEvent && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>Add a new event to the calendar</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="e.g., Seminar Hall"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_datetime}
                        onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_datetime}
                        onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organizer</Label>
                      <Input
                        value={formData.organizer}
                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                        placeholder="e.g., CSE Department"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Participants</Label>
                      <Input
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.registration_required}
                        onCheckedChange={(v) => setFormData({ ...formData, registration_required: v })}
                      />
                      <Label>Registration Required</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                      />
                      <Label>Featured Event</Label>
                    </div>
                  </div>
                  {formData.registration_required && (
                    <div className="space-y-2">
                      <Label>Registration Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={formData.registration_deadline}
                        onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createEvent.isPending}>
                      {createEvent.isPending ? 'Creating...' : 'Create Event'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={eventType === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventType('')}
              >
                All Events
              </Button>
              {EVENT_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant={eventType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEventType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => {
              const config = getEventTypeConfig(event.event_type);
              const isRegistered = myRegistrations?.includes(event.id);
              return (
                <Card key={event.id} className={`glass-card hover-lift transition-all duration-300 ${event.is_featured ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                  {event.is_featured && (
                    <div className="px-4 py-1 bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" /> Featured Event
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge className={config?.color || 'bg-gray-500'}>
                        {config?.label || event.event_type}
                      </Badge>
                      {isRegistered && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Registered
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                    {event.description && (
                      <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(event.start_datetime), 'h:mm a')}
                        {event.end_datetime && ` - ${format(new Date(event.end_datetime), 'h:mm a')}`}
                      </span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Max {event.max_participants} participants</span>
                      </div>
                    )}

                    {event.registration_required && !isRegistered && (
                      <Button
                        className="w-full mt-3"
                        onClick={() => handleRegister(event.id)}
                        disabled={registerForEvent.isPending}
                      >
                        {registerForEvent.isPending ? 'Registering...' : 'Register Now'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No upcoming events</h3>
              <p className="text-muted-foreground">Check back later for new events</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
