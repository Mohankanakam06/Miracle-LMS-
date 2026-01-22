export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_calendar: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_holiday: boolean | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          is_holiday?: boolean | null
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_holiday?: boolean | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          target_audience: string | null
          target_department: string | null
          target_semester: string | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          target_audience?: string | null
          target_department?: string | null
          target_semester?: string | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          target_audience?: string | null
          target_department?: string | null
          target_semester?: string | null
          title?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          max_marks: number
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          max_marks?: number
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          max_marks?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_logs: {
        Row: {
          confidence: number | null
          created_at: string
          escalated: boolean | null
          id: string
          intent: string | null
          query: string
          response: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          escalated?: boolean | null
          id?: string
          intent?: string | null
          query: string
          response: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          escalated?: boolean | null
          id?: string
          intent?: string | null
          query?: string
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          course_id: string
          created_at: string
          id: string
          room: string | null
          section: string
          teacher_id: string
        }
        Insert: {
          academic_year?: string
          course_id: string
          created_at?: string
          id?: string
          room?: string | null
          section?: string
          teacher_id: string
        }
        Update: {
          academic_year?: string
          course_id?: string
          created_at?: string
          id?: string
          room?: string | null
          section?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credits: number | null
          department: string | null
          description: string | null
          id: string
          name: string
          semester: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number | null
          department?: string | null
          description?: string | null
          id?: string
          name: string
          semester?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number | null
          department?: string | null
          description?: string | null
          id?: string
          name?: string
          semester?: number
          updated_at?: string
        }
        Relationships: []
      }
      discussion_forums: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          title: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalated_queries: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          query: string
          resolved_at: string | null
          response: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          query: string
          resolved_at?: string | null
          response?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          query?: string
          resolved_at?: string | null
          response?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalated_queries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalated_queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attendance_marked: boolean | null
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          attendance_marked?: boolean | null
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          attendance_marked?: boolean | null
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          end_datetime: string | null
          event_type: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          max_participants: number | null
          organizer: string | null
          registration_deadline: string | null
          registration_required: boolean | null
          start_datetime: string
          title: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          max_participants?: number | null
          organizer?: string | null
          registration_deadline?: string | null
          registration_required?: boolean | null
          start_datetime: string
          title: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          max_participants?: number | null
          organizer?: string | null
          registration_deadline?: string | null
          registration_required?: boolean | null
          start_datetime?: string
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      exam_schedule: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          department: string | null
          end_time: string
          exam_date: string
          exam_type: string
          id: string
          max_marks: number | null
          regulation: string | null
          room: string | null
          semester: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          department?: string | null
          end_time: string
          exam_date: string
          exam_type: string
          id?: string
          max_marks?: number | null
          regulation?: string | null
          room?: string | null
          semester?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          end_time?: string
          exam_date?: string
          exam_type?: string
          id?: string
          max_marks?: number | null
          regulation?: string | null
          room?: string | null
          semester?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      faculty_feedback: {
        Row: {
          academic_year: string | null
          class_id: string
          comments: string | null
          communication: number | null
          course_content: number | null
          created_at: string
          faculty_id: string
          id: string
          is_anonymous: boolean | null
          punctuality: number | null
          rating: number | null
          semester: string | null
          student_id: string
          teaching_quality: number | null
        }
        Insert: {
          academic_year?: string | null
          class_id: string
          comments?: string | null
          communication?: number | null
          course_content?: number | null
          created_at?: string
          faculty_id: string
          id?: string
          is_anonymous?: boolean | null
          punctuality?: number | null
          rating?: number | null
          semester?: string | null
          student_id: string
          teaching_quality?: number | null
        }
        Update: {
          academic_year?: string | null
          class_id?: string
          comments?: string | null
          communication?: number | null
          course_content?: number | null
          created_at?: string
          faculty_id?: string
          id?: string
          is_anonymous?: boolean | null
          punctuality?: number | null
          rating?: number | null
          semester?: string | null
          student_id?: string
          teaching_quality?: number | null
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          id: string
          paid_date: string | null
          status: string | null
          student_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date: string
          id?: string
          paid_date?: string | null
          status?: string | null
          student_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          status?: string | null
          student_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          forum_id: string
          id: string
          is_answer: boolean | null
          parent_id: string | null
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          forum_id: string
          id?: string
          is_answer?: boolean | null
          parent_id?: string | null
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          forum_id?: string
          id?: string
          is_answer?: boolean | null
          parent_id?: string | null
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "discussion_forums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          active: boolean | null
          answer: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          keywords: string[] | null
          priority: number | null
          question: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          answer: string
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          priority?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          answer?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          priority?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          author: string
          available_copies: number | null
          category: string | null
          cover_url: string | null
          created_at: string
          department: string | null
          id: string
          isbn: string | null
          shelf_location: string | null
          title: string
          total_copies: number | null
        }
        Insert: {
          author: string
          available_copies?: number | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          department?: string | null
          id?: string
          isbn?: string | null
          shelf_location?: string | null
          title: string
          total_copies?: number | null
        }
        Update: {
          author?: string
          available_copies?: number | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          department?: string | null
          id?: string
          isbn?: string | null
          shelf_location?: string | null
          title?: string
          total_copies?: number | null
        }
        Relationships: []
      }
      library_borrowings: {
        Row: {
          book_id: string
          borrowed_at: string
          due_date: string
          fine_amount: number | null
          id: string
          returned_at: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          book_id: string
          borrowed_at?: string
          due_date: string
          fine_amount?: number | null
          id?: string
          returned_at?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          book_id?: string
          borrowed_at?: string
          due_date?: string
          fine_amount?: number | null
          id?: string
          returned_at?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_borrowings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found: {
        Row: {
          category: string
          claimed_by: string | null
          contact_info: string | null
          created_at: string
          date_reported: string
          description: string | null
          id: string
          image_url: string | null
          item_name: string
          location: string
          reported_by: string
          status: string | null
          type: string
        }
        Insert: {
          category: string
          claimed_by?: string | null
          contact_info?: string | null
          created_at?: string
          date_reported?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_name: string
          location: string
          reported_by: string
          status?: string | null
          type: string
        }
        Update: {
          category?: string
          claimed_by?: string | null
          contact_info?: string | null
          created_at?: string
          date_reported?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_name?: string
          location?: string
          reported_by?: string
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          external_link: string | null
          file_url: string | null
          id: string
          title: string
          type: string
          uploaded_by: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          file_url?: string | null
          id?: string
          title: string
          type: string
          uploaded_by: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          file_url?: string | null
          id?: string
          title?: string
          type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      previous_papers: {
        Row: {
          course_id: string | null
          created_at: string
          exam_type: string
          exam_year: string
          file_url: string
          id: string
          regulation: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          exam_type: string
          exam_year: string
          file_url: string
          id?: string
          regulation?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          exam_type?: string
          exam_year?: string
          file_url?: string
          id?: string
          regulation?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          regulation: string | null
          role: string
          roll_number: string | null
          semester: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          regulation?: string | null
          role?: string
          roll_number?: string | null
          semester?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          regulation?: string | null
          role?: string
          roll_number?: string | null
          semester?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          marks: number | null
          notes: string | null
          status: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks?: number | null
          notes?: string | null
          status?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks?: number | null
          notes?: string | null
          status?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_progress: {
        Row: {
          class_id: string
          completed_topics: number
          created_at: string
          id: string
          notes: string | null
          status: string | null
          total_topics: number
          unit_number: number
          unit_title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          class_id: string
          completed_topics?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: string | null
          total_topics?: number
          unit_number: number
          unit_title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          class_id?: string
          completed_topics?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: string | null
          total_topics?: number
          unit_number?: number
          unit_title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      timetable: {
        Row: {
          class_id: string
          day_of_week: string
          end_time: string
          id: string
          room: string | null
          start_time: string
        }
        Insert: {
          class_id: string
          day_of_week: string
          end_time: string
          id?: string
          room?: string | null
          start_time: string
        }
        Update: {
          class_id?: string
          day_of_week?: string
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_teacher: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
