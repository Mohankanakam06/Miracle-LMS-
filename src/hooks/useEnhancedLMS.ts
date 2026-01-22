import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =============================================
// TYPES
// =============================================

export interface ExamSchedule {
  id: string;
  course_id: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  department: string | null;
  semester: string | null;
  regulation: string | null;
  max_marks: number;
  created_by: string;
  created_at: string;
  courses?: { name: string; code: string };
}

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  department: string | null;
  is_holiday: boolean;
  created_by: string | null;
  created_at: string;
}

export interface SyllabusProgress {
  id: string;
  class_id: string;
  unit_number: number;
  unit_title: string;
  total_topics: number;
  completed_topics: number;
  status: string;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreviousPaper {
  id: string;
  course_id: string | null;
  title: string;
  exam_type: string;
  exam_year: string;
  regulation: string | null;
  file_url: string;
  uploaded_by: string;
  created_at: string;
  courses?: { name: string; code: string };
}

export interface DiscussionForum {
  id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  profiles?: { full_name: string };
  post_count?: number;
}

export interface ForumPost {
  id: string;
  forum_id: string;
  parent_id: string | null;
  content: string;
  author_id: string;
  is_answer: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string;
  target_department: string | null;
  target_semester: string | null;
  attachment_url: string | null;
  is_pinned: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  profiles?: { full_name: string };
}

export interface FacultyFeedback {
  id: string;
  faculty_id: string;
  class_id: string;
  student_id: string;
  rating: number;
  teaching_quality: number;
  communication: number;
  punctuality: number;
  course_content: number;
  comments: string | null;
  is_anonymous: boolean;
  semester: string | null;
  academic_year: string | null;
  created_at: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  department: string | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface LibraryBorrowing {
  id: string;
  book_id: string;
  student_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  fine_amount: number;
  status: string;
  library_books?: LibraryBook;
}

export interface LostFoundItem {
  id: string;
  item_name: string;
  description: string | null;
  category: string;
  type: string;
  location: string;
  date_reported: string;
  image_url: string | null;
  contact_info: string | null;
  status: string;
  reported_by: string;
  claimed_by: string | null;
  created_at: string;
  profiles?: { full_name: string };
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  venue: string | null;
  start_datetime: string;
  end_datetime: string | null;
  registration_required: boolean;
  max_participants: number | null;
  registration_deadline: string | null;
  image_url: string | null;
  organizer: string | null;
  department: string | null;
  is_featured: boolean;
  created_by: string;
  created_at: string;
  registration_count?: number;
  is_registered?: boolean;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attendance_marked: boolean;
}

// =============================================
// ACADEMIC HOOKS
// =============================================

export function useExamSchedule(department?: string, semester?: string) {
  return useQuery({
    queryKey: ['exam-schedule', department, semester],
    queryFn: async () => {
      let query = supabase
        .from('exam_schedule')
        .select('*')
        .order('exam_date', { ascending: true });

      if (department) query = query.eq('department', department);
      if (semester) query = query.eq('semester', semester);

      const { data, error } = await query;
      if (error) throw error;
      return data as ExamSchedule[];
    },
  });
}

export function useAddExamSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exam: Omit<ExamSchedule, 'id' | 'created_at' | 'courses'>) => {
      const { data, error } = await supabase
        .from('exam_schedule')
        .insert(exam)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-schedule'] });
      toast({ title: 'Exam schedule added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add exam', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAcademicCalendar() {
  return useQuery({
    queryKey: ['academic-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_calendar')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data as AcademicCalendarEvent[];
    },
  });
}

export function useAddCalendarEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: Omit<AcademicCalendarEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('academic_calendar')
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-calendar'] });
      toast({ title: 'Calendar event added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add event', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSyllabusProgress(classId?: string) {
  return useQuery({
    queryKey: ['syllabus-progress', classId],
    queryFn: async () => {
      let query = supabase
        .from('syllabus_progress')
        .select('*')
        .order('unit_number', { ascending: true });

      if (classId) query = query.eq('class_id', classId);

      const { data, error } = await query;
      if (error) throw error;
      return data as SyllabusProgress[];
    },
  });
}

export function useUpdateSyllabusProgress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SyllabusProgress> & { id: string }) => {
      const { data, error } = await supabase
        .from('syllabus_progress')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-progress'] });
      toast({ title: 'Progress updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update progress', description: error.message, variant: 'destructive' });
    },
  });
}

export function usePreviousPapers(courseId?: string, regulation?: string) {
  return useQuery({
    queryKey: ['previous-papers', courseId, regulation],
    queryFn: async () => {
      let query = supabase
        .from('previous_papers')
        .select('*')
        .order('exam_year', { ascending: false });

      if (courseId) query = query.eq('course_id', courseId);
      if (regulation) query = query.eq('regulation', regulation);

      const { data, error } = await query;
      if (error) throw error;
      return data as PreviousPaper[];
    },
  });
}

export function useUploadPreviousPaper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paper: Omit<PreviousPaper, 'id' | 'created_at' | 'courses'>) => {
      const { data, error } = await supabase
        .from('previous_papers')
        .insert(paper)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previous-papers'] });
      toast({ title: 'Previous paper uploaded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to upload paper', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// COMMUNICATION HOOKS
// =============================================

export function useDiscussionForums(classId?: string) {
  return useQuery({
    queryKey: ['discussion-forums', classId],
    queryFn: async () => {
      let query = supabase
        .from('discussion_forums')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (classId) query = query.eq('class_id', classId);

      const { data, error } = await query;
      if (error) throw error;
      return data as DiscussionForum[];
    },
  });
}

export function useCreateForum() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (forum: { title: string; description?: string; class_id?: string; created_by: string }) => {
      const { data, error } = await supabase
        .from('discussion_forums')
        .insert(forum)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-forums'] });
      toast({ title: 'Forum created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create forum', description: error.message, variant: 'destructive' });
    },
  });
}

export function useForumPosts(forumId: string) {
  return useQuery({
    queryKey: ['forum-posts', forumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('forum_id', forumId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ForumPost[];
    },
    enabled: !!forumId,
  });
}

export function useCreateForumPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (post: { forum_id: string; content: string; author_id: string; parent_id?: string }) => {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', variables.forum_id] });
      toast({ title: 'Reply posted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to post reply', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (announcement: Omit<Announcement, 'id' | 'created_at' | 'profiles'>) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcement)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement published' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to publish announcement', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSubmitFacultyFeedback() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (feedback: Omit<FacultyFeedback, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('faculty_feedback')
        .insert(feedback)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Feedback submitted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to submit feedback', description: error.message, variant: 'destructive' });
    },
  });
}

export function useFacultyFeedbackStats(facultyId: string) {
  return useQuery({
    queryKey: ['faculty-feedback-stats', facultyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faculty_feedback')
        .select('rating, teaching_quality, communication, punctuality, course_content')
        .eq('faculty_id', facultyId);
      if (error) throw error;

      if (!data || data.length === 0) return null;

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

      return {
        totalResponses: data.length,
        avgRating: avg(data.map(f => f.rating || 0)),
        avgTeachingQuality: avg(data.map(f => f.teaching_quality || 0)),
        avgCommunication: avg(data.map(f => f.communication || 0)),
        avgPunctuality: avg(data.map(f => f.punctuality || 0)),
        avgCourseContent: avg(data.map(f => f.course_content || 0)),
      };
    },
    enabled: !!facultyId,
  });
}

// =============================================
// UTILITY HOOKS
// =============================================

export function useLibraryBooks(category?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ['library-books', category, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('library_books')
        .select('*')
        .order('title', { ascending: true });

      if (category) query = query.eq('category', category);
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LibraryBook[];
    },
  });
}

export function useAddLibraryBook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (book: Omit<LibraryBook, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('library_books')
        .insert(book)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      toast({ title: 'Book added to library' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add book', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMyBorrowings(studentId: string) {
  return useQuery({
    queryKey: ['my-borrowings', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_borrowings')
        .select('*, library_books(*)')
        .eq('student_id', studentId)
        .order('borrowed_at', { ascending: false });
      if (error) throw error;
      return data as LibraryBorrowing[];
    },
    enabled: !!studentId,
  });
}

export function useBorrowBook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ book_id, student_id, due_date }: { book_id: string; student_id: string; due_date: string }) => {
      // First check availability
      const { data: book, error: bookError } = await supabase
        .from('library_books')
        .select('available_copies')
        .eq('id', book_id)
        .single();

      if (bookError) throw bookError;
      if (!book || book.available_copies < 1) throw new Error('Book not available');

      // Create borrowing record
      const { data, error } = await supabase
        .from('library_borrowings')
        .insert({ book_id, student_id, due_date })
        .select()
        .single();
      if (error) throw error;

      // Decrease available copies
      await supabase
        .from('library_books')
        .update({ available_copies: book.available_copies - 1 })
        .eq('id', book_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] });
      toast({ title: 'Book borrowed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to borrow book', description: error.message, variant: 'destructive' });
    },
  });
}

export function useLostFoundItems(type?: string) {
  return useQuery({
    queryKey: ['lost-found', type],
    queryFn: async () => {
      let query = supabase
        .from('lost_found')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (type) query = query.eq('type', type);

      const { data, error } = await query;
      if (error) throw error;
      return data as LostFoundItem[];
    },
  });
}

export function useReportLostFound() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<LostFoundItem, 'id' | 'created_at' | 'status' | 'claimed_by' | 'profiles'>) => {
      const { data, error } = await supabase
        .from('lost_found')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lost-found'] });
      toast({ title: 'Item reported successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to report item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useEvents(eventType?: string) {
  return useQuery({
    queryKey: ['events', eventType],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true });

      if (eventType) query = query.eq('event_type', eventType);

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: Omit<Event, 'id' | 'created_at' | 'registration_count' | 'is_registered'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create event', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ event_id, user_id }: { event_id: string; user_id: string }) => {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({ event_id, user_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      toast({ title: 'Registered for event' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to register', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMyEventRegistrations(userId: string) {
  return useQuery({
    queryKey: ['my-event-registrations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map(r => r.event_id);
    },
    enabled: !!userId,
  });
}
