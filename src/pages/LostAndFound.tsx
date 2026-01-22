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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLostFoundItems, useReportLostFound } from '@/hooks/useEnhancedLMS';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, MapPin, Calendar, User, Package } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'books', label: 'Books' },
  { value: 'other', label: 'Other' },
];

export default function LostAndFound() {
  const { user } = useAuth();
  const [type, setType] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: items, isLoading } = useLostFoundItems(type || undefined);
  const reportItem = useReportLostFound();

  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: '',
    type: 'lost',
    location: '',
    date_reported: format(new Date(), 'yyyy-MM-dd'),
    contact_info: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await reportItem.mutateAsync({
      ...formData,
      reported_by: user?.id || '',
      image_url: null,
    });
    setDialogOpen(false);
    setFormData({
      item_name: '',
      description: '',
      category: '',
      type: 'lost',
      location: '',
      date_reported: format(new Date(), 'yyyy-MM-dd'),
      contact_info: '',
    });
  };

  const getCategoryLabel = (value: string) => CATEGORIES.find(c => c.value === value)?.label || value;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lost & Found</h1>
            <p className="text-muted-foreground">Report and find lost items on campus</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Report Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Item</DialogTitle>
                <DialogDescription>Report a lost or found item</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lost">I lost something</SelectItem>
                      <SelectItem value="found">I found something</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input 
                    value={formData.item_name} 
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="e.g., Black Laptop Bag"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the item in detail..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={formData.date_reported} 
                      onChange={(e) => setFormData({ ...formData, date_reported: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Library, Block A, Canteen"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info (optional)</Label>
                  <Input 
                    value={formData.contact_info} 
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                    placeholder="Phone number or email"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={reportItem.isPending}>
                    {reportItem.isPending ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" onValueChange={(v) => setType(v === 'all' ? '' : v)}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="lost">Lost Items</TabsTrigger>
            <TabsTrigger value="found">Found Items</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ItemGrid items={items} isLoading={isLoading} getCategoryLabel={getCategoryLabel} />
          </TabsContent>
          <TabsContent value="lost" className="mt-4">
            <ItemGrid items={items} isLoading={isLoading} getCategoryLabel={getCategoryLabel} />
          </TabsContent>
          <TabsContent value="found" className="mt-4">
            <ItemGrid items={items} isLoading={isLoading} getCategoryLabel={getCategoryLabel} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function ItemGrid({ items, isLoading, getCategoryLabel }: { items: any[] | undefined; isLoading: boolean; getCategoryLabel: (v: string) => string }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No items reported</h3>
          <p className="text-muted-foreground">Be the first to report a lost or found item</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <Card key={item.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <Badge variant={item.type === 'lost' ? 'destructive' : 'default'}>
                {item.type === 'lost' ? 'Lost' : 'Found'}
              </Badge>
              <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
            </div>
            <CardTitle className="text-lg mt-2">{item.item_name}</CardTitle>
            {item.description && (
              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(item.date_reported), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Reported by {item.profiles?.full_name || 'Unknown'}</span>
            </div>
            {item.contact_info && (
              <p className="text-primary text-sm mt-2">Contact: {item.contact_info}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
