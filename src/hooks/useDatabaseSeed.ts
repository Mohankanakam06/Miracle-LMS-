import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// JNTU-GV R23 CSE Syllabus Data
const JNTUGV_DATA = [
  // I Year - Semester I
  { code: 'R231101', name: 'Linear Algebra and Calculus', semester: 1, credits: 3, department: 'Basic Science', description: 'Matrix algebra, eigen values/vectors, calculus of multivariable functions' },
  { code: 'R231102', name: 'Engineering Physics', semester: 1, credits: 3, department: 'Basic Science', description: 'Optics, Lasers, Quantum Mechanics, Semiconductors' },
  { code: 'R231103', name: 'Communicative English', semester: 1, credits: 2, department: 'Humanities', description: 'Listening, Speaking, Reading, Writing skills' },
  { code: 'R231104', name: 'Basic Civil & Mechanical Engineering', semester: 1, credits: 3, department: 'Engineering Science', description: 'Basic concepts of Civil and Mechanical Engineering' },
  { code: 'R231105', name: 'Introduction to Programming', semester: 1, credits: 3, department: 'CSE', description: 'Problem solving using C, Arrays, Pointers, Structures' },

  // I Year - Semester II
  { code: 'R231201', name: 'Differential Equations & Vector Calculus', semester: 2, credits: 3, department: 'Basic Science', description: 'ODEs, PDEs, Vector Differentiation and Integration' },
  { code: 'R231202', name: 'Engineering Chemistry', semester: 2, credits: 3, department: 'Basic Science', description: 'Structure, Bonding, Electrochemistry, Polymers' },
  { code: 'R231203', name: 'Engineering Graphics', semester: 2, credits: 3, department: 'Engineering Science', description: 'CAD, Projections, Isometric Views' },
  { code: 'R231204', name: 'Basic Electrical & Electronics Engineering', semester: 2, credits: 3, department: 'Engineering Science', description: 'Circuits, Machines, Semiconductor Devices' },
  { code: 'R231205', name: 'Data Structures', semester: 2, credits: 3, department: 'CSE', description: 'Linked Lists, Stacks, Queues, Trees, Graphs, Hashing' },

  // II Year - Semester I
  { code: 'R232101', name: 'Mathematical Foundations of Computer Science', semester: 3, credits: 3, department: 'CSE', description: 'Logic, Sets, Relations, Functions, Graph Theory' },
  { code: 'R232102', name: 'Universal Human Values', semester: 3, credits: 2, department: 'Humanities', description: 'Understanding Harmony, Ethical Conduct' },
  { code: 'R232103', name: 'Digital Logic & Computer Organization', semester: 3, credits: 3, department: 'CSE', description: 'Digital Circuits, CPU Organization, Memory' },
  { code: 'R232104', name: 'Software Engineering', semester: 3, credits: 3, department: 'CSE', description: 'SDLC, Agile, Testing, Maintenance' },
  { code: 'R232105', name: 'Object Oriented Programming through Java', semester: 3, credits: 3, department: 'CSE', description: 'Classes, Objects, Inheritance, Polymorphism, Exception Handling' },

  // II Year - Semester II
  { code: 'R232201', name: 'Probability and Statistics', semester: 4, credits: 3, department: 'Basic Science', description: 'Probability distributions, Sampling, Hypothesis Testing' },
  { code: 'R232202', name: 'Operating Systems', semester: 4, credits: 3, department: 'CSE', description: 'Process Management, Memory Management, File Systems' },
  { code: 'R232203', name: 'Database Management Systems', semester: 4, credits: 3, department: 'CSE', description: 'ER Models, SQL, Normalization, Transactions' },
  { code: 'R232204', name: 'Formal Languages and Automata Theory', semester: 4, credits: 3, department: 'CSE', description: 'Finite Automata, Grammars, Turing Machines' },

  // III Year - Semester I
  { code: 'R233101', name: 'Artificial Intelligence & Machine Learning', semester: 5, credits: 3, department: 'CSE', description: 'AI agents, Search algorithms, ML basics, Neural Networks' },
  { code: 'R233102', name: 'Object Oriented Software Engineering', semester: 5, credits: 3, department: 'CSE', description: 'Modeling, Design patterns, Architecture' },
  { code: 'R233103', name: 'Computer Networks', semester: 5, credits: 3, department: 'CSE', description: 'OSI Model, TCP/IP, Routing, Wireless Networks' },
  { code: 'R233104', name: 'Mobile Computing (PE-I)', semester: 5, credits: 3, department: 'CSE', description: 'Wireless Communication, Mobile Network Layer' },

  // III Year - Semester II
  { code: 'R233201', name: 'Data Warehousing and Data Mining', semester: 6, credits: 3, department: 'CSE', description: 'Data preprocessing, Mining algorithms, Clustering' },
  { code: 'R233202', name: 'Compiler Design', semester: 6, credits: 3, department: 'CSE', description: 'Lexical Analysis, Parsing, Code Generation' },
  { code: 'R233203', name: 'Design and Analysis of Algorithms', semester: 6, credits: 3, department: 'CSE', description: 'Divide and Conquer, Dynamic Programming, Greedy Algorithms' },
  { code: 'R233204', name: 'DevOps (PE-II)', semester: 6, credits: 3, department: 'CSE', description: 'CI/CD, Containerization, Orchestration' },

  // IV Year - Semester I
  { code: 'R234101', name: 'Cryptography and Network Security', semester: 7, credits: 3, department: 'CSE', description: 'Encryption, Authentication, Security Protocols' },
  { code: 'R234102', name: 'Human Resources & Project Management', semester: 7, credits: 3, department: 'Management', description: 'HRM, Project Planning, Risk Management' },
  { code: 'R234103', name: 'Deep Learning (PE-III)', semester: 7, credits: 3, department: 'CSE', description: 'CNNs, RNNs, GANs, Transfer Learning' },
  { code: 'R234104', name: 'Cloud Computing (PE-IV)', semester: 7, credits: 3, department: 'CSE', description: 'Cloud models, Virtualization, Cloud Security' },
];

const sampleCourses = JNTUGV_DATA;

// Knowledge base entries
const sampleKnowledge = [
  { category: 'general', question: 'What are the library timings?', answer: 'The library is open from 8 AM to 10 PM on weekdays and 9 AM to 6 PM on weekends.', keywords: ['library', 'timings', 'hours'], priority: 10 },
  { category: 'academic', question: 'How do I apply for a leave?', answer: 'Submit a leave application through the student portal under "Leave Management". For medical leave, attach a medical certificate.', keywords: ['leave', 'apply', 'absence'], priority: 9 },
  { category: 'fees', question: 'What are the fee payment options?', answer: 'Fees can be paid online through the portal via UPI, credit/debit card, or net banking. Cash payments are accepted at the accounts office.', keywords: ['fees', 'payment', 'pay'], priority: 10 },
  { category: 'examination', question: 'When are the semester exams?', answer: 'Semester examinations are typically held in December (odd semester) and May (even semester). Check the academic calendar for exact dates.', keywords: ['exam', 'examination', 'semester'], priority: 10 },
  { category: 'general', question: 'What is the dress code?', answer: 'Students must wear the college uniform on all working days. ID cards are mandatory within campus premises.', keywords: ['dress', 'uniform', 'code'], priority: 8 },
  { category: 'academic', question: 'How is CGPA calculated?', answer: 'CGPA is calculated as the weighted average of grade points earned in all courses, weighted by their credits. Grade points range from O (10) to F (0).', keywords: ['cgpa', 'grade', 'calculate'], priority: 10 },
  { category: 'academic', question: 'What is the attendance requirement?', answer: 'A minimum of 75% attendance is required for each course to be eligible for end-semester examinations.', keywords: ['attendance', 'requirement', 'percentage'], priority: 10 },
  { category: 'general', question: 'How do I contact the placement cell?', answer: 'The placement cell is located in the Admin Block, Room 204. Email: placements@mesi.edu.in, Phone: 040-1234567.', keywords: ['placement', 'contact', 'job'], priority: 9 },
];

// Sample notifications
const sampleNotifications = [
  { title: 'Welcome to Miracle LMS', message: 'Your account has been successfully created. Explore the portal to access courses, materials, and more!', type: 'success' as const },
  { title: 'Semester Registration Open', message: 'Course registration for the upcoming semester is now open. Please register before the deadline.', type: 'info' as const },
  { title: 'Fee Payment Reminder', message: 'Your semester fees are due by the end of this month. Please complete the payment to avoid late fees.', type: 'warning' as const },
  { title: 'Attendance Alert', message: 'Your attendance in CS101 - Data Structures has fallen below 75%. Please ensure regular attendance.', type: 'alert' as const },
  { title: 'New Study Material Available', message: 'New lecture notes for Operating Systems have been uploaded. Check the Notes & Materials section.', type: 'info' as const },
];

// Sample Library Books
const sampleLibraryBooks = [
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Technology', total_copies: 5, available_copies: 5, shelf_location: 'A-101' },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Technology', total_copies: 3, available_copies: 3, shelf_location: 'A-102' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780201616224', category: 'Technology', total_copies: 4, available_copies: 4, shelf_location: 'A-103' },
  { title: 'Design Patterns', author: 'Erich Gamma', isbn: '9780201633610', category: 'Technology', total_copies: 3, available_copies: 3, shelf_location: 'A-104' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', category: 'Fiction', total_copies: 2, available_copies: 2, shelf_location: 'B-201' },
  { title: '1984', author: 'George Orwell', isbn: '9780451524935', category: 'Fiction', total_copies: 5, available_copies: 5, shelf_location: 'B-202' },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', category: 'Science', total_copies: 3, available_copies: 3, shelf_location: 'C-301' },
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '9780062316097', category: 'Non-Fiction', total_copies: 4, available_copies: 4, shelf_location: 'D-401' },
  { title: 'Physics for Scientists and Engineers', author: 'Raymond A. Serway', isbn: '9781133947271', category: 'Science', total_copies: 6, available_copies: 6, shelf_location: 'C-302' },
  { title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '9781285741550', category: 'Mathematics', total_copies: 8, available_copies: 8, shelf_location: 'E-501' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:15', end: '12:15' },
  { start: '12:15', end: '13:15' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
];

export function useSeedDatabase() {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // if (!user || userRole !== 'admin') {
      //   throw new Error('Only admins can seed the database');
      // }

      const results = {
        courses: 0,
        classes: 0,
        timetable: 0,
        knowledge: 0,
        materials: 0,
        library: 0,
        notifications: 0,
      };

      // 1. Seed Courses
      const { data: existingCourses } = await supabase.from('courses').select('code');
      const existingCodes = new Set(existingCourses?.map(c => c.code) || []);
      const newCourses = sampleCourses.filter(c => !existingCodes.has(c.code));

      if (newCourses.length > 0) {
        const { data: insertedCourses, error: courseError } = await supabase
          .from('courses')
          .insert(newCourses)
          .select();
        if (courseError) throw courseError;
        results.courses = insertedCourses?.length || 0;
      }

      // 2. Get all courses and a teacher for creating classes
      const { data: allCourses } = await supabase.from('courses').select('id');
      const { data: teachers } = await supabase.from('profiles').select('id').eq('role', 'teacher').limit(1);
      const teacherId = teachers?.[0]?.id || user.id; // Use admin as fallback

      // 3. Seed Classes (one per course)
      const { data: existingClasses } = await supabase.from('classes').select('course_id');
      const existingClassCourses = new Set(existingClasses?.map(c => c.course_id) || []);

      const newClasses = allCourses
        ?.filter(c => !existingClassCourses.has(c.id))
        .map((course, index) => ({
          course_id: course.id,
          teacher_id: teacherId,
          section: 'A',
          academic_year: '2024-25',
          room: `Room ${101 + index}`,
        })) || [];

      if (newClasses.length > 0) {
        const { data: insertedClasses, error: classError } = await supabase
          .from('classes')
          .insert(newClasses)
          .select();
        if (classError) throw classError;
        results.classes = insertedClasses?.length || 0;
      }

      // 4. Get all classes for timetable
      const { data: allClasses } = await supabase.from('classes').select('id, room');

      // 5. Seed Timetable entries
      const { data: existingTimetable } = await supabase.from('timetable').select('class_id, day_of_week, start_time');
      const existingSlots = new Set(
        existingTimetable?.map(t => `${t.class_id}-${t.day_of_week}-${t.start_time}`) || []
      );

      const timetableEntries: { class_id: string; day_of_week: string; start_time: string; end_time: string; room: string | null }[] = [];

      allClasses?.forEach((cls, classIndex) => {
        // Assign 2 slots per class spread across the week
        const day1 = daysOfWeek[classIndex % 5];
        const day2 = daysOfWeek[(classIndex + 2) % 5];
        const slot1 = timeSlots[classIndex % timeSlots.length];
        const slot2 = timeSlots[(classIndex + 1) % timeSlots.length];

        const key1 = `${cls.id}-${day1}-${slot1.start}`;
        const key2 = `${cls.id}-${day2}-${slot2.start}`;

        if (!existingSlots.has(key1)) {
          timetableEntries.push({
            class_id: cls.id,
            day_of_week: day1,
            start_time: slot1.start,
            end_time: slot1.end,
            room: cls.room,
          });
        }
        if (!existingSlots.has(key2)) {
          timetableEntries.push({
            class_id: cls.id,
            day_of_week: day2,
            start_time: slot2.start,
            end_time: slot2.end,
            room: cls.room,
          });
        }
      });

      if (timetableEntries.length > 0) {
        const { data: insertedTimetable, error: timetableError } = await supabase
          .from('timetable')
          .insert(timetableEntries)
          .select();
        if (timetableError) throw timetableError;
        results.timetable = insertedTimetable?.length || 0;
      }

      // 6. Seed Knowledge Base
      const { data: existingKnowledge } = await supabase.from('knowledge_base').select('question');
      const existingQuestions = new Set(existingKnowledge?.map(k => k.question) || []);
      const newKnowledge = sampleKnowledge
        .filter(k => !existingQuestions.has(k.question))
        .map(k => ({ ...k, created_by: user.id, active: true }));

      if (newKnowledge.length > 0) {
        const { data: insertedKnowledge, error: knowledgeError } = await supabase
          .from('knowledge_base')
          .insert(newKnowledge)
          .select();
        if (knowledgeError) throw knowledgeError;
        results.knowledge = insertedKnowledge?.length || 0;
      }

      // 7. Seed sample materials
      const { data: existingMaterials } = await supabase.from('materials').select('title');
      const existingTitles = new Set(existingMaterials?.map(m => m.title) || []);

      const sampleMaterials = allClasses?.slice(0, 4).map((cls, i) => ({
        class_id: cls.id,
        title: `Course Notes - Unit ${i + 1}`,
        description: 'Comprehensive lecture notes covering key concepts',
        type: 'pdf' as const,
        external_link: 'https://example.com/notes.pdf',
        uploaded_by: teacherId,
      })).filter(m => !existingTitles.has(m.title)) || [];

      if (sampleMaterials.length > 0) {
        const { data: insertedMaterials, error: materialsError } = await supabase
          .from('materials')
          .insert(sampleMaterials)
          .select();
        if (materialsError) throw materialsError;
        results.materials = insertedMaterials?.length || 0;
      }

      // 8. Seed sample notifications (broadcast to all users)
      const { data: existingNotifications } = await supabase.from('notifications').select('title');
      const existingNotificationTitles = new Set(existingNotifications?.map(n => n.title) || []);

      const newNotifications = sampleNotifications
        .filter(n => !existingNotificationTitles.has(n.title))
        .map(n => ({ ...n, user_id: null, read: false })); // null user_id means broadcast to all

      if (newNotifications.length > 0) {
        const { data: insertedNotifications, error: notificationsError } = await supabase
          .from('notifications')
          .insert(newNotifications)
          .select();
        if (notificationsError) throw notificationsError;
        if (notificationsError) throw notificationsError;
        results.notifications = insertedNotifications?.length || 0;
      }

      // 9. Seed Library Books
      const { data: existingBooks } = await supabase.from('library_books').select('isbn');
      const existingISBNs = new Set(existingBooks?.map(b => b.isbn).filter(Boolean) || []);

      const newBooks = sampleLibraryBooks
        .filter(b => !existingISBNs.has(b.isbn))
        .map(b => ({ ...b, department: null, cover_url: null }));

      if (newBooks.length > 0) {
        const { data: insertedBooks, error: booksError } = await supabase
          .from('library_books')
          .insert(newBooks)
          .select();
        if (booksError) throw booksError;
        results.library = insertedBooks?.length || 0;
      }

      return results;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge_base'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
    },
  });
}
