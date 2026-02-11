import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Helper to convert "3-2" string to semester number (6)
const getSemesterNumber = (semString: string | null): number | null => {
  if (!semString) return null;
  const match = semString.match(/^(\d)-(\d)$/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const sem = parseInt(match[2]);
  return (year - 1) * 2 + sem;
};

// Helper to convert semester number (6) to "3-2" string
const getSemesterString = (semNumber: number): string => {
  const year = Math.ceil(semNumber / 2);
  const sem = semNumber % 2 === 0 ? 2 : 1;
  return `${year}-${sem}`;
};

// Types
export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  semester: number;
  department: string;
  credits: number;
  regulation?: string;
  units?: { title: string; content: string; }[];
}

export interface ClassWithDetails {
  id: string;
  course_id: string;
  teacher_id: string;
  section: string;
  academic_year: string;
  department?: string;
  semester?: string;
  room: string;
  courses?: Course;
  profiles?: { full_name: string };
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string;
  max_marks: number;
  due_date: string;
  created_by: string;
  created_at: string;
  classes?: ClassWithDetails;
  submissions?: Submission[];
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  notes: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late';
  marks: number | null;
  feedback: string | null;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  classes?: ClassWithDetails;
}

export interface Material {
  id: string;
  class_id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'link' | 'book';
  file_url: string;
  external_link: string;
  uploaded_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  transaction_id: string | null;
}

export interface TimetableEntry {
  id: string;
  class_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  classes?: ClassWithDetails;
}

// Hooks

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Course[];
    },
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          courses (*),
          profiles:teacher_id (full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClassWithDetails[];
    },
  });
}

export function useEnrollments(studentId?: string) {
  return useQuery({
    queryKey: ['enrollments', studentId],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          classes (
            *,
            courses (*),
            profiles:teacher_id (full_name)
          )
        `);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
}

export function useClassStudents(classId?: string) {
  return useQuery({
    queryKey: ['class_students', classId],
    queryFn: async () => {
      // 1. Get class details to know target audience (Dept/Sem/Sec)
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          section,
          courses (
             department,
             semester
          )
        `)
        .eq('id', classId)
        .single();

      if (classError) throw classError;
      if (!classData || !classData.courses) return [];

      const targetSemString = getSemesterString(classData.courses.semester);
      const targetDept = classData.courses.department;
      const targetSec = classData.section;

      // 2. Fetch all students matching this criteria
      // Note: This replaces the 'enrollments' table dependency for fetching students
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, roll_number, department, semester, section')
        .eq('department', targetDept)
        .eq('semester', targetSemString)
        .eq('section', targetSec)
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Optional: Also fetch manually enrolled students? 
      // For now, let's stick to attribute-based as primary.
      // If we wanted to merge, we'd query enrollments and merge arrays.

      return students || [];
    },
    enabled: !!classId,
  });
}

export function useTimetable(studentId?: string, filters?: { department?: string, semester?: string, section?: string }) {
  return useQuery({
    queryKey: ['timetable', studentId, filters],
    queryFn: async () => {
      let query = supabase
        .from('timetable')
        .select(`
          *,
          classes!inner (
            *,
            courses (*),
            profiles:teacher_id (full_name)
          )
        `)
        .order('day_of_week')
        .order('start_time');

      if (filters?.department) {
        query = query.eq('classes.courses.department', filters.department);
      }
      if (filters?.semester) {
        // Need to handle number vs string semester potentially, assuming passed string "3-2"
        const semNum = getSemesterNumber(filters.semester);
        if (semNum) query = query.eq('classes.courses.semester', semNum);
      }
      if (filters?.section) {
        query = query.eq('classes.section', filters.section);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimetableEntry[];
    },
  });
}

export function useStudentTimetable(studentId: string) {
  return useQuery({
    queryKey: ['timetable', 'student', studentId],
    queryFn: async () => {
      // 1. Get student profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('department, semester, section')
        .eq('id', studentId)
        .single();

      if (profileError || !profile) return [];

      const semNum = getSemesterNumber(profile.semester);

      // 2. Get timetable for classes matching student attributes
      // Match: Class Section == Student Section AND Course Dept == Student Dept AND Course Sem == Student Sem
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          *,
          classes!inner (
            id,
            room,
            section,
            courses!inner (name, code, department, semester),
            profiles:teacher_id (full_name)
          )
        `)
        .eq('classes.section', profile.section)
        .eq('classes.courses.department', profile.department)
        .eq('classes.courses.semester', semNum)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data as any[];
    },
    enabled: !!studentId,
  });
}

export function useStudentAssignments(studentId: string) {
  return useQuery({
    queryKey: ['assignments', 'student', studentId],
    queryFn: async () => {
      // 1. Get student profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('department, semester, section')
        .eq('id', studentId)
        .single();

      if (profileError || !profile) return [];

      const semNum = getSemesterNumber(profile.semester);

      // 2. Get assignments for classes matching student attributes
      const { data, error } = await supabase
        .from('assignments')
        .select(`
           *,
           classes!inner (
             id,
             section,
             courses!inner (name, code, department, semester)
           )
        `)
        .eq('classes.section', profile.section)
        .eq('classes.courses.department', profile.department)
        .eq('classes.courses.semester', semNum)
        .order('due_date');

      if (error) throw error;
      return data as any[];
    },
    enabled: !!studentId,
  });
}

export function useTeacherClasses(teacherId: string) {
  return useQuery({
    queryKey: ['classes', 'teacher', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          courses(name, code),
          enrollments(count)
        `)
        .eq('teacher_id', teacherId);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!teacherId,
  });
}

export function useAssignments(classId?: string) {
  return useQuery({
    queryKey: ['assignments', classId],
    queryFn: async () => {
      let query = supabase
        .from('assignments')
        .select(`
          *,
          classes (
            *,
            courses (*)
          )
        `)
        .order('due_date', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Assignment[];
    },
  });
}

export function useSubmissions(studentId?: string) {
  return useQuery({
    queryKey: ['submissions', studentId],
    queryFn: async () => {
      let query = supabase
        .from('submissions')
        .select(`
          *,
          assignments (*)
        `);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Submission[];
    },
    enabled: !!studentId,
  });
}

export function useAttendance(studentId?: string) {
  return useQuery({
    queryKey: ['attendance', studentId],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          classes (
            *,
            courses (*)
          )
        `)
        .order('date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

export function useMaterials(classId?: string) {
  return useQuery({
    queryKey: ['materials', classId],
    queryFn: async () => {
      let query = supabase
        .from('materials')
        .select(`
          *,
          classes (
            courses (*)
          ),
          profiles:uploaded_by (full_name)
        `)
        .order('created_at', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Material[];
    },
  });
}

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });
}

export function useFees(studentId?: string) {
  return useQuery({
    queryKey: ['fees', studentId],
    queryFn: async () => {
      let query = supabase
        .from('fees')
        .select('*')
        .order('due_date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Fee[];
    },
  });
}

export function useKnowledgeBase() {
  return useQuery({
    queryKey: ['knowledge_base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Mutations

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, studentId, fileUrl, notes }: {
      assignmentId: string;
      studentId: string;
      fileUrl?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          file_url: fileUrl,
          notes,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, date, records, markedBy }: {
      classId: string;
      date: string;
      records: { studentId: string; status: 'present' | 'absent' | 'late' }[];
      markedBy: string;
    }) => {
      const attendanceRecords = records.map(r => ({
        class_id: classId,
        student_id: r.studentId,
        date,
        status: r.status,
        marked_by: markedBy,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'student_id,class_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, title, description, type, fileUrl, externalLink, uploadedBy }: {
      classId?: string;
      title: string;
      description?: string;
      type: 'pdf' | 'video' | 'link' | 'book';
      fileUrl?: string;
      externalLink?: string;
      uploadedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          class_id: classId,
          title,
          description,
          type,
          file_url: fileUrl,
          external_link: externalLink,
          uploaded_by: uploadedBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: {
      name: string;
      code: string;
      description?: string;
      semester: number;
      department: string;
      credits: number;
      regulation?: string;
      units?: { title: string; content: string; }[];
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          name: course.name,
          code: course.code,
          description: course.description,
          semester: course.semester,
          department: course.department,
          credits: course.credits,
          regulation: course.regulation,
          units: course.units ? JSON.stringify(course.units) : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, teacherId, section, academicYear, room }: {
      courseId: string;
      teacherId: string;
      section: string;
      academicYear: string;
      room?: string;
    }) => {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          course_id: courseId,
          teacher_id: teacherId,
          section,
          academic_year: academicYear,
          room,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, title, description, maxMarks, dueDate, createdBy }: {
      classId: string;
      title: string;
      description?: string;
      maxMarks: number;
      dueDate: string;
      createdBy: string;
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          class_id: classId,
          title,
          description,
          max_marks: maxMarks,
          due_date: dueDate,
          created_by: createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, marks, feedback, gradedBy }: {
      submissionId: string;
      marks: number;
      feedback?: string;
      gradedBy: string;
    }) => {
      const { error } = await supabase
        .from('submissions')
        .update({
          marks,
          feedback,
          status: 'graded',
          graded_by: gradedBy,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, title, message, type }: {
      userId?: string;
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'alert';
    }) => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Profiles hook for user management
export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  subject: string | null;
  semester: string | null;
  section: string | null;
  academic_year: string | null;
  regulation: string | null;
  roll_number: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  // New verification fields
  verification_status?: 'pending' | 'verified' | 'failed';
  verification_note?: string | null;
  onboarding_complete?: boolean;
  claimed_roll_number?: string | null;
  verified_at?: string | null;
  year?: number | null;
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return data as unknown as Profile[];
    },
  });
}

// Fee mutations
export function useAddFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fee: {
      student_id: string;
      description: string;
      amount: number;
      due_date: string;
      status: 'pending' | 'paid' | 'overdue';
    }) => {
      const { data, error } = await supabase
        .from('fees')
        .insert({
          student_id: fee.student_id,
          description: fee.description,
          amount: fee.amount,
          due_date: fee.due_date,
          status: fee.status,
          paid_date: fee.status === 'paid' ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });
}

export function useUpdateFeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feeId, status, transactionId }: {
      feeId: string;
      status: 'pending' | 'paid' | 'overdue';
      transactionId?: string | null;
    }) => {
      const updateData: {
        status: string;
        paid_date: string | null;
        transaction_id: string | null;
      } = {
        status,
        paid_date: status === 'paid' ? new Date().toISOString() : null,
        transaction_id: transactionId || null,
      };

      const { data, error } = await supabase
        .from('fees')
        .update(updateData)
        .eq('id', feeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });
}

// User management mutations
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: {
      full_name: string;
      email: string;
      password: string;
      role: 'student' | 'teacher' | 'admin';
      department?: string;
      subject?: string;
      semester?: string;
      regulation?: string;
      phone?: string;
      year?: number;
      section?: string;
    }) => {
      // Call the edge function to create user with auth
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: user.email,
          password: user.password,
          full_name: user.full_name,
          role: user.role,
          department: user.department || null,
          subject: user.subject || null,
          semester: user.semester || null,
          regulation: user.regulation || null,
          phone: user.phone || null,
          year: user.year || null,
          section: user.section || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}
