import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubmissions, useAssignments, useClasses, useGradeSubmission } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, TrendingUp, Award, BookOpen, Search, Save, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getGradeColor = (percentage: number) => {
  if (percentage >= 90) return 'text-success';
  if (percentage >= 80) return 'text-info';
  if (percentage >= 70) return 'text-warning';
  return 'text-destructive';
};

const getGrade = (percentage: number) => {
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  return 'F';
};

export default function Grades() {
  const { user, userRole } = useAuth();
  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  
  const { data: submissions, isLoading: loadingSubmissions } = useSubmissions(user?.id);
  const { data: assignments, isLoading: loadingAssignments } = useAssignments();
  const { data: classes } = useClasses();
  const gradeSubmission = useGradeSubmission();

  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [gradingData, setGradingData] = useState<Record<string, string>>({});

  // Calculate grade statistics for student view
  const gradeStats = useMemo(() => {
    if (!submissions) return { sgpa: 0, totalCredits: 0, subjects: [], exams: [] };

    const gradedSubmissions = submissions.filter(s => s.marks !== null);
    
    // Group by subject (assignment's class course)
    const subjectMap = new Map<string, { totalMarks: number; maxMarks: number; credits: number }>();
    
    gradedSubmissions.forEach(sub => {
      const assignment = assignments?.find(a => a.id === sub.assignment_id);
      if (!assignment) return;
      
      const courseName = assignment.classes?.courses?.name || 'Unknown';
      const credits = assignment.classes?.courses?.credits || 3;
      
      if (!subjectMap.has(courseName)) {
        subjectMap.set(courseName, { totalMarks: 0, maxMarks: 0, credits });
      }
      
      const stats = subjectMap.get(courseName)!;
      stats.totalMarks += sub.marks || 0;
      stats.maxMarks += assignment.max_marks;
    });

    const subjects = Array.from(subjectMap.entries()).map(([name, stats]) => {
      const percentage = stats.maxMarks > 0 ? (stats.totalMarks / stats.maxMarks) * 100 : 0;
      return {
        name,
        marks: stats.totalMarks,
        maxMarks: stats.maxMarks,
        percentage: Math.round(percentage),
        grade: getGrade(percentage),
        credits: stats.credits
      };
    });

    // Calculate SGPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    subjects.forEach(sub => {
      const gradePoint = sub.percentage >= 90 ? 10 : sub.percentage >= 80 ? 9 : sub.percentage >= 70 ? 8 : 
                         sub.percentage >= 60 ? 7 : sub.percentage >= 50 ? 6 : sub.percentage >= 40 ? 5 : 0;
      totalGradePoints += gradePoint * sub.credits;
      totalCredits += sub.credits;
    });

    const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    return { sgpa: parseFloat(sgpa), totalCredits, subjects };
  }, [submissions, assignments]);

  const handleSaveGrade = async (submissionId: string, marks: number) => {
    if (!user?.id) return;
    
    try {
      await gradeSubmission.mutateAsync({
        submissionId,
        marks,
        gradedBy: user.id
      });
      toast.success('Grade saved successfully');
    } catch (error) {
      toast.error('Failed to save grade');
    }
  };

  if (loadingSubmissions || loadingAssignments) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isTeacher) {
    const selectedAssignmentData = assignments?.find(a => a.id === selectedAssignment);
    
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">Grade Assignments</h1>
              <p className="text-muted-foreground">Enter marks for student submissions</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments?.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedAssignment && selectedAssignmentData ? (
            <>
              {/* Assignment Info */}
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assignment</p>
                      <p className="font-semibold">{selectedAssignmentData.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-semibold">{selectedAssignmentData.classes?.courses?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Marks</p>
                      <p className="font-semibold">{selectedAssignmentData.max_marks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{new Date(selectedAssignmentData.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grading Section */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Enter Marks</CardTitle>
                  <CardDescription>Grade student submissions for this assignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Student submissions will appear here once they submit their work
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an assignment to start grading</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Grades & Performance</h1>
          <p className="text-muted-foreground">View your academic performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current SGPA</p>
                  <p className="text-3xl font-display font-bold">{gradeStats.sgpa}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-info/5 border-info/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Graded Assignments</p>
                  <p className="text-3xl font-display font-bold text-info">
                    {submissions?.filter(s => s.marks !== null).length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-info/10">
                  <TrendingUp className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                  <p className="text-3xl font-display font-bold text-success">{gradeStats.subjects.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <Award className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-3xl font-display font-bold">{gradeStats.totalCredits}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Grades */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeStats.subjects.length > 0 ? (
              <div className="space-y-4">
                {gradeStats.subjects.map((subject) => (
                  <div key={subject.name} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("text-2xl font-bold", getGradeColor(subject.percentage))}>
                          {subject.grade}
                        </span>
                        <div>
                          <p className="font-semibold">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">{subject.credits} Credits</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{subject.marks}/{subject.maxMarks}</p>
                        <p className="text-sm text-muted-foreground">{subject.percentage}%</p>
                      </div>
                    </div>
                    <Progress value={subject.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No grades available yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions && submissions.filter(s => s.marks !== null).length > 0 ? (
              <div className="space-y-3">
                {submissions.filter(s => s.marks !== null).slice(0, 10).map((submission) => {
                  const assignment = assignments?.find(a => a.id === submission.assignment_id);
                  const percentage = assignment ? (submission.marks! / assignment.max_marks) * 100 : 0;
                  
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{assignment?.title || 'Unknown Assignment'}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment?.classes?.courses?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-bold", getGradeColor(percentage))}>
                          {submission.marks}/{assignment?.max_marks}
                        </p>
                        <p className="text-sm text-muted-foreground">{Math.round(percentage)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No graded submissions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
