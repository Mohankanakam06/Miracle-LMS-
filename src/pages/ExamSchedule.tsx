import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExamSchedule, useAddExamSchedule } from '@/hooks/useEnhancedLMS';
import { useCourses } from '@/hooks/useLMS';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Clock, MapPin, Plus, GraduationCap, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DEPARTMENTS = ['CSE', 'AI&DS', 'EEE', 'ECE', 'MECH'];
const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
const EXAM_TYPES = [
  { value: 'mid1', label: 'Mid Term 1' },
  { value: 'mid2', label: 'Mid Term 2' },
  { value: 'final', label: 'Final Exam' },
  { value: 'internal', label: 'Internal Assessment' },
];

export default function ExamSchedule() {
  const { user, userRole } = useAuth();
  const [department, setDepartment] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: exams, isLoading, error } = useExamSchedule(department || undefined, semester || undefined);
  const { data: courses } = useCourses();
  const addExam = useAddExamSchedule();

  const [formData, setFormData] = useState({
    course_id: '',
    exam_type: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    room: '',
    department: '',
    semester: '',
    regulation: '',
    max_marks: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExam.mutateAsync({
      ...formData,
      regulation: formData.regulation || null,
      created_by: user?.id || '',
    });
    setDialogOpen(false);
    setFormData({
      course_id: '',
      exam_type: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      room: '',
      department: '',
      semester: '',
      regulation: '',
      max_marks: 100,
    });
  };

  const getExamTypeLabel = (type: string) => EXAM_TYPES.find(t => t.value === type)?.label || type;

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'final': return 'destructive';
      case 'mid1': case 'mid2': return 'default';
      case 'internal': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-gradient">Exam Schedule</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage and view examination timelines</p>
          </div>

          {userRole === 'admin' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  <Plus className="mr-2 h-5 w-5" /> Schedule Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glass-heavy border-sidebar-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display">Schedule New Exam</DialogTitle>
                  <DialogDescription>Add a new exam to the academic calendar.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })}>
                        <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select course" /></SelectTrigger>
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
                        <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {EXAM_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* ... other fields ... */}
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                        <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
                        <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.exam_date}
                        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Input
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        placeholder="e.g., Hall A"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Marks</Label>
                      <Input
                        type="number"
                        value={formData.max_marks}
                        onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) })}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={addExam.isPending} className="bg-primary text-white">
                      {addExam.isPending ? 'Saving...' : 'Schedule Exam'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium mr-2">Filters:</span>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Semesters</SelectItem>
                {SEMESTERS.map(s => <SelectItem key={s} value={s}>Semester {s}</SelectItem>)}
              </SelectContent>
            </Select>

            {(department || semester) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDepartment(''); setSemester(''); }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Exam List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Loading schedule...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Failed to load exams</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              There was a problem connecting to the database. Please check your internet connection or try again later.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {exams.map((exam, index) => (
              <Card key={exam.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden relative hover-lift">
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  getExamTypeColor(exam.exam_type) === 'destructive' ? "bg-red-500" :
                    getExamTypeColor(exam.exam_type) === 'secondary' ? "bg-amber-500" : "bg-primary"
                )} />
                <CardHeader className="pb-3 pl-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={cn(
                      "capitalize backdrop-blur-sm",
                      getExamTypeColor(exam.exam_type) === 'destructive' ? "bg-red-500/10 text-red-600 border-red-200" :
                        getExamTypeColor(exam.exam_type) === 'secondary' ? "bg-amber-500/10 text-amber-600 border-amber-200" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {getExamTypeLabel(exam.exam_type)}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-xs">{exam.max_marks} marks</Badge>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                    {exam.courses?.name || 'Unknown Course'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs font-medium mt-1">
                    <span className="bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded">{exam.courses?.code}</span>
                    <span>•</span>
                    <span>{exam.department}</span>
                    <span>•</span>
                    <span>Sem {exam.semester}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pl-6 text-sm">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="font-medium">{format(new Date(exam.exam_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}</span>
                    </div>
                    {exam.room && (
                      <div className="flex items-center gap-2 text-muted-foreground justify-end">
                        <MapPin className="h-4 w-4" />
                        <span>{exam.room}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in glass-card rounded-2xl mx-auto max-w-2xl hover-lift">
            <div className="p-6 rounded-full bg-primary/5 mb-6 animate-float">
              <GraduationCap className="h-16 w-16 text-primary/40" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground">No exams scheduled</h3>
            <p className="text-muted-foreground max-w-md mt-2 text-lg">
              There are currently no exams scheduled for the selected criteria.
            </p>
            {userRole === 'admin' && (
              <Button className="mt-8 shadow-lg shadow-primary/25" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Schedule First Exam
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
