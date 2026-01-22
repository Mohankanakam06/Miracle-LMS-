import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDiscussionForums, useCreateForum, useForumPosts, useCreateForumPost, DiscussionForum } from '@/hooks/useEnhancedLMS';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Plus, Pin, Lock, ArrowLeft, Send, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DiscussionForums() {
  const { user } = useAuth();
  const [selectedForum, setSelectedForum] = useState<DiscussionForum | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  const [newReply, setNewReply] = useState('');
  
  const { data: forums, isLoading } = useDiscussionForums();
  const { data: posts, isLoading: postsLoading } = useForumPosts(selectedForum?.id || '');
  const createForum = useCreateForum();
  const createPost = useCreateForumPost();

  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    await createForum.mutateAsync({
      title: newForumTitle,
      description: newForumDescription || undefined,
      created_by: user?.id || '',
    });
    setCreateDialogOpen(false);
    setNewForumTitle('');
    setNewForumDescription('');
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForum || !newReply.trim()) return;
    
    await createPost.mutateAsync({
      forum_id: selectedForum.id,
      content: newReply,
      author_id: user?.id || '',
    });
    setNewReply('');
  };

  if (selectedForum) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedForum(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {selectedForum.is_pinned && <Pin className="h-5 w-5 text-primary" />}
                {selectedForum.is_locked && <Lock className="h-5 w-5 text-muted-foreground" />}
                {selectedForum.title}
              </h1>
              {selectedForum.description && (
                <p className="text-muted-foreground">{selectedForum.description}</p>
              )}
            </div>
          </div>

          <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Discussion Thread</CardTitle>
              <CardDescription>
                Started by {selectedForum.profiles?.full_name || 'Unknown'} • {formatDistanceToNow(new Date(selectedForum.created_at), { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {post.profiles?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{post.profiles?.full_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                          {post.is_answer && (
                            <Badge variant="default" className="bg-green-500">Answer</Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No replies yet. Be the first to respond!</p>
                </div>
              )}
            </ScrollArea>
            
            {!selectedForum.is_locked && (
              <div className="p-4 border-t">
                <form onSubmit={handleCreatePost} className="flex gap-2">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[60px]"
                  />
                  <Button type="submit" disabled={createPost.isPending || !newReply.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discussion Forums</h1>
            <p className="text-muted-foreground">Ask questions and share knowledge</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Discussion</DialogTitle>
                <DialogDescription>Create a new discussion topic</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateForum} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={newForumTitle} 
                    onChange={(e) => setNewForumTitle(e.target.value)}
                    placeholder="What's your question or topic?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea 
                    value={newForumDescription} 
                    onChange={(e) => setNewForumDescription(e.target.value)}
                    placeholder="Provide more details..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createForum.isPending}>
                    {createForum.isPending ? 'Creating...' : 'Create Discussion'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : forums && forums.length > 0 ? (
          <div className="space-y-4">
            {forums.map(forum => (
              <Card 
                key={forum.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedForum(forum)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {forum.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                          {forum.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                          {forum.title}
                        </CardTitle>
                        {forum.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {forum.description}
                          </CardDescription>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Started by {forum.profiles?.full_name || 'Unknown'} • {formatDistanceToNow(new Date(forum.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{forum.post_count || 0}</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No discussions yet</h3>
              <p className="text-muted-foreground">Start the first discussion!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
