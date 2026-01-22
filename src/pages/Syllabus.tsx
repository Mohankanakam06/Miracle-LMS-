import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClasses, useCourses, useAssignments, useSubmissions } from '@/hooks/useLMS';
import { useSeedDatabase } from '@/hooks/useDatabaseSeed';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Download, Plus, ChevronDown, ChevronRight, CheckCircle, Circle, Loader2, Filter, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
// JNTU-GV R23 CSE Syllabus Data (Frontend Fallback)
const JNTUGV_DATA = [
  // I Year - Semester I
  { id: '1', code: 'R231101', name: 'Linear Algebra and Calculus', semester: 1, credits: 3, department: 'Basic Science', description: 'Matrix algebra, eigen values/vectors, calculus of multivariable functions' },
  { id: '2', code: 'R231102', name: 'Engineering Physics', semester: 1, credits: 3, department: 'Basic Science', description: 'Optics, Lasers, Quantum Mechanics, Semiconductors' },
  { id: '3', code: 'R231103', name: 'Communicative English', semester: 1, credits: 2, department: 'Humanities', description: 'Listening, Speaking, Reading, Writing skills' },
  { id: '4', code: 'R231104', name: 'Basic Civil & Mechanical Engineering', semester: 1, credits: 3, department: 'Engineering Science', description: 'Basic concepts of Civil and Mechanical Engineering' },
  { id: '5', code: 'R231105', name: 'Introduction to Programming', semester: 1, credits: 3, department: 'CSE', description: 'Problem solving using C, Arrays, Pointers, Structures' },
  // I Year - Semester II
  { id: '6', code: 'R231201', name: 'Differential Equations & Vector Calculus', semester: 2, credits: 3, department: 'Basic Science', description: 'ODEs, PDEs, Vector Differentiation and Integration' },
  { id: '7', code: 'R231202', name: 'Engineering Chemistry', semester: 2, credits: 3, department: 'Basic Science', description: 'Structure, Bonding, Electrochemistry, Polymers' },
  { id: '8', code: 'R231203', name: 'Engineering Graphics', semester: 2, credits: 3, department: 'Engineering Science', description: 'CAD, Projections, Isometric Views' },
  { id: '9', code: 'R231204', name: 'Basic Electrical & Electronics Engineering', semester: 2, credits: 3, department: 'Engineering Science', description: 'Circuits, Machines, Semiconductor Devices' },
  { id: '10', code: 'R231205', name: 'Data Structures', semester: 2, credits: 3, department: 'CSE', description: 'Linked Lists, Stacks, Queues, Trees, Graphs, Hashing' },
  // II Year - Semester I
  { id: '11', code: 'R232101', name: 'Mathematical Foundations of Computer Science', semester: 3, credits: 3, department: 'CSE', description: 'Logic, Sets, Relations, Functions, Graph Theory' },
  { id: '12', code: 'R232102', name: 'Universal Human Values', semester: 3, credits: 2, department: 'Humanities', description: 'Understanding Harmony, Ethical Conduct' },
  { id: '13', code: 'R232103', name: 'Digital Logic & Computer Organization', semester: 3, credits: 3, department: 'CSE', description: 'Digital Circuits, CPU Organization, Memory' },
  { id: '14', code: 'R232104', name: 'Software Engineering', semester: 3, credits: 3, department: 'CSE', description: 'SDLC, Agile, Testing, Maintenance' },
  { id: '15', code: 'R232105', name: 'Object Oriented Programming through Java', semester: 3, credits: 3, department: 'CSE', description: 'Classes, Objects, Inheritance, Polymorphism, Exception Handling' },
  // II Year - Semester II
  { id: '16', code: 'R232201', name: 'Probability and Statistics', semester: 4, credits: 3, department: 'Basic Science', description: 'Probability distributions, Sampling, Hypothesis Testing' },
  { id: '17', code: 'R232202', name: 'Operating Systems', semester: 4, credits: 3, department: 'CSE', description: 'Process Management, Memory Management, File Systems' },
  { id: '18', code: 'R232203', name: 'Database Management Systems', semester: 4, credits: 3, department: 'CSE', description: 'ER Models, SQL, Normalization, Transactions' },
  { id: '19', code: 'R232204', name: 'Formal Languages and Automata Theory', semester: 4, credits: 3, department: 'CSE', description: 'Finite Automata, Grammars, Turing Machines' },
  // III Year - Semester I
  { id: '20', code: 'R233101', name: 'Artificial Intelligence & Machine Learning', semester: 5, credits: 3, department: 'CSE', description: 'AI agents, Search algorithms, ML basics, Neural Networks' },
  { id: '21', code: 'R233102', name: 'Object Oriented Software Engineering', semester: 5, credits: 3, department: 'CSE', description: 'Modeling, Design patterns, Architecture' },
  { id: '22', code: 'R233103', name: 'Computer Networks', semester: 5, credits: 3, department: 'CSE', description: 'OSI Model, TCP/IP, Routing, Wireless Networks' },
  { id: '23', code: 'R233104', name: 'Mobile Computing (PE-I)', semester: 5, credits: 3, department: 'CSE', description: 'Wireless Communication, Mobile Network Layer' },
  // III Year - Semester II
  { id: '24', code: 'R233201', name: 'Data Warehousing and Data Mining', semester: 6, credits: 3, department: 'CSE', description: 'Data preprocessing, Mining algorithms, Clustering' },
  { id: '25', code: 'R233202', name: 'Compiler Design', semester: 6, credits: 3, department: 'CSE', description: 'Lexical Analysis, Parsing, Code Generation' },
  { id: '26', code: 'R233203', name: 'Design and Analysis of Algorithms', semester: 6, credits: 3, department: 'CSE', description: 'Divide and Conquer, Dynamic Programming, Greedy Algorithms' },
  { id: '27', code: 'R233204', name: 'DevOps (PE-II)', semester: 6, credits: 3, department: 'CSE', description: 'CI/CD, Containerization, Orchestration' },
  // IV Year - Semester I
  { id: '28', code: 'R234101', name: 'Cryptography and Network Security', semester: 7, credits: 3, department: 'CSE', description: 'Encryption, Authentication, Security Protocols' },
  { id: '29', code: 'R234102', name: 'Human Resources & Project Management', semester: 7, credits: 3, department: 'Management', description: 'HRM, Project Planning, Risk Management' },
  { id: '30', code: 'R234103', name: 'Deep Learning (PE-III)', semester: 7, credits: 3, department: 'CSE', description: 'CNNs, RNNs, GANs, Transfer Learning' },
  { id: '31', code: 'R234104', name: 'Cloud Computing (PE-IV)', semester: 7, credits: 3, department: 'CSE', description: 'Cloud models, Virtualization, Cloud Security' }
];

export default function Syllabus() {
  const { user, userRole } = useAuth();
  const isTeacher = userRole === 'teacher';

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: classes } = useClasses();
  const { data: assignments } = useAssignments();
  const { data: submissions } = useSubmissions(user?.id);

  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [selectedRegulation, setSelectedRegulation] = useState('R23');
  const [selectedBranch, setSelectedBranch] = useState('CSE');

  // const { mutate: seedDatabase, isPending: isSeeding } = useSeedDatabase();

  // const handleSeed = () => {
  //   toast.info("Starting database seed...");
  //   seedDatabase(undefined, {
  //     onSuccess: (data) => {
  //       toast.success(`Data loaded! Added ${data.courses} courses.`);
  //       // Force reload or let React Query handle invalidation
  //     },
  //     onError: (err) => {
  //       toast.error("Failed to seed: " + err.message);
  //     }
  //   });
  // };

  // Filter courses based on Regulation and Branch
  const filteredCourses = useMemo(() => {
    // FALLBACK: If API courses are empty, use JNTUGV_DATA
    const availableCourses = (courses && courses.length > 0) ? courses : JNTUGV_DATA;

    return availableCourses.filter((course: any) => {
      // 1. Regulation Filter: Check if code starts with selected regulation (e.g., 'R23')
      // Note: Some legacy data might not have the prefix, so we handle that gracefully or strictly.
      // Assuming JNTU-GV data format: "R23xxxx"
      const regulationMatch = course.code?.startsWith(selectedRegulation);

      // 2. Branch Filter
      // Common departments for I Year / General subjects
      const commonDepartments = ['Basic Science', 'Humanities', 'Engineering Science', 'Management'];

      const isCommonSubject = commonDepartments.includes(course.department || '');
      const isBranchSubject = course.department === selectedBranch;

      // Logic: Show if it matches Regulation AND (it's a common subject OR it belongs to the selected branch)
      return regulationMatch && (isCommonSubject || isBranchSubject);
    });
  }, [courses, selectedRegulation, selectedBranch]);

  // Calculate course progress based on completed assignments
  const courseProgress = useMemo(() => {
    if (!courses || !assignments || !submissions) return {};

    const progress: Record<string, { completed: number; total: number; percentage: number }> = {};

    filteredCourses.forEach(course => {
      const courseClasses = classes?.filter(c => c.course_id === course.id) || [];
      const classIds = courseClasses.map(c => c.id);

      const courseAssignments = assignments.filter(a => classIds.includes(a.class_id));
      const completedAssignments = courseAssignments.filter(a =>
        submissions?.some(s => s.assignment_id === a.id && s.marks !== null)
      );

      const total = courseAssignments.length;
      const completed = completedAssignments.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      progress[course.id] = { completed, total, percentage };
    });

    return progress;
  }, [courses, classes, assignments, submissions]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  if (loadingCourses) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 stagger-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Syllabus</h1>
            <p className="text-muted-foreground">
              {isTeacher ? 'Manage course syllabi and content' : 'Track your course progress and content'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
              <SelectTrigger className="w-[100px] glass-card">
                <SelectValue placeholder="Reg" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="R23">R23</SelectItem>
                <SelectItem value="R20">R20</SelectItem>
                <SelectItem value="R19">R19</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[120px] glass-card">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="EEE">EEE</SelectItem>
                <SelectItem value="MECH">MECH</SelectItem>
                <SelectItem value="CIVIL">CIVIL</SelectItem>
              </SelectContent>
            </Select>
            {isTeacher && (
              <Button variant="hero">
                <Plus className="h-4 w-4" />
                Add Syllabus
              </Button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        {filteredCourses && filteredCourses.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredCourses.slice(0, 4).map((course) => {
                const progress = courseProgress[course.id] || { completed: 0, total: 0, percentage: 0 };
                return (
                  <Card
                    key={course.id}
                    className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <Badge variant={progress.percentage >= 70 ? "default" : progress.percentage >= 40 ? "secondary" : "outline"} className="shadow-sm">
                          {progress.percentage}%
                        </Badge>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.credits} Credits • Sem {course.semester}</p>
                      <Progress value={progress.percentage} className="h-2 mt-3" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detailed Syllabus */}
            <div className="space-y-4">
              {filteredCourses.map((course) => {
                const progress = courseProgress[course.id] || { completed: 0, total: 0, percentage: 0 };
                const courseClasses = classes?.filter(c => c.course_id === course.id) || [];
                const classIds = courseClasses.map(c => c.id);
                const courseAssignments = assignments?.filter(a => classIds.includes(a.class_id)) || [];

                return (
                  <Card key={course.id} className="glass-card overflow-hidden transition-all duration-300">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedCourses.includes(course.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="font-display font-bold text-lg">{course.name}</CardTitle>
                            <CardDescription>
                              {course.code} • {course.credits} Credits • Semester {course.semester}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{progress.percentage}% Complete</p>
                            <Progress value={progress.percentage} className="h-2 w-24" />
                          </div>
                          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedCourses.includes(course.id) && (
                      <CardContent className="pt-0">
                        {course.description && (
                          <p className="text-muted-foreground mb-4">{course.description}</p>
                        )}

                        {courseAssignments.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="font-semibold">Assignments & Assessments</h4>
                            {courseAssignments.map((assignment) => {
                              const hasSubmission = submissions?.some(s =>
                                s.assignment_id === assignment.id && s.marks !== null
                              );

                              return (
                                <div key={assignment.id} className={cn(
                                  "p-4 rounded-xl border transition-all hover:bg-muted/40",
                                  hasSubmission ? "bg-success/5 border-success/20" : "bg-card/50"
                                )}>
                                  <div className="flex items-center gap-3">
                                    {hasSubmission ? (
                                      <CheckCircle className="h-5 w-5 text-success" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-semibold">{assignment.title}</h5>
                                      {assignment.description && (
                                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline">{assignment.max_marks} marks</Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            No assignments available for this course
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No courses available for {selectedRegulation} - {selectedBranch}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
