import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials, useKnowledgeBase, useClasses } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Upload, Search, Filter, Folder, 
  Video, BookOpen, File, ExternalLink, Plus, Eye, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Notes() {
  const { user, userRole } = useAuth();
  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  
  const { data: materials, isLoading } = useMaterials();
  const { data: knowledgeBase } = useKnowledgeBase();
  
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique types as filter
  const types = ['All', 'pdf', 'video', 'book'];

  const filteredMaterials = materials?.filter(m => {
    const matchesSubject = selectedSubject === 'All' || m.type === selectedSubject;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  }) || [];

  const pdfMaterials = filteredMaterials.filter(m => m.type === 'pdf');
  const videoMaterials = filteredMaterials.filter(m => m.type === 'video');
  const bookMaterials = filteredMaterials.filter(m => m.type === 'book');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-destructive" />;
      case 'video': return <Video className="h-5 w-5 text-info" />;
      case 'book': return <BookOpen className="h-5 w-5 text-primary" />;
      default: return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Notes & Materials</h1>
            <p className="text-muted-foreground">
              {isTeacher ? 'Upload and manage study materials' : 'Access your study materials and resources'}
            </p>
          </div>
          {isTeacher && (
            <Button variant="hero">
              <Upload className="h-4 w-4" />
              Upload Material
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search materials..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {types.map((type) => (
                  <Button
                    key={type}
                    variant={selectedSubject === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubject(type)}
                  >
                    {type === 'All' ? 'All' : type.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notes">PDF Notes ({pdfMaterials.length})</TabsTrigger>
            <TabsTrigger value="videos">Video Lectures ({videoMaterials.length})</TabsTrigger>
            <TabsTrigger value="books">Reference Books ({bookMaterials.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            {pdfMaterials.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pdfMaterials.map((material) => (
                  <Card key={material.id} className="shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-lg bg-destructive/10">
                          <FileText className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{material.title}</h3>
                          {material.description && (
                            <p className="text-xs text-muted-foreground mt-1">{material.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(material.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {material.file_url && (
                          <>
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            <Button size="sm" className="flex-1" asChild>
                              <a href={material.file_url} download>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No PDF notes available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {videoMaterials.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videoMaterials.map((material) => (
                  <Card key={material.id} className="shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-lg bg-info/10">
                          <Video className="h-6 w-6 text-info" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{material.title}</h3>
                          {material.description && (
                            <p className="text-xs text-muted-foreground mt-1">{material.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(material.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      {material.external_link && (
                        <Button className="w-full mt-4" variant="outline" asChild>
                          <a href={material.external_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Watch Video
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No video lectures available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="books" className="space-y-4">
            {bookMaterials.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {bookMaterials.map((material) => (
                  <Card key={material.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-muted-foreground">{material.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              {material.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reference books available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
