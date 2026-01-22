-- Create security definer function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin'
  )
$$;

-- Create helper function to check if user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'teacher'
  )
$$;

-- Drop old problematic policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;

-- Create new policies using security definer functions
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Teachers can view student profiles" ON public.profiles
FOR SELECT USING (public.is_teacher(auth.uid()));

-- Fix other tables that have the same issue (querying profiles table in RLS)

-- Drop and recreate problematic policies on assignments
DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
CREATE POLICY "Admins manage assignments" ON public.assignments
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on attendance
DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;
CREATE POLICY "Admins manage attendance" ON public.attendance
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on chat_logs
DROP POLICY IF EXISTS "Admins see all chat logs" ON public.chat_logs;
CREATE POLICY "Admins see all chat logs" ON public.chat_logs
FOR SELECT USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on classes
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on enrollments
DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments" ON public.enrollments
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on escalated_queries
DROP POLICY IF EXISTS "Staff manage escalations" ON public.escalated_queries;
CREATE POLICY "Staff manage escalations" ON public.escalated_queries
FOR ALL USING (public.is_admin(auth.uid()) OR public.is_teacher(auth.uid()));

-- Drop and recreate problematic policies on fees
DROP POLICY IF EXISTS "Admins manage fees" ON public.fees;
CREATE POLICY "Admins manage fees" ON public.fees
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on knowledge_base
DROP POLICY IF EXISTS "Admins manage knowledge base" ON public.knowledge_base;
CREATE POLICY "Admins manage knowledge base" ON public.knowledge_base
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on materials
DROP POLICY IF EXISTS "Admins manage all materials" ON public.materials;
CREATE POLICY "Admins manage all materials" ON public.materials
FOR ALL USING (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on notifications
DROP POLICY IF EXISTS "Admins send notifications" ON public.notifications;
CREATE POLICY "Admins send notifications" ON public.notifications
FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Drop and recreate problematic policies on timetable
DROP POLICY IF EXISTS "Admins manage timetable" ON public.timetable;
CREATE POLICY "Admins manage timetable" ON public.timetable
FOR ALL USING (public.is_admin(auth.uid()));