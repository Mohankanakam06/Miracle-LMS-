-- =============================================
-- ACADEMIC ENHANCEMENTS
-- =============================================

-- Exam Schedule Table
CREATE TABLE public.exam_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  exam_type TEXT NOT NULL, -- 'mid1', 'mid2', 'final', 'internal'
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  department TEXT,
  semester TEXT,
  regulation TEXT,
  max_marks INTEGER DEFAULT 100,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Academic Calendar Table
CREATE TABLE public.academic_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'holiday', 'exam', 'event', 'deadline', 'semester_start', 'semester_end'
  start_date DATE NOT NULL,
  end_date DATE,
  department TEXT, -- NULL means all departments
  is_holiday BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Syllabus Progress Table
CREATE TABLE public.syllabus_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  unit_number INTEGER NOT NULL,
  unit_title TEXT NOT NULL,
  total_topics INTEGER NOT NULL DEFAULT 5,
  completed_topics INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Previous Year Papers Table
CREATE TABLE public.previous_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID,
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL, -- 'mid1', 'mid2', 'final'
  exam_year TEXT NOT NULL,
  regulation TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- COMMUNICATION FEATURES
-- =============================================

-- Discussion Forums Table
CREATE TABLE public.discussion_forums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forum Posts Table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES public.discussion_forums(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  is_answer BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements Table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  target_audience TEXT DEFAULT 'all', -- 'all', 'students', 'teachers', 'department'
  target_department TEXT,
  target_semester TEXT,
  attachment_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Faculty Feedback Table
CREATE TABLE public.faculty_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL,
  class_id UUID NOT NULL,
  student_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  teaching_quality INTEGER CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  course_content INTEGER CHECK (course_content >= 1 AND course_content <= 5),
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  semester TEXT,
  academic_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- UTILITY FEATURES
-- =============================================

-- Library Books Table
CREATE TABLE public.library_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  category TEXT,
  department TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  shelf_location TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Library Borrowings Table
CREATE TABLE public.library_borrowings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  borrowed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMP WITH TIME ZONE,
  fine_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'borrowed' -- 'borrowed', 'returned', 'overdue'
);

-- Lost and Found Table
CREATE TABLE public.lost_found (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'electronics', 'documents', 'accessories', 'books', 'other'
  type TEXT NOT NULL, -- 'lost', 'found'
  location TEXT NOT NULL,
  date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  contact_info TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'claimed', 'closed'
  reported_by UUID NOT NULL,
  claimed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events Calendar Table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'workshop', 'seminar', 'cultural', 'sports', 'placement', 'tech_fest'
  venue TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  registration_required BOOLEAN DEFAULT false,
  max_participants INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  organizer TEXT,
  department TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event Registrations Table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attendance_marked BOOLEAN DEFAULT false,
  UNIQUE(event_id, user_id)
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Exam Schedule Policies
CREATE POLICY "Anyone can view exam schedule" ON public.exam_schedule FOR SELECT USING (true);
CREATE POLICY "Admins manage exam schedule" ON public.exam_schedule FOR ALL USING (is_admin(auth.uid()));

-- Academic Calendar Policies
CREATE POLICY "Anyone can view academic calendar" ON public.academic_calendar FOR SELECT USING (true);
CREATE POLICY "Admins manage academic calendar" ON public.academic_calendar FOR ALL USING (is_admin(auth.uid()));

-- Syllabus Progress Policies
CREATE POLICY "Anyone can view syllabus progress" ON public.syllabus_progress FOR SELECT USING (true);
CREATE POLICY "Admins manage syllabus progress" ON public.syllabus_progress FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Teachers update own class syllabus" ON public.syllabus_progress FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = syllabus_progress.class_id AND classes.teacher_id = auth.uid()));

-- Previous Papers Policies
CREATE POLICY "Anyone can view previous papers" ON public.previous_papers FOR SELECT USING (true);
CREATE POLICY "Admins manage previous papers" ON public.previous_papers FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Teachers upload previous papers" ON public.previous_papers FOR INSERT WITH CHECK (is_teacher(auth.uid()));

-- Discussion Forums Policies
CREATE POLICY "Anyone can view forums" ON public.discussion_forums FOR SELECT USING (true);
CREATE POLICY "Authenticated users create forums" ON public.discussion_forums FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage all forums" ON public.discussion_forums FOR ALL USING (is_admin(auth.uid()));

-- Forum Posts Policies
CREATE POLICY "Anyone can view posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own posts" ON public.forum_posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Admins manage all posts" ON public.forum_posts FOR ALL USING (is_admin(auth.uid()));

-- Announcements Policies
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Teachers create announcements" ON public.announcements FOR INSERT WITH CHECK (is_teacher(auth.uid()));

-- Faculty Feedback Policies
CREATE POLICY "Students submit feedback" ON public.faculty_feedback FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins view all feedback" ON public.faculty_feedback FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Faculty view own feedback" ON public.faculty_feedback FOR SELECT USING (faculty_id = auth.uid() AND is_anonymous = false);

-- Library Books Policies
CREATE POLICY "Anyone can view library books" ON public.library_books FOR SELECT USING (true);
CREATE POLICY "Admins manage library books" ON public.library_books FOR ALL USING (is_admin(auth.uid()));

-- Library Borrowings Policies
CREATE POLICY "Students view own borrowings" ON public.library_borrowings FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admins manage all borrowings" ON public.library_borrowings FOR ALL USING (is_admin(auth.uid()));

-- Lost and Found Policies
CREATE POLICY "Anyone can view lost found items" ON public.lost_found FOR SELECT USING (true);
CREATE POLICY "Authenticated users report items" ON public.lost_found FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own reports" ON public.lost_found FOR UPDATE USING (reported_by = auth.uid());
CREATE POLICY "Admins manage all lost found" ON public.lost_found FOR ALL USING (is_admin(auth.uid()));

-- Events Policies
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Teachers create events" ON public.events FOR INSERT WITH CHECK (is_teacher(auth.uid()));

-- Event Registrations Policies
CREATE POLICY "Users view own registrations" ON public.event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users register for events" ON public.event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage all registrations" ON public.event_registrations FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- ENABLE REALTIME FOR KEY TABLES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;