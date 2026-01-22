import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreviousPapers, useUploadPreviousPaper } from '@/hooks/useEnhancedLMS';
import { useCourses } from '@/hooks/useLMS';
import { useAuth } from '@/hooks/useAuth';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { FileText, Plus, Download, Calendar, BookOpen, GraduationCap } from 'lucide-react';

const EXAM_TYPES = [
  { value: 'mid1', label: 'Mid Term 1' },
  { value: 'mid2', label: 'Mid Term 2' },
  { value: 'final', label: 'Final Exam' },
];

const REGULATIONS = ['R20', 'R23'];
const YEARS = ['2024', '2023', '2022', '2021', '2020'];

export default function PreviousPapers() {
  const { user, userRole } = useAuth();
  const [regulation, setRegulation] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: papers, isLoading } = usePreviousPapers(undefined, regulation || undefined);
  const { data: courses } = useCourses();
  const uploadPaper = useUploadPreviousPaper();

  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    exam_type: '',
    exam_year: '',
    regulation: '',
    file_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadPaper.mutateAsync({
      ...formData,
      uploaded_by: user?.id || '',
      course_id: formData.course_id || null,
    });
    setDialogOpen(false);
    setFormData({
      course_id: '',
      title: '',
      exam_type: '',
      exam_year: '',
      regulation: '',
      file_url: '',
    });
  };

  const getExamTypeLabel = (type: string) => EXAM_TYPES.find(t => t.value === type)?.label || type;

  const canUpload = userRole === 'admin' || userRole === 'teacher';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-gradient">Previous Year Papers</h1>
            <p className="text-muted-foreground mt-2 text-lg">Access past exam question papers</p>
          </div>

          {canUpload && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-5 w-5" /> Upload Paper
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Previous Paper</DialogTitle>
                  <DialogDescription>Add a question paper to the archive</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Data Structures Mid 1 - 2024"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course (optional)</Label>
                      <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                        <SelectContent>
                          {courses?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <Select value={formData.exam_type} onValueChange={(v) => setFormData({ ...formData, exam_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {EXAM_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={formData.exam_year} onValueChange={(v) => setFormData({ ...formData, exam_year: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Regulation</Label>
                      <Select value={formData.regulation} onValueChange={(v) => setFormData({ ...formData, regulation: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {REGULATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>File URL</Label>
                    <Input
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={uploadPaper.isPending}>
                      {uploadPaper.isPending ? 'Uploading...' : 'Upload Paper'}
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
            <div className="flex flex-wrap gap-4">
              <Select value={regulation} onValueChange={setRegulation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Regulations" />
                </SelectTrigger>
                <SelectContent>
                  {REGULATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Papers Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <LoadingSkeleton variant="card" count={6} />
          </div>
        ) : papers && papers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
            {papers.map(paper => (
              <Card key={paper.id} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover-lift border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{paper.exam_year}</Badge>
                      {paper.regulation && <Badge variant="secondary">{paper.regulation}</Badge>}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">{paper.title}</CardTitle>
                  {paper.courses && (
                    <CardDescription>
                      {paper.courses.code} - {paper.courses.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{getExamTypeLabel(paper.exam_type)}</span>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in glass-card rounded-2xl mx-auto max-w-2xl hover-lift">
            <div className="p-6 rounded-full bg-primary/5 mb-6 animate-float">
              <GraduationCap className="h-16 w-16 text-primary/40" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground">No papers available</h3>
            <p className="text-muted-foreground max-w-md mt-2 text-lg">Papers will be uploaded soon</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
