import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useLMS';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  ClipboardList,
  Bell,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  CreditCard,
  MessageSquare,
  Upload,
  CheckSquare,
  Calculator,
  CalendarDays,
  Megaphone,
  MessagesSquare,
  Star,
  Library,
  Search,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  roles: ('admin' | 'teacher' | 'student')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, href: '/dashboard', roles: ['admin', 'teacher', 'student'] },
  { label: 'Timetable', icon: <Calendar className="h-5 w-5" />, href: '/timetable', roles: ['teacher', 'student'] },
  { label: 'Syllabus', icon: <BookOpen className="h-5 w-5" />, href: '/syllabus', roles: ['teacher', 'student'] },
  { label: 'Assignments', icon: <ClipboardList className="h-5 w-5" />, href: '/assignments', roles: ['teacher', 'student'] },
  { label: 'Notes & Materials', icon: <FileText className="h-5 w-5" />, href: '/notes', roles: ['teacher', 'student'] },
  { label: 'Attendance', icon: <CheckSquare className="h-5 w-5" />, href: '/attendance', roles: ['admin', 'teacher', 'student'] },
  { label: 'Grades', icon: <BarChart3 className="h-5 w-5" />, href: '/grades', roles: ['teacher', 'student'] },
  { label: 'CGPA Calculator', icon: <Calculator className="h-5 w-5" />, href: '/cgpa-calculator', roles: ['student'] },
  { label: 'Exam Schedule', icon: <CalendarDays className="h-5 w-5" />, href: '/exam-schedule', roles: ['admin', 'teacher', 'student'] },
  { label: 'Academic Calendar', icon: <Calendar className="h-5 w-5" />, href: '/academic-calendar', roles: ['admin', 'teacher', 'student'] },
  { label: 'Previous Papers', icon: <FileText className="h-5 w-5" />, href: '/previous-papers', roles: ['admin', 'teacher', 'student'] },
  { label: 'Announcements', icon: <Megaphone className="h-5 w-5" />, href: '/announcements', roles: ['admin', 'teacher', 'student'] },
  { label: 'Discussion Forums', icon: <MessagesSquare className="h-5 w-5" />, href: '/discussion-forums', roles: ['admin', 'teacher', 'student'] },
  { label: 'Faculty Feedback', icon: <Star className="h-5 w-5" />, href: '/faculty-feedback', roles: ['admin', 'teacher', 'student'] },
  { label: 'Library', icon: <Library className="h-5 w-5" />, href: '/library', roles: ['admin', 'student'] },
  { label: 'Lost & Found', icon: <Search className="h-5 w-5" />, href: '/lost-and-found', roles: ['admin', 'teacher', 'student'] },
  { label: 'Events', icon: <PartyPopper className="h-5 w-5" />, href: '/events', roles: ['admin', 'teacher', 'student'] },
  { label: 'Notifications', icon: <Bell className="h-5 w-5" />, href: '/notifications', roles: ['admin', 'teacher', 'student'] },
  { label: 'Fee Management', icon: <CreditCard className="h-5 w-5" />, href: '/fees', roles: ['admin', 'student'] },
  { label: 'Manage Users', icon: <Users className="h-5 w-5" />, href: '/users', roles: ['admin'] },
  { label: 'Upload Content', icon: <Upload className="h-5 w-5" />, href: '/upload', roles: ['admin', 'teacher'] },
  { label: 'Query Bot', icon: <MessageSquare className="h-5 w-5" />, href: '/query-bot', roles: ['admin', 'teacher', 'student'] },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifications } = useNotifications(user?.id);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredNavItems = navItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  const roleLabels = {
    admin: 'Administrator',
    teacher: 'Faculty',
    student: 'B.Tech Student',
  };

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border shadow-xl transition-transform duration-300 lg:translate-x-0 glass-heavy lg:bg-sidebar/95 backdrop-blur-xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-sidebar-border/50">
            <img src="/logo.png" alt="Miracle" className="h-12 w-12 rounded-full shadow-lg" />
            <div>
              <h1 className="font-display font-bold text-sidebar-foreground text-base tracking-tight">Miracle Portal</h1>
              <p className="text-xs text-sidebar-foreground/60 font-medium">{roleLabels[userRole as keyof typeof roleLabels] || 'User'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-auto text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6 px-4">
            <nav className="space-y-1.5">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-white shadow-md shadow-primary/20 scale-[1.02] hover-glow"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1 hover-lift"
                    )}
                  >
                    <span className={cn("transition-colors", isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border/50 backdrop-blur-md bg-sidebar/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-sidebar-accent/50 transition-colors border border-transparent hover:border-sidebar-border/50">
                  <Avatar className="h-10 w-10 border-2 border-sidebar-primary/20">
                    <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 capitalize flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Online
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-heavy border-sidebar-border">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-20 px-6 sm:px-8 glass text-foreground border-b border-border/40">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2 hover:bg-secondary"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex-1">
            <h2 className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {filteredNavItems.find(item => item.href === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-secondary rounded-full w-10 h-10"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5 text-foreground/70" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive rounded-full ring-2 ring-background"></span>
              )}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 sm:p-8 max-w-7xl mx-auto" key={location.pathname}>
          <div className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
