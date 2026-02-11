import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import VerificationStatus from "./pages/VerificationStatus";
import Dashboard from "./pages/Dashboard";
import SidebarLayout from "./components/layout/SidebarLayout";
import Timetable from "./pages/Timetable";
import Syllabus from "./pages/Syllabus";
import Assignments from "./pages/Assignments";
import Notes from "./pages/Notes";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import Notifications from "./pages/Notifications";
import Fees from "./pages/Fees";
import Users from "./pages/Users";
import Upload from "./pages/Upload";
import QueryBot from "./pages/QueryBot";
import CGPACalculator from "./pages/CGPACalculator";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import UploadUsers from "./pages/UploadUsers";
import PromoteUsers from "./pages/PromoteUsers";
import MasterListUpload from "./pages/MasterListUpload";
// New feature pages
import ExamSchedule from "./pages/ExamSchedule";
import AcademicCalendar from "./pages/AcademicCalendar";
import PreviousPapers from "./pages/PreviousPapers";
import Announcements from "./pages/Announcements";
import DiscussionForums from "./pages/DiscussionForums";
import FacultyFeedback from "./pages/FacultyFeedback";
import Library from "./pages/Library";
import LostAndFound from "./pages/LostAndFound";
import Events from "./pages/Events";

const queryClient = new QueryClient();

// Basic protected route - just checks if logged in
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Verified route - checks onboarding and verification status for students
function VerifiedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userRole } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      // @ts-ignore - new fields not in generated types yet
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_complete, verification_status, role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only students need onboarding and verification
  if (profile?.role === 'student' || userRole === 'student') {
    // Check onboarding first
    if (!profile?.onboarding_complete) {
      return <Navigate to="/onboarding" replace />;
    }

    // Then check verification
    if (profile?.verification_status !== 'verified') {
      return <Navigate to="/verification-status" replace />;
    }
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />

    {/* Onboarding and Verification - protected but not verified */}
    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
    <Route path="/verification-status" element={<ProtectedRoute><VerificationStatus /></ProtectedRoute>} />

    {/* Main app routes - require verification */}
    <Route element={<VerifiedRoute><SidebarLayout /></VerifiedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/timetable" element={<Timetable />} />
      <Route path="/syllabus" element={<Syllabus />} />
      <Route path="/assignments" element={<Assignments />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/grades" element={<Grades />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/fees" element={<Fees />} />
      <Route path="/users" element={<Users />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/query-bot" element={<QueryBot />} />
      <Route path="/cgpa-calculator" element={<CGPACalculator />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/upload-users" element={<UploadUsers />} />
      <Route path="/promote-users" element={<PromoteUsers />} />
      <Route path="/master-list-upload" element={<MasterListUpload />} />
      {/* New feature routes */}
      <Route path="/exam-schedule" element={<ExamSchedule />} />
      <Route path="/academic-calendar" element={<AcademicCalendar />} />
      <Route path="/previous-papers" element={<PreviousPapers />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/discussion-forums" element={<DiscussionForums />} />
      <Route path="/faculty-feedback" element={<FacultyFeedback />} />
      <Route path="/library" element={<Library />} />
      <Route path="/lost-and-found" element={<LostAndFound />} />
      <Route path="/events" element={<Events />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

