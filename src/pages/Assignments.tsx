import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAssignments, useSubmissions, useClasses, useSubmitAssignment } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, Clock, Upload, CheckCircle, AlertCircle, 
  FileText, Calendar, Plus, Search, Filter, Eye, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';

export default function Assignments() {
  const { user, userRole } = useAuth();
  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  
  const { data: assignments, isLoading: loadingAssignments } = useAssignments();
  const { data: submissions, isLoading: loadingSubmissions } = useSubmissions(user?.id);
  const { data: classes } = useClasses();
  const submitAssignment = useSubmitAssignment();

  const [searchQuery, setSearchQuery] = useState('');

  // Map submissions to assignments for student view
  const assignmentsWithStatus = useMemo(() => {
    if (!assignments) return [];
    
    return assignments.map(assignment => {
      const submission = submissions?.find(s => s.assignment_id === assignment.id);
      let status: 'pending' | 'submitted' | 'graded' | 'overdue' = 'pending';
      
      if (submission) {
        status = submission.marks !== null ? 'graded' : 'submitted';
      } else if (isPast(new Date(assignment.due_date))) {
        status = 'overdue';
      }
      
      return {
        ...assignment,
        status,
        submission,
        subject: assignment.classes?.courses?.name || 'Unknown',
      };
    });
  }, [assignments, submissions]);

  const filteredAssignments = assignmentsWithStatus.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingAssignments = filteredAssignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const submittedAssignments = filteredAssignments.filter(a => a.status === 'submitted');
  const gradedAssignments = filteredAssignments.filter(a => a.status === 'graded');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/30';
      case 'submitted': return 'bg-info/10 text-info border-info/30';
      case 'graded': return 'bg-success/10 text-success border-success/30';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!user?.id) return;
    
    try {
      await submitAssignment.mutateAsync({
        assignmentId,
        studentId: user.id,
        notes: 'Submitted via LMS'
      });
      toast.success('Assignment submitted successfully');
    } catch (error) {
      toast.error('Failed to submit assignment');
    }
  };

  if (loadingAssignments || loadingSubmissions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isTeacher) {
    // Group assignments by class for teacher view
    const assignmentsByClass = assignments?.reduce((acc, assignment) => {
      const classId = assignment.class_id;
      if (!acc[classId]) acc[classId] = [];
      acc[classId].push(assignment);
      return acc;
    }, {} as Record<string, typeof assignments>) || {};

    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">Assignments</h1>
              <p className="text-muted-foreground">Create and manage assignments for your classes</p>
            </div>
            <Button variant="hero">
              <Plus className="h-4 w-4" />
              Create Assignment
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-card bg-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/20">
                    <Upload className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assignments?.filter(a => !isPast(new Date(a.due_date))).length || 0}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assignments?.filter(a => isPast(new Date(a.due_date))).length || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignments List */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">All Assignments</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search assignments..." 
                      className="pl-9 w-64" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.filter(a => 
                    a.title.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((assignment) => (
                    <div key={assignment.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <Badge variant="outline">{assignment.classes?.courses?.name}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                            </span>
                            <span>Max Marks: {assignment.max_marks}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm">Grade</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No assignments created yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Assignments</h1>
          <p className="text-muted-foreground">View and submit your assignments</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card bg-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{pendingAssignments.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-info/5 border-info/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-info" />
                <div>
                  <p className="text-2xl font-bold">{submittedAssignments.length}</p>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{gradedAssignments.length}</p>
                  <p className="text-sm text-muted-foreground">Graded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submittedAssignments.length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({gradedAssignments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map((assignment) => (
                <Card key={assignment.id} className="shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{assignment.subject}</Badge>
                          <Badge variant="outline" className={getStatusColor(assignment.status)}>
                            {assignment.status === 'overdue' ? (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {assignment.status === 'overdue' ? 'Overdue' : 'Pending'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                          </span>
                          <span>Max Marks: {assignment.max_marks}</span>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground">{assignment.description}</p>
                        )}
                      </div>
                      <Button onClick={() => handleSubmit(assignment.id)} disabled={submitAssignment.isPending}>
                        {submitAssignment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Upload className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                  <p className="text-muted-foreground">No pending assignments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            {submittedAssignments.length > 0 ? (
              submittedAssignments.map((assignment) => (
                <Card key={assignment.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{assignment.subject}</Badge>
                          <Badge variant="outline" className={getStatusColor(assignment.status)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground">Awaiting grade</p>
                      </div>
                      <Button variant="outline">View Submission</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No submitted assignments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="graded" className="space-y-4">
            {gradedAssignments.length > 0 ? (
              gradedAssignments.map((assignment) => (
                <Card key={assignment.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{assignment.subject}</Badge>
                          <Badge variant="outline" className={getStatusColor(assignment.status)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Graded
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{assignment.title}</h3>
                        {assignment.submission?.feedback && (
                          <p className="text-sm text-muted-foreground">Feedback: {assignment.submission.feedback}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">
                          {assignment.submission?.marks}/{assignment.max_marks}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(((assignment.submission?.marks || 0) / assignment.max_marks) * 100)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No graded assignments yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
