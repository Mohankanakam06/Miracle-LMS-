import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
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
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
    <Route path="/syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
    <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
    <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
    <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
    <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
    <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
    <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
    <Route path="/query-bot" element={<ProtectedRoute><QueryBot /></ProtectedRoute>} />
    <Route path="/cgpa-calculator" element={<ProtectedRoute><CGPACalculator /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    {/* New feature routes */}
    <Route path="/exam-schedule" element={<ProtectedRoute><ExamSchedule /></ProtectedRoute>} />
    <Route path="/academic-calendar" element={<ProtectedRoute><AcademicCalendar /></ProtectedRoute>} />
    <Route path="/previous-papers" element={<ProtectedRoute><PreviousPapers /></ProtectedRoute>} />
    <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
    <Route path="/discussion-forums" element={<ProtectedRoute><DiscussionForums /></ProtectedRoute>} />
    <Route path="/faculty-feedback" element={<ProtectedRoute><FacultyFeedback /></ProtectedRoute>} />
    <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
    <Route path="/lost-and-found" element={<ProtectedRoute><LostAndFound /></ProtectedRoute>} />
    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
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
