import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTimetable, useStudentTimetable } from '@/hooks/useLMS';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TimetableGenerator from '@/components/timetable/TimetableGenerator';
import ManualTimetableEntry from '@/components/timetable/ManualTimetableEntry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Wand2, Loader2, TableIcon, Phone, User, GraduationCap, FileDown, PenLine, Building2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateTimetablePdf } from '@/lib/generateTimetablePdf';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  { start: '09:15', end: '10:05', label: '9:15 - 10:05' },
  { start: '10:05', end: '10:55', label: '10:05 - 10:55' },
  { start: '11:05', end: '11:55', label: '11:05 - 11:55' },
  { start: '11:55', end: '12:45', label: '11:55 - 12:45' },
  { start: '12:45', end: '13:25', label: '12:45 - 1:25', isLunch: true },
  { start: '13:25', end: '14:15', label: '1:25 - 2:15' },
  { start: '14:15', end: '15:05', label: '2:15 - 3:05' },
  { start: '15:05', end: '15:55', label: '3:05 - 3:55' },
];

// Academic taxonomy
const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'AI&DS', label: 'AI & Data Science' },
  { value: 'EEE', label: 'Electrical & Electronics Engineering' },
  { value: 'ECE', label: 'Electronics & Communication Engineering' },
  { value: 'MECH', label: 'Mechanical Engineering' },
];

const YEARS = [
  { value: 'I', label: 'I Year' },
  { value: 'II', label: 'II Year' },
  { value: 'III', label: 'III Year' },
  { value: 'IV', label: 'IV Year' },
];

const SEMESTERS = [
  { value: '1-1', label: '1st Semester' },
  { value: '1-2', label: '2nd Semester' },
  { value: '2-1', label: '3rd Semester' },
  { value: '2-2', label: '4th Semester' },
  { value: '3-1', label: '5th Semester' },
  { value: '3-2', label: '6th Semester' },
  { value: '4-1', label: '7th Semester' },
  { value: '4-2', label: '8th Semester' },
];

const SECTIONS = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
  { value: 'D', label: 'Section D' },
  { value: 'E', label: 'Section E' },
];

const subjectColors: Record<string, string> = {
  'Data Structures & Algorithms': 'bg-blue-100 text-blue-800 border-blue-300',
  'Database Management Systems': 'bg-purple-100 text-purple-800 border-purple-300',
  'Operating Systems': 'bg-green-100 text-green-800 border-green-300',
  'Computer Networks': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Software Engineering': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Machine Learning': 'bg-pink-100 text-pink-800 border-pink-300',
  'Artificial Intelligence': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'default': 'bg-gray-100 text-gray-800 border-gray-300',
};

// Generate abbreviation from course name
const getAbbreviation = (name?: string): string => {
  if (!name) return '---';
  const words = name.split(' ').filter(w => w.length > 2 && !['and', 'the', 'for', 'with'].includes(w.toLowerCase()));
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
};

// Get full department name
const getDepartmentFullName = (code: string): string => {
  const dept = DEPARTMENTS.find(d => d.value === code);
  return dept ? `DEPARTMENT OF ${dept.label.toUpperCase()}` : 'DEPARTMENT';
};

// Get semester display text
const getSemesterDisplay = (year: string, semester: string): string => {
  const yearLabel = YEARS.find(y => y.value === year)?.label || year;
  const semLabel = SEMESTERS.find(s => s.value === semester)?.label || semester;
  return `${yearLabel} ${semLabel}`;
};

export default function Timetable() {
  const { user, userRole } = useAuth();
  // Only admin and teacher can access manual entry and auto-generate features
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';


  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('CSE');
  const [selectedYear, setSelectedYear] = useState('III');
  const [selectedSemester, setSelectedSemester] = useState('3-2');
  const [selectedSection, setSelectedSection] = useState('A');


  const { data: profile } = useQuery({
    queryKey: ['profile-context', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('department, semester, section')
        .eq('id', user?.id)
        .single();
      if (error) return null;
      return data as any;
    },
    enabled: !!user?.id && !isTeacherOrAdmin
  });

  const filters = isTeacherOrAdmin ? {
    department: selectedDepartment,
    semester: selectedSemester,
    section: selectedSection
  } : {
    department: (profile as any)?.department || undefined,
    semester: (profile as any)?.semester || undefined,
    section: (profile as any)?.section || undefined
  };

  // Sync state with profile for students
  useEffect(() => {
    if (!isTeacherOrAdmin && profile) {
      if (profile.department) setSelectedDepartment(profile.department);
      if (profile.semester) {
        const semVal = typeof profile.semester === 'string' ? profile.semester : profile.semester.toString();
        setSelectedSemester(semVal);

        if (semVal.startsWith('1')) setSelectedYear('I');
        else if (semVal.startsWith('2')) setSelectedYear('II');
        else if (semVal.startsWith('3')) setSelectedYear('III');
        else if (semVal.startsWith('4')) setSelectedYear('IV');
      }
      if (profile.section) setSelectedSection(profile.section);
    }
  }, [profile, isTeacherOrAdmin]);


  // Use the correct hook based on role
  // If teacher/admin, use generic hook (which respects filters)
  // If student, use student-specific hook
  const { data: genericTimetable, isLoading: loadingGeneric } = useTimetable(user?.id, filters);
  const { data: studentTimetable, isLoading: loadingStudent } = useStudentTimetable(user?.id || '');

  const timetableData = isTeacherOrAdmin ? genericTimetable : studentTimetable;
  const isLoading = isTeacherOrAdmin ? loadingGeneric : loadingStudent;

  const getScheduleForSlot = (day: string, slot: typeof TIME_SLOTS[0]) => {
    return timetableData?.find(entry => {
      const entryStart = entry.start_time.substring(0, 5);
      // Case insensitive day match
      return entry.day_of_week.toLowerCase() === day.toLowerCase() && entryStart === slot.start;
    });
  };

  const getSubjectColor = (courseName?: string) => {
    if (!courseName) return subjectColors.default;
    return subjectColors[courseName] || subjectColors.default;
  };

  // Get unique subjects with faculty info for the legend
  const subjectFacultyMap = new Map<string, { name: string; code: string; faculty: string; phone?: string }>();
  timetableData?.forEach(t => {
    const courseName = t.classes?.courses?.name;
    const courseCode = t.classes?.courses?.code;
    const facultyName = t.classes?.profiles?.full_name;
    if (courseName && !subjectFacultyMap.has(courseName)) {
      subjectFacultyMap.set(courseName, {
        name: courseName,
        code: courseCode || getAbbreviation(courseName),
        faculty: facultyName || 'TBA',
        phone: undefined,
      });
    }
  });

  if (isLoading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Timetable</h1>
            <p className="text-muted-foreground">
              {isTeacherOrAdmin ? 'Manage and generate class schedules' : 'Your class schedule for this semester'}
            </p>
          </div>
        </div>

        {isTeacherOrAdmin ? (
          <Tabs defaultValue="view" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="view" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                View Schedule
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PenLine className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Auto Generate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-6">
              <TimetableView
                timetableData={timetableData}
                getScheduleForSlot={getScheduleForSlot}
                getSubjectColor={getSubjectColor}
                subjectFacultyMap={subjectFacultyMap}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                isAdmin={true}
              />
            </TabsContent>

            <TabsContent value="manual">
              <ManualTimetableEntry
                selectedDepartment={selectedDepartment}
                selectedSemester={selectedSemester}
                selectedSection={selectedSection}
              />
            </TabsContent>

            <TabsContent value="generate">
              <TimetableGenerator
                selectedDepartment={selectedDepartment}
                selectedSemester={selectedSemester}
                selectedSection={selectedSection}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <TimetableView
            timetableData={timetableData}
            getScheduleForSlot={getScheduleForSlot}
            getSubjectColor={getSubjectColor}
            subjectFacultyMap={subjectFacultyMap}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedSemester={selectedSemester}
            setSelectedSemester={setSelectedSemester}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            isAdmin={false}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

interface TimetableViewProps {
  timetableData: any[] | undefined;
  getScheduleForSlot: (day: string, slot: typeof TIME_SLOTS[0]) => any;
  getSubjectColor: (courseName?: string) => string;
  subjectFacultyMap: Map<string, { name: string; code: string; faculty: string; phone?: string }>;
  selectedDepartment: string;
  setSelectedDepartment: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedSemester: string;
  setSelectedSemester: (value: string) => void;
  selectedSection: string;
  setSelectedSection: (value: string) => void;
  isAdmin: boolean;
}

function TimetableView({
  timetableData,
  getScheduleForSlot,
  getSubjectColor,
  subjectFacultyMap,
  selectedDepartment,
  setSelectedDepartment,
  selectedYear,
  setSelectedYear,
  selectedSemester,
  setSelectedSemester,
  selectedSection,
  setSelectedSection,
  isAdmin,
}: TimetableViewProps) {
  const [currentDayName, setCurrentDayName] = useState('');
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDayName(new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now));
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExportPdf = () => {
    if (!timetableData) return;
    generateTimetablePdf({
      timetableData,
      departmentName: getDepartmentFullName(selectedDepartment),
      academicYear: '2025-2026',
      semester: getSemesterDisplay(selectedYear, selectedSemester),
    });
  };

  return (
    <DashboardLayout>
      {/* Filter Controls - Admin Only */}
      {isAdmin && (
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Branch / Department
                </Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.value} - {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Year
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Semester
                </Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map(sem => (
                      <SelectItem key={sem.value} value={sem.value}>
                        {sem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Section
                </Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(sec => (
                      <SelectItem key={sec.value} value={sec.value}>
                        {sec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* College Header */}
      <Card className="shadow-card border-2 border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl font-display text-primary">
                {getDepartmentFullName(selectedDepartment)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {getSemesterDisplay(selectedYear, selectedSemester)} | Section {selectedSection} | A.Y: 2025-2026
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <Button onClick={handleExportPdf} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export as PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Timetable Grid */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          {timetableData && timetableData.length > 0 ? (
            <div className="overflow-x-auto w-full pb-2">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-3 text-center font-bold border border-primary-foreground/20 w-28">
                      DAY/TIME
                    </th>
                    {TIME_SLOTS.map((slot, idx) => (
                      <th
                        key={idx}
                        className={cn(
                          "p-2 text-center font-semibold text-xs border border-primary-foreground/20",
                          slot.isLunch && "bg-amber-500"
                        )}
                      >
                        {slot.isLunch ? (
                          <div className="flex flex-col">
                            <span>LUNCH</span>
                            <span>BREAK</span>
                          </div>
                        ) : (
                          slot.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, dayIndex) => (
                    <tr key={day} className={dayIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-3 font-bold text-sm text-center border bg-muted/50">
                        {day}
                      </td>
                      {TIME_SLOTS.map((slot, slotIndex) => {
                        if (slot.isLunch) {
                          return (
                            <td
                              key={slotIndex}
                              className="p-2 text-center border bg-amber-50 dark:bg-amber-900/20"
                              rowSpan={1}
                            >
                              <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                                🍽️
                              </span>
                            </td>
                          );
                        }

                        const schedule = getScheduleForSlot(day, slot);
                        const courseName = schedule?.classes?.courses?.name;
                        const courseCode = schedule?.classes?.courses?.code;
                        const abbrev = courseCode || getAbbreviation(courseName);

                        // Check if this slot is NOW
                        const parseTime = (t: string) => {
                          const [h, m] = t.split(':').map(Number);
                          return h * 60 + m;
                        };
                        const start = parseTime(slot.start);
                        const end = parseTime(slot.end);
                        const isNow = day === currentDayName && currentTimeMinutes >= start && currentTimeMinutes < end;

                        return (
                          <td
                            key={slotIndex}
                            className={cn(
                              "p-2 text-center border min-w-[80px]",
                              schedule && getSubjectColor(courseName),
                              isNow && "ring-2 ring-destructive ring-inset animate-pulse bg-red-50 dark:bg-red-900/20"
                            )}
                          >
                            {isNow && <Badge variant="destructive" className="mb-1 text-[10px] h-4 py-0 px-1">LIVE</Badge>}
                            {schedule && (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-sm">{abbrev}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No timetable entries found</p>
              <p className="text-sm text-muted-foreground mt-1">Ask your administrator to generate a timetable</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject Legend Table */}
      {subjectFacultyMap.size > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Subject & Faculty Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">SUBJECT CODE</TableHead>
                  <TableHead className="font-bold">SUBJECT NAME</TableHead>
                  <TableHead className="font-bold">FACULTY</TableHead>
                  <TableHead className="font-bold">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      CONTACT
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(subjectFacultyMap.values()).map((subject, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-mono", getSubjectColor(subject.name))}>
                        {subject.code || getAbbreviation(subject.name)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.faculty}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {subject.phone || '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <Card className="shadow-card">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Time Table In-Charge</p>
              <p className="font-semibold">---</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Class In-Charge</p>
              <p className="font-semibold">---</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">HOD</p>
              <p className="font-semibold">---</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout >
  );
}
