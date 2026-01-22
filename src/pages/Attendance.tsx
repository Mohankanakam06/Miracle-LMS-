import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance, useMarkAttendance, useProfiles, useClasses } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreatePeriodDialog from '@/components/classes/CreatePeriodDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckSquare, Calendar, TrendingUp, AlertCircle,
  Check, X, Clock, Users, Save, Loader2, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEPARTMENTS = [
  { value: 'CSE', label: 'CSE' },
  { value: 'AI&DS', label: 'AI&DS' },
  { value: 'EEE', label: 'EEE' },
  { value: 'ECE', label: 'ECE' },
  { value: 'MECH', label: 'MECH' },
];

const SEMESTERS = [
  { value: '1-1', label: '1-1' },
  { value: '1-2', label: '1-2' },
  { value: '2-1', label: '2-1' },
  { value: '2-2', label: '2-2' },
  { value: '3-1', label: '3-1' },
  { value: '3-2', label: '3-2' },
  { value: '4-1', label: '4-1' },
  { value: '4-2', label: '4-2' },
];

export default function Attendance() {
  const { user, userRole } = useAuth();
  const isTeacher = userRole === 'teacher' || userRole === 'admin';

  const { data: attendanceRecords, isLoading } = useAttendance(user?.id);
  const { data: profiles } = useProfiles();
  const { data: classes } = useClasses();
  const markAttendance = useMarkAttendance();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  const [createPeriodOpen, setCreatePeriodOpen] = useState(false);

  // Filter students by department and semester
  const filteredStudents = useMemo(() => {
    if (!profiles) return [];

    return profiles.filter(profile => {
      if (profile.role !== 'student') return false;
      if (selectedDepartment && profile.department !== selectedDepartment) return false;
      if (selectedSemester && profile.semester !== selectedSemester) return false;
      return true;
    });
  }, [profiles, selectedDepartment, selectedSemester]);

  // Calculate attendance stats for student view
  const attendanceStats = useMemo(() => {
    if (!attendanceRecords) return { overall: 0, thisMonth: 0, subjects: [], recentClasses: [] };

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const totalCount = attendanceRecords.length;
    const overall = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    // This month
    const thisMonth = new Date().getMonth();
    const thisMonthRecords = attendanceRecords.filter(r => new Date(r.date).getMonth() === thisMonth);
    const thisMonthPresent = thisMonthRecords.filter(r => r.status === 'present').length;
    const thisMonthPercentage = thisMonthRecords.length > 0
      ? Math.round((thisMonthPresent / thisMonthRecords.length) * 100) : 0;

    // Group by subject
    const subjectMap = new Map<string, { present: number; total: number }>();
    attendanceRecords.forEach(record => {
      const subject = record.classes?.courses?.name || 'Unknown';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { present: 0, total: 0 });
      }
      const stats = subjectMap.get(subject)!;
      stats.total++;
      if (record.status === 'present') stats.present++;
    });

    const subjects = Array.from(subjectMap.entries()).map(([name, stats]) => ({
      name,
      present: stats.present,
      total: stats.total,
      percentage: Math.round((stats.present / stats.total) * 100)
    }));

    const recentClasses = attendanceRecords.slice(0, 8).map(r => ({
      date: r.date,
      subject: r.classes?.courses?.name || 'Unknown',
      status: r.status
    }));

    return { overall, thisMonth: thisMonthPercentage, subjects, recentClasses };
  }, [attendanceRecords]);

  const toggleAttendance = (studentId: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const toggleSelectAll = () => {
    const allSelected = filteredStudents.every(s => attendanceState[s.id]);
    const newState: Record<string, boolean> = {};
    filteredStudents.forEach(s => {
      newState[s.id] = !allSelected;
    });
    setAttendanceState(newState);
  };

  const handleSaveAttendance = async () => {
    if (!user?.id || filteredStudents.length === 0) {
      toast.error('Please select students to mark attendance');
      return;
    }

    if (!selectedClass) {
      toast.error('Please select a class/period');
      return;
    }

    const records = filteredStudents.map(student => ({
      studentId: student.id,
      status: attendanceState[student.id] ? 'present' as const : 'absent' as const
    }));

    try {
      await markAttendance.mutateAsync({
        classId: selectedClass,
        date: new Date().toISOString().split('T')[0],
        records,
        markedBy: user.id
      });
      toast.success('Attendance saved successfully');
      setAttendanceState({});
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <Check className="h-4 w-4 text-success" />;
      case 'absent': return <X className="h-4 w-4 text-destructive" />;
      case 'late': return <Clock className="h-4 w-4 text-warning" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-success/10 text-success border-success/30">Present</Badge>;
      case 'absent': return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Absent</Badge>;
      case 'late': return <Badge className="bg-warning/10 text-warning border-warning/30">Late</Badge>;
      default: return null;
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

  if (isTeacher) {
    const showStudentList = selectedClass && selectedDepartment && selectedSemester;
    const presentCount = Object.values(attendanceState).filter(Boolean).length;
    const absentCount = filteredStudents.length - presentCount;

    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">Take Attendance</h1>
              <p className="text-muted-foreground">Mark attendance by class and section</p>
            </div>
            <Button variant="outline" onClick={() => setCreatePeriodOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Period
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Class/Period" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.courses?.name} - {cls.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {SEMESTERS.map((sem) => (
                  <SelectItem key={sem.value} value={sem.value}>
                    {sem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!showStudentList ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select department and semester to view students</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="font-display">
                      {selectedDepartment} - {selectedSemester}
                    </CardTitle>
                    <CardDescription>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Present: {presentCount}
                    </Badge>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive">
                      Absent: {absentCount}
                    </Badge>
                    <Button variant="hero" onClick={handleSaveAttendance} disabled={markAttendance.isPending || filteredStudents.length === 0}>
                      {markAttendance.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStudents.length > 0 ? (
                  <div className="space-y-2">
                    {/* Select All */}
                    <div
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={toggleSelectAll}
                    >
                      <Checkbox
                        checked={filteredStudents.length > 0 && filteredStudents.every(s => attendanceState[s.id])}
                      />
                      <span className="font-medium">Select All</span>
                    </div>

                    {/* Student List */}
                    {filteredStudents.map((student, index) => (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors",
                          attendanceState[student.id]
                            ? "bg-success/10 border border-success/30"
                            : "bg-muted/30 hover:bg-muted/50"
                        )}
                        onClick={() => toggleAttendance(student.id)}
                      >
                        <Checkbox checked={!!attendanceState[student.id]} />
                        <span className="w-8 text-muted-foreground">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium">{student.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        {attendanceState[student.id] ? (
                          <Badge className="bg-success/10 text-success border-success/30">Present</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Absent</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No students found for {selectedDepartment} - {selectedSemester}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <CreatePeriodDialog open={createPeriodOpen} onOpenChange={setCreatePeriodOpen} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track your class attendance</p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Attendance</p>
                  <p className="text-3xl font-display font-bold">{attendanceStats.overall}%</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={attendanceStats.overall} className="h-2 mt-4" />
            </CardContent>
          </Card>
          <Card className="shadow-card bg-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-3xl font-display font-bold text-success">{attendanceStats.thisMonth}%</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={cn(
                    "text-xl font-display font-bold",
                    attendanceStats.overall >= 75 ? "text-success" : "text-destructive"
                  )}>
                    {attendanceStats.overall >= 75 ? 'Good Standing' : 'Low Attendance'}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl",
                  attendanceStats.overall >= 75 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {attendanceStats.overall >= 75 ? (
                    <Check className="h-6 w-6 text-success" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Attendance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Subject-wise Attendance</CardTitle>
            <CardDescription>Your attendance breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceStats.subjects.length > 0 ? (
              <div className="space-y-4">
                {attendanceStats.subjects.map((subject) => (
                  <div key={subject.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subject.name}</span>
                        {subject.percentage < 75 && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "font-semibold",
                          subject.percentage >= 90 ? "text-success" :
                            subject.percentage >= 75 ? "text-warning" : "text-destructive"
                        )}>
                          {subject.percentage}%
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({subject.present}/{subject.total} classes)
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={subject.percentage}
                      className={cn(
                        "h-2",
                        subject.percentage >= 90 ? "[&>div]:bg-success" :
                          subject.percentage >= 75 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No attendance records found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceStats.recentClasses.length > 0 ? (
              <div className="space-y-3">
                {attendanceStats.recentClasses.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(cls.status)}
                      <div>
                        <p className="font-medium">{cls.subject}</p>
                        <p className="text-sm text-muted-foreground">{cls.date}</p>
                      </div>
                    </div>
                    {getStatusBadge(cls.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent attendance records</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
