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
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useEnhancedLMS';
import { useAuth } from '@/hooks/useAuth';
import { Megaphone, Plus, Pin, Clock, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'secondary' },
  { value: 'normal', label: 'Normal', color: 'default' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'destructive' },
];

const TARGET_AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students Only' },
  { value: 'teachers', label: 'Faculty Only' },
  { value: 'department', label: 'Specific Department' },
];

export default function Announcements() {
  const { user, userRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
    target_department: '',
    target_semester: '',
    is_pinned: false,
    expires_at: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAnnouncement.mutateAsync({
      ...formData,
      created_by: user?.id || '',
      attachment_url: null,
      target_department: formData.target_department || null,
      target_semester: formData.target_semester || null,
      expires_at: formData.expires_at || null,
    });
    setDialogOpen(false);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_audience: 'all',
      target_department: '',
      target_semester: '',
      is_pinned: false,
      expires_at: '',
    });
  };

  const getPriorityConfig = (priority: string) => PRIORITIES.find(p => p.value === priority);

  const canCreateAnnouncement = userRole === 'admin' || userRole === 'teacher';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">Important updates and notices</p>
          </div>
          
          {canCreateAnnouncement && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>Publish a new announcement to users</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                      placeholder="Enter announcement title"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea 
                      value={formData.content} 
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your announcement..."
                      rows={5}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Select value={formData.target_audience} onValueChange={(v) => setFormData({ ...formData, target_audience: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TARGET_AUDIENCES.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.target_audience === 'department' && (
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input 
                          value={formData.target_department} 
                          onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
                          placeholder="e.g., CSE"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Expires At (optional)</Label>
                      <Input 
                        type="datetime-local" 
                        value={formData.expires_at} 
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={formData.is_pinned} 
                      onCheckedChange={(v) => setFormData({ ...formData, is_pinned: v })} 
                    />
                    <Label>Pin this announcement</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createAnnouncement.isPending}>
                      {createAnnouncement.isPending ? 'Publishing...' : 'Publish Announcement'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map(announcement => {
              const priorityConfig = getPriorityConfig(announcement.priority);
              return (
                <Card key={announcement.id} className={`${announcement.is_pinned ? 'border-primary/50 bg-primary/5' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {announcement.is_pinned && (
                          <Pin className="h-5 w-5 text-primary mt-1" />
                        )}
                        <div>
                          <CardTitle className="text-xl">{announcement.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {announcement.profiles?.full_name || 'Admin'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={priorityConfig?.color as any || 'secondary'}>
                          {priorityConfig?.label || announcement.priority}
                        </Badge>
                        <Badge variant="outline">
                          {TARGET_AUDIENCES.find(a => a.value === announcement.target_audience)?.label || announcement.target_audience}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-muted-foreground">{announcement.content}</p>
                    {announcement.expires_at && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Expires: {format(new Date(announcement.expires_at), 'PPP p')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No announcements</h3>
              <p className="text-muted-foreground">Check back later for updates</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
