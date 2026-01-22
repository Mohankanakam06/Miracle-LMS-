import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
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
