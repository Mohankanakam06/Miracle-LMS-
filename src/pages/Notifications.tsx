import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useMarkNotificationRead, useSendNotification, useKnowledgeBase } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, CheckCircle, AlertCircle, Info, Calendar, 
  MessageSquare, Send, Clock, Check, Trash2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Notifications() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = userRole === 'admin';
  
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const { data: knowledgeBase } = useKnowledgeBase();
  const markAsRead = useMarkNotificationRead();
  const sendNotification = useSendNotification();
  
  const [newNotification, setNewNotification] = useState<{ title: string; message: string; type: 'info' | 'success' | 'warning' | 'alert' }>({ title: '', message: '', type: 'info' });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'alert': return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'success': return <Badge className="bg-success/10 text-success border-success/30">Success</Badge>;
      case 'warning': return <Badge className="bg-warning/10 text-warning border-warning/30">Warning</Badge>;
      case 'alert': return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Alert</Badge>;
      default: return <Badge className="bg-info/10 text-info border-info/30">Info</Badge>;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications?.filter(n => !n.read) || [];
    for (const n of unread) {
      await markAsRead.mutateAsync(n.id);
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: 'Missing information',
        description: 'Please provide both title and message',
        variant: 'destructive',
      });
      return;
    }

    try {
      await sendNotification.mutateAsync({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
      });
      
      toast({
        title: 'Notification sent!',
        description: 'Your notification has been sent to all users',
      });
      
      setNewNotification({ title: '', message: '', type: 'info' });
    } catch (error) {
      toast({
        title: 'Failed to send',
        description: 'There was an error sending the notification',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const announcements = knowledgeBase?.filter(k => k.category === 'general') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage and send notifications' : 'Stay updated with the latest announcements'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Admin: Send Notification */}
        {isAdmin && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Send Notification
              </CardTitle>
              <CardDescription>Send notifications to all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Notification title" 
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newNotification.type} 
                    onValueChange={(value: 'info' | 'success' | 'warning' | 'alert') => 
                      setNewNotification(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="Write your notification message..." 
                  rows={3}
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <Button 
                variant="hero" 
                onClick={handleSendNotification}
                disabled={sendNotification.isPending}
              >
                {sendNotification.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Notification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements">FAQs & Info</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {isLoading ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : !notifications || notifications.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-muted-foreground">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "shadow-card transition-all",
                    !notification.read && "border-l-4 border-l-primary bg-primary/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className={cn("font-semibold", !notification.read && "text-primary")}>
                            {notification.title}
                          </h3>
                          {getTypeBadge(notification.type)}
                          {!notification.read && (
                            <Badge className="bg-primary text-primary-foreground">New</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsRead.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            {announcements.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No announcements yet</p>
                </CardContent>
              </Card>
            ) : (
              announcements.map((item) => (
                <Card key={item.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{item.question}</h3>
                        <p className="text-muted-foreground">{item.answer}</p>
                        <Badge variant="outline" className="mt-2">{item.category}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
