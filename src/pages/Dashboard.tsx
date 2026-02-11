import { useAuth } from '@/hooks/useAuth';
import {
  useAttendance,
  useAssignments,
  useStudentAssignments, // Added
  useSubmissions,
  useNotifications,
  useFees,
  useTimetable,
  useStudentTimetable, // Added
  useMaterials,
  useCourses,
  useProfiles
} from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import StatsGrid from '@/components/dashboard/StatsGrid';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import GradesChart from '@/components/dashboard/GradesChart';
import UpcomingSchedule from '@/components/dashboard/UpcomingSchedule';
import QuickActions from '@/components/dashboard/QuickActions';
import AssignmentsList from '@/components/dashboard/AssignmentsList';
import DatabaseSeeder from '@/components/dashboard/DatabaseSeeder';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  BookOpen,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Calendar,
  Bell,
  FileText,
  Clock,
  TrendingUp,
  GraduationCap,
  Upload,
  Loader2,
  MessageSquare,
  DollarSign,
  Activity,
  Shield,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatePeriodDialog from '@/components/classes/CreatePeriodDialog';
import { useState } from 'react';


function StudentDashboard() {
  const { user } = useAuth();
  const { data: profiles } = useProfiles();
  const { data: attendance, isLoading: attendanceLoading } = useAttendance(user?.id);
  // Use new student-specific hooks
  const { data: assignments, isLoading: assignmentsLoading } = useStudentAssignments(user?.id || '');
  const { data: submissions } = useSubmissions(user?.id);
  const { data: notifications } = useNotifications(user?.id);
  const { data: fees } = useFees(user?.id);
  const { data: timetable } = useStudentTimetable(user?.id || '');

  // Get current user profile
  const currentProfile = profiles?.find(p => p.id === user?.id);

  // Calculate attendance stats
  const totalClasses = attendance?.length || 0;
  const presentClasses = attendance?.filter(a => a.status === 'present').length || 0;
  const absentClasses = attendance?.filter(a => a.status === 'absent').length || 0;
  const lateClasses = attendance?.filter(a => a.status === 'late').length || 0;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  // Get pending assignments
  const pendingAssignments = assignments?.filter(a => {
    const submission = submissions?.find(s => s.assignment_id === a.id);
    return !submission && new Date(a.due_date) > new Date();
  }) || [];

  // Get unread notifications
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  // Calculate fee status
  const totalFees = fees?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
  const paidFees = fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
  const pendingFees = totalFees - paidFees;

  // Get today's schedule
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = timetable?.filter(t => t.day_of_week === today) || [];

  // Calculate grades data from submissions
  const gradesData = submissions?.filter(s => s.marks !== null).map(s => {
    const assignment = assignments?.find(a => a.id === s.assignment_id);
    return {
      subject: (assignment?.classes as any)?.courses?.name?.substring(0, 15) || 'Subject',
      marks: s.marks || 0,
      maxMarks: assignment?.max_marks || 100,
    };
  }).slice(0, 5) || [];

  if (attendanceLoading || assignmentsLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={1} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <LoadingSkeleton variant="card" count={4} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </div>
    );
  }

  // Format assignments for the list component
  const formattedAssignments = pendingAssignments.map(a => ({
    id: a.id,
    title: a.title,
    course: (a.classes as any)?.courses?.name || 'Course',
    dueDate: a.due_date,
    maxMarks: a.max_marks,
    status: 'pending' as const,
  }));

  // Format schedule for the component
  const scheduleItems = todaySchedule.map((item, index) => ({
    id: String(index),
    time: item.start_time?.substring(0, 5) || '',
    endTime: item.end_time?.substring(0, 5),
    subject: (item.classes as any)?.courses?.name || 'Class',
    teacher: (item.classes as any)?.profiles?.full_name,
    room: item.room || 'TBA',
    status: 'upcoming' as const,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Card */}
      <WelcomeCard
        userName={currentProfile?.full_name || user?.email?.split('@')[0] || 'Student'}
        role="student"
        rollNumber={currentProfile?.roll_number || undefined}
        department={currentProfile?.department || undefined}
        avatarUrl={currentProfile?.avatar_url}
      />

      {/* Mobile-First Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsGrid stats={[
          {
            title: 'Attendance',
            value: `${attendancePercentage}%`,
            icon: <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6" />,
            variant: attendancePercentage >= 75 ? 'success' : 'warning',
            description: `${presentClasses}/${totalClasses} classes`,
            compact: true,
          },
          {
            title: 'Assignments',
            value: pendingAssignments.length,
            icon: <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />,
            variant: pendingAssignments.length > 0 ? 'warning' : 'success',
            description: pendingAssignments.length > 0 ? 'Due soon' : 'All done',
            compact: true,
          },
          {
            title: 'Notifications',
            value: unreadNotifications,
            icon: <Bell className="h-5 w-5 sm:h-6 sm:w-6" />,
            variant: 'info',
            description: 'Unread',
            compact: true,
          },
          {
            title: 'Fees',
            value: pendingFees > 0 ? `₹${pendingFees.toLocaleString()}` : '₹0',
            icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />,
            variant: pendingFees > 0 ? 'destructive' : 'success',
            description: pendingFees > 0 ? 'Pending' : 'Clear',
            compact: true,
          },
        ]} />
      </div>

      {/* Mobile-First Charts */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AttendanceChart
              present={presentClasses}
              absent={absentClasses}
              late={lateClasses}
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Recent Grades</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <GradesChart data={gradesData} />
          </CardContent>
        </Card>
      </div>

      {/* Schedule and Quick Actions */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingSchedule
            title="Today's Schedule"
            date={today}
            items={scheduleItems}
          />
        </div>
        <QuickActions
          columns={2}
          actions={[
            { label: 'Assignments', icon: ClipboardList, href: '/assignments', variant: 'default' },
            { label: 'Attendance', icon: CheckSquare, href: '/attendance', variant: 'default' },
            { label: 'Study Materials', icon: FileText, href: '/notes', variant: 'default' },
            { label: 'AI Assistant', icon: GraduationCap, href: '/query-bot', variant: 'accent' },
          ]}
        />
      </div>

      {/* Pending Assignments */}
      <AssignmentsList assignments={formattedAssignments} />
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { data: assignments, isLoading } = useAssignments();
  const { data: materials } = useMaterials();
  const { data: timetable } = useTimetable();
  const [createClassOpen, setCreateClassOpen] = useState(false);


  // Get today's classes count
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetable?.filter(t => t.day_of_week === today).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Faculty'}
        role="teacher"
      />

      {/* Stats Grid */}
      <StatsGrid stats={[
        {
          title: 'Active Assignments',
          value: assignments?.length || 0,
          icon: <ClipboardList className="h-6 w-6" />,
          variant: 'primary',
        },
        {
          title: 'Materials Uploaded',
          value: materials?.length || 0,
          icon: <FileText className="h-6 w-6" />,
          variant: 'info',
        },
        {
          title: 'Classes Today',
          value: todayClasses,
          icon: <Calendar className="h-6 w-6" />,
          variant: 'success',
        },
        {
          title: 'Pending Grading',
          value: 0,
          icon: <BarChart3 className="h-6 w-6" />,
          variant: 'warning',
        },
      ]} />

      {/* Quick Actions and Recent Assignments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions
          columns={2}
          actions={[
            { label: 'Take Attendance', icon: CheckSquare, href: '/attendance', variant: 'primary' },
            { label: 'Upload Notes', icon: Upload, href: '/upload', variant: 'default' },
            { label: 'Assignments', icon: ClipboardList, href: '/assignments', variant: 'default' },
            { label: 'Grade Work', icon: BarChart3, href: '/grades', variant: 'default' },
            { label: 'View Timetable', icon: Calendar, href: '/timetable', variant: 'default' },
            { label: 'AI Assistant', icon: GraduationCap, href: '/query-bot', variant: 'accent' },
          ]}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments?.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No assignments created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments?.slice(0, 4).map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{assignment.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{assignment.max_marks} marks</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const { data: notifications } = useNotifications();
  const { data: profiles } = useProfiles();
  const { data: courses } = useCourses();
  const { data: fees } = useFees();
  const { data: timetable } = useTimetable();

  // Calculate user counts
  const totalUsers = profiles?.length || 0;
  const studentCount = profiles?.filter(p => p.role === 'student').length || 0;
  const teacherCount = profiles?.filter(p => p.role === 'teacher').length || 0;

  // Calculate fee collection
  const totalCollected = fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0;

  // Get today's schedule count
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetable?.filter(t => t.day_of_week === today).length || 0;
  const totalScheduledClasses = timetable?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}
        role="admin"
      />

      {/* Stats Grid */}
      <StatsGrid stats={[
        {
          title: 'Total Users',
          value: totalUsers,
          icon: <Users className="h-6 w-6" />,
          variant: 'primary',
        },
        {
          title: 'Active Courses',
          value: courses?.length || 0,
          icon: <BookOpen className="h-6 w-6" />,
          variant: 'success',
        },
        {
          title: 'Notifications Sent',
          value: notifications?.length || 0,
          icon: <Bell className="h-6 w-6" />,
          variant: 'info',
        },
        {
          title: 'Fee Collection',
          value: totalCollected > 0 ? `₹${(totalCollected / 100000).toFixed(1)}L` : '₹0',
          icon: <TrendingUp className="h-6 w-6" />,
          variant: 'warning',
        },
      ]} />

      {/* Quick Actions and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <QuickActions
          columns={2}
          actions={[
            { label: 'Manage Users', icon: Users, href: '/users', variant: 'primary' },
            { label: 'Notifications', icon: Bell, href: '/notifications', variant: 'default' },
            { label: 'Fee Management', icon: DollarSign, href: '/fees', variant: 'default' },
            { label: 'Timetable', icon: Calendar, href: '/timetable', variant: 'default' },
            { label: 'AI Assistant', icon: GraduationCap, href: '/query-bot', variant: 'accent' },
          ]}
        />

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentCount}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/20">
                    <BookOpen className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teacherCount}</p>
                    <p className="text-xs text-muted-foreground">Faculty</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-500/20">
                    <BookOpen className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{courses?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Timetable Overview
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/timetable">Manage Timetable</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayClasses}</p>
                  <p className="text-xs text-muted-foreground">Classes Today ({today})</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-500/10">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalScheduledClasses}</p>
                  <p className="text-xs text-muted-foreground">Total Scheduled</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teacherCount}</p>
                  <p className="text-xs text-muted-foreground">Active Faculty</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold mt-1">Healthy</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-600 inline-block"></span>
                  All services operational
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Chatbot</p>
                <p className="text-2xl font-bold mt-1">Active</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ready to assist
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="text-2xl font-bold mt-1">Connected</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last sync: Just now
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Seeder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DatabaseSeeder />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userRole, user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {userRole === 'student' && <StudentDashboard />}
      {userRole === 'teacher' && <TeacherDashboard />}
      {userRole === 'admin' && <AdminDashboard />}
      {!userRole && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="p-6 rounded-full bg-primary/10 mb-6">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Miracle LMS</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Your role has not been assigned yet. Please contact the administrator for access.
          </p>
          <Button asChild>
            <Link to="/query-bot">Talk to AI Assistant</Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
