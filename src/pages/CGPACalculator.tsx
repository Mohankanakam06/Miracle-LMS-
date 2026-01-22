import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, Plus, Trash2, RotateCcw, TrendingUp, Award, BookOpen, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

interface Semester {
  id: string;
  name: string;
  sgpa: string;
  credits: string;
}

const gradePoints: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
};

const gradeLabels: Record<string, string> = {
  'O': 'Outstanding (O) - 10',
  'A+': 'Excellent (A+) - 9',
  'A': 'Very Good (A) - 8',
  'B+': 'Good (B+) - 7',
  'B': 'Above Average (B) - 6',
  'C': 'Average (C) - 5',
  'P': 'Pass (P) - 4',
  'F': 'Fail (F) - 0',
};

const defaultSubjects: Subject[] = [
  { id: '1', name: 'Data Structures & Algorithms', credits: '4', grade: '' },
  { id: '2', name: 'Database Management Systems', credits: '4', grade: '' },
  { id: '3', name: 'Operating Systems', credits: '3', grade: '' },
  { id: '4', name: 'Computer Networks', credits: '4', grade: '' },
  { id: '5', name: 'Software Engineering', credits: '3', grade: '' },
];

const defaultSemesters: Semester[] = [
  { id: '1', name: 'Semester 1', sgpa: '', credits: '22' },
  { id: '2', name: 'Semester 2', sgpa: '', credits: '24' },
  { id: '3', name: 'Semester 3', sgpa: '', credits: '23' },
  { id: '4', name: 'Semester 4', sgpa: '', credits: '24' },
];

export default function CGPACalculator() {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [semesters, setSemesters] = useState<Semester[]>(defaultSemesters);
  const [sgpaResult, setSgpaResult] = useState<number | null>(null);
  const [cgpaResult, setCgpaResult] = useState<number | null>(null);

  // SGPA Calculation
  const calculateSGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    subjects.forEach(subject => {
      const credits = parseFloat(subject.credits) || 0;
      const gradePoint = gradePoints[subject.grade] ?? 0;
      
      if (credits > 0 && subject.grade) {
        totalCredits += credits;
        totalGradePoints += credits * gradePoint;
      }
    });

    if (totalCredits > 0) {
      const sgpa = totalGradePoints / totalCredits;
      setSgpaResult(Math.round(sgpa * 100) / 100);
    } else {
      setSgpaResult(null);
    }
  };

  // CGPA Calculation
  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    semesters.forEach(semester => {
      const credits = parseFloat(semester.credits) || 0;
      const sgpa = parseFloat(semester.sgpa) || 0;
      
      if (credits > 0 && sgpa > 0) {
        totalCredits += credits;
        totalGradePoints += credits * sgpa;
      }
    });

    if (totalCredits > 0) {
      const cgpa = totalGradePoints / totalCredits;
      setCgpaResult(Math.round(cgpa * 100) / 100);
    } else {
      setCgpaResult(null);
    }
  };

  const addSubject = () => {
    const newId = (subjects.length + 1).toString();
    setSubjects([...subjects, { id: newId, name: '', credits: '3', grade: '' }]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSemester = () => {
    const newId = (semesters.length + 1).toString();
    setSemesters([...semesters, { id: newId, name: `Semester ${semesters.length + 1}`, sgpa: '', credits: '22' }]);
  };

  const removeSemester = (id: string) => {
    if (semesters.length > 1) {
      setSemesters(semesters.filter(s => s.id !== id));
    }
  };

  const updateSemester = (id: string, field: keyof Semester, value: string) => {
    setSemesters(semesters.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const resetSGPA = () => {
    setSubjects(defaultSubjects);
    setSgpaResult(null);
  };

  const resetCGPA = () => {
    setSemesters(defaultSemesters);
    setCgpaResult(null);
  };

  const getGradeColor = (grade: string) => {
    if (['O', 'A+'].includes(grade)) return 'text-success';
    if (['A', 'B+'].includes(grade)) return 'text-info';
    if (['B', 'C'].includes(grade)) return 'text-warning';
    if (grade === 'F') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getResultColor = (value: number) => {
    if (value >= 9) return 'text-success';
    if (value >= 7.5) return 'text-info';
    if (value >= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getPerformanceLabel = (value: number) => {
    if (value >= 9) return 'Outstanding';
    if (value >= 8) return 'Excellent';
    if (value >= 7) return 'Very Good';
    if (value >= 6) return 'Good';
    if (value >= 5) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            CGPA/SGPA Calculator
          </h1>
          <p className="text-muted-foreground">Calculate your semester and cumulative grade point average</p>
        </div>

        {/* Grade Scale Reference */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Grade Point Scale (10-Point System)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(gradePoints).map(([grade, point]) => (
                <Badge 
                  key={grade} 
                  variant="outline" 
                  className={cn("font-medium", getGradeColor(grade))}
                >
                  {grade}: {point} points
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calculator Tabs */}
        <Tabs defaultValue="sgpa" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sgpa" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              SGPA Calculator
            </TabsTrigger>
            <TabsTrigger value="cgpa" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              CGPA Calculator
            </TabsTrigger>
          </TabsList>

          {/* SGPA Calculator */}
          <TabsContent value="sgpa" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Input Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display">Enter Subject Details</CardTitle>
                        <CardDescription>Add your subjects with credits and grades</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetSGPA}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                        <Button variant="outline" size="sm" onClick={addSubject}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Subject
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div 
                        key={subject.id} 
                        className="grid grid-cols-12 gap-3 p-3 rounded-lg bg-muted/30 items-end"
                      >
                        <div className="col-span-5">
                          <Label className="text-xs text-muted-foreground">Subject Name</Label>
                          <Input
                            placeholder="Enter subject name"
                            value={subject.name}
                            onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Credits</Label>
                          <Input
                            type="number"
                            min="1"
                            max="6"
                            placeholder="Credits"
                            value={subject.credits}
                            onChange={(e) => updateSubject(subject.id, 'credits', e.target.value)}
                          />
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs text-muted-foreground">Grade</Label>
                          <Select 
                            value={subject.grade} 
                            onValueChange={(value) => updateSubject(subject.id, 'grade', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(gradeLabels).map(([grade, label]) => (
                                <SelectItem key={grade} value={grade}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeSubject(subject.id)}
                            disabled={subjects.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button className="w-full mt-4" onClick={calculateSGPA}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate SGPA
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Result Section */}
              <div className="space-y-4">
                <Card className={cn(
                  "shadow-card transition-all",
                  sgpaResult !== null && "border-primary/50 bg-primary/5"
                )}>
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Your SGPA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-6">
                    {sgpaResult !== null ? (
                      <>
                        <p className={cn("text-6xl font-display font-bold", getResultColor(sgpaResult))}>
                          {sgpaResult.toFixed(2)}
                        </p>
                        <Badge className="mt-3" variant="secondary">
                          {getPerformanceLabel(sgpaResult)}
                        </Badge>
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>Total Credits: {subjects.reduce((acc, s) => acc + (parseFloat(s.credits) || 0), 0)}</p>
                          <p>Subjects: {subjects.filter(s => s.grade).length}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">
                        <p className="text-4xl font-display font-bold mb-2">--</p>
                        <p className="text-sm">Enter grades and click calculate</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Formula Card */}
                <Card className="shadow-card bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">SGPA Formula:</p>
                    <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded">
                      SGPA = Σ(Credit × Grade Point) / Σ(Credit)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* CGPA Calculator */}
          <TabsContent value="cgpa" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Input Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display">Enter Semester Details</CardTitle>
                        <CardDescription>Add your semesters with SGPA and total credits</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetCGPA}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                        <Button variant="outline" size="sm" onClick={addSemester}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Semester
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {semesters.map((semester) => (
                      <div 
                        key={semester.id} 
                        className="grid grid-cols-12 gap-3 p-3 rounded-lg bg-muted/30 items-end"
                      >
                        <div className="col-span-4">
                          <Label className="text-xs text-muted-foreground">Semester</Label>
                          <Input
                            placeholder="Semester name"
                            value={semester.name}
                            onChange={(e) => updateSemester(semester.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">SGPA</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="e.g., 8.5"
                            value={semester.sgpa}
                            onChange={(e) => updateSemester(semester.id, 'sgpa', e.target.value)}
                          />
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs text-muted-foreground">Total Credits</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Total credits"
                            value={semester.credits}
                            onChange={(e) => updateSemester(semester.id, 'credits', e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeSemester(semester.id)}
                            disabled={semesters.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button className="w-full mt-4" onClick={calculateCGPA}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate CGPA
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Result Section */}
              <div className="space-y-4">
                <Card className={cn(
                  "shadow-card transition-all",
                  cgpaResult !== null && "border-success/50 bg-success/5"
                )}>
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      Your CGPA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-6">
                    {cgpaResult !== null ? (
                      <>
                        <p className={cn("text-6xl font-display font-bold", getResultColor(cgpaResult))}>
                          {cgpaResult.toFixed(2)}
                        </p>
                        <Badge className="mt-3" variant="secondary">
                          {getPerformanceLabel(cgpaResult)}
                        </Badge>
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>Total Credits: {semesters.reduce((acc, s) => acc + (parseFloat(s.credits) || 0), 0)}</p>
                          <p>Semesters: {semesters.filter(s => s.sgpa).length}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">
                        <p className="text-4xl font-display font-bold mb-2">--</p>
                        <p className="text-sm">Enter SGPA values and click calculate</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Formula Card */}
                <Card className="shadow-card bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">CGPA Formula:</p>
                    <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded">
                      CGPA = Σ(Credit × SGPA) / Σ(Credit)
                    </p>
                  </CardContent>
                </Card>

                {/* Percentage Conversion */}
                {cgpaResult !== null && (
                  <Card className="shadow-card bg-accent/5 border-accent/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium mb-1">Equivalent Percentage</p>
                      <p className="text-2xl font-display font-bold text-accent">
                        {((cgpaResult - 0.75) * 10).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Using formula: (CGPA - 0.75) × 10
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}