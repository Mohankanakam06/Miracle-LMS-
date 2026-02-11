import { useState } from 'react';
import { useClasses, useTimetable } from '@/hooks/useLMS';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    Plus,
    Loader2,
    Trash2,
    Edit2,
    X,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

const DAYS = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
];

// Fixed college time periods
const PERIODS = [
    { value: '1', label: '1st Period', start: '09:15', end: '10:05' },
    { value: '2', label: '2nd Period', start: '10:05', end: '10:55' },
    { value: '3', label: '3rd Period', start: '11:05', end: '11:55' },
    { value: '4', label: '4th Period', start: '11:55', end: '12:45' },
    { value: '5', label: '5th Period', start: '13:25', end: '14:15' },
    { value: '6', label: '6th Period', start: '14:15', end: '15:05' },
    { value: '7', label: '7th Period', start: '15:05', end: '15:55' },
    // Lab periods (2 consecutive periods)
    { value: 'lab-12', label: 'Lab (1st & 2nd Period)', start: '09:15', end: '10:55', isLab: true },
    { value: 'lab-23', label: 'Lab (2nd & 3rd Period)', start: '10:05', end: '11:55', isLab: true },
    { value: 'lab-34', label: 'Lab (3rd & 4th Period)', start: '11:05', end: '12:45', isLab: true },
    { value: 'lab-56', label: 'Lab (5th & 6th Period)', start: '13:25', end: '15:05', isLab: true },
    { value: 'lab-67', label: 'Lab (6th & 7th Period)', start: '14:15', end: '15:55', isLab: true },
];

interface EditingEntry {
    id: string;
    class_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface ManualTimetableEntryProps {
    selectedDepartment?: string;
    selectedSemester?: string;
    selectedSection?: string;
}

export default function ManualTimetableEntry({
    selectedDepartment,
    selectedSemester,
    selectedSection
}: ManualTimetableEntryProps) {
    const { user } = useAuth();
    const { data: classes, isLoading: classesLoading } = useClasses();
    const { data: existingTimetable, isLoading: timetableLoading } = useTimetable();
    const queryClient = useQueryClient();

    const [classId, setClassId] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);

    // Custom subject entry
    const [useCustomSubject, setUseCustomSubject] = useState(false);
    const [customSubjectName, setCustomSubjectName] = useState('');
    const [customSubjectCode, setCustomSubjectCode] = useState('');
    const [customSection, setCustomSection] = useState(selectedSection || 'A');

    // Filter classes based on context
    const filteredClasses = classes?.filter(c => {
        if (!selectedDepartment && !selectedSemester && !selectedSection) return true;

        // Filter by Department
        if (selectedDepartment && c.courses?.department !== selectedDepartment) return false;

        // Filter by Section
        if (selectedSection && c.section !== selectedSection) return false;

        // Filter by Semester
        if (selectedSemester && c.courses?.semester) {
            const [yearStr, semStr] = selectedSemester.split('-');
            const year = parseInt(yearStr);
            const sem = parseInt(semStr);
            const targetSem = (year - 1) * 2 + sem;
            if (c.courses.semester !== targetSem) return false;
        }

        return true;
    });

    const resetForm = () => {
        setClassId('');
        setDayOfWeek('');
        setSelectedPeriod('');
        setEditingEntry(null);
        setUseCustomSubject(false);
        setCustomSubjectName('');
        setCustomSubjectCode('');
        setCustomSection(selectedSection || 'A');
    };

    // Get time from selected period
    const getTimesFromPeriod = (periodValue: string) => {
        const period = PERIODS.find(p => p.value === periodValue);
        return period ? { start: period.start, end: period.end } : null;
    };

    // Find period by start and end time
    const findPeriodByTime = (start: string, end: string) => {
        const period = PERIODS.find(p => p.start === start && p.end === end);
        return period?.value || '';
    };

    const handleAddEntry = async () => {
        if (!dayOfWeek || !selectedPeriod) {
            toast.error('Please select day and period');
            return;
        }

        if (useCustomSubject) {
            if (!customSubjectName.trim() || !customSubjectCode.trim()) {
                toast.error('Please enter subject name and code');
                return;
            }
        } else {
            if (!classId) {
                toast.error('Please select a class');
                return;
            }
        }

        const times = getTimesFromPeriod(selectedPeriod);
        if (!times) {
            toast.error('Invalid period selected');
            return;
        }

        setIsSaving(true);

        try {
            let finalClassId = classId;

            // If using custom subject, create the course and class first
            if (useCustomSubject) {
                let semesterInt = 1;
                if (selectedSemester) {
                    const [yearStr, semStr] = selectedSemester.split('-');
                    const year = parseInt(yearStr);
                    const sem = parseInt(semStr);
                    semesterInt = (year - 1) * 2 + sem;
                }

                // Step 1: Create the course
                const { data: newCourse, error: courseError } = await supabase
                    .from('courses')
                    .insert({
                        name: customSubjectName.trim(),
                        code: customSubjectCode.trim().toUpperCase(),
                        semester: semesterInt,
                        department: selectedDepartment || 'Common',
                        credits: 3,
                    })
                    .select()
                    .single();

                if (courseError) throw courseError;

                // Step 2: Create a class for this course
                const { data: newClass, error: classError } = await supabase
                    .from('classes')
                    .insert({
                        course_id: newCourse.id,
                        teacher_id: user?.id,
                        section: customSection,
                        academic_year: '2025-2026',
                    })
                    .select()
                    .single();

                if (classError) throw classError;

                finalClassId = newClass.id;

                // Invalidate classes query to refresh the dropdown
                queryClient.invalidateQueries({ queryKey: ['classes'] });
            }

            // Step 3: Add timetable entry
            const { error } = await supabase
                .from('timetable')
                .insert({
                    class_id: finalClassId,
                    day_of_week: dayOfWeek,
                    start_time: times.start,
                    end_time: times.end,
                    room: null,
                });

            if (error) throw error;

            toast.success(useCustomSubject
                ? 'Subject created and added to timetable!'
                : 'Timetable entry added successfully'
            );
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['timetable'] });
        } catch (error: unknown) {
            console.error('Error adding timetable entry:', error);
            const message = error instanceof Error ? error.message : 'Failed to add entry';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateEntry = async () => {
        if (!editingEntry) return;

        if (editingEntry.start_time >= editingEntry.end_time) {
            toast.error('End time must be after start time');
            return;
        }

        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('timetable')
                .update({
                    class_id: editingEntry.class_id,
                    day_of_week: editingEntry.day_of_week,
                    start_time: editingEntry.start_time,
                    end_time: editingEntry.end_time,
                })
                .eq('id', editingEntry.id);

            if (error) throw error;

            toast.success('Timetable entry updated');
            setEditingEntry(null);
            queryClient.invalidateQueries({ queryKey: ['timetable'] });
        } catch (error: unknown) {
            console.error('Error updating entry:', error);
            const message = error instanceof Error ? error.message : 'Failed to update entry';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const { error } = await supabase
                .from('timetable')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Entry deleted');
            queryClient.invalidateQueries({ queryKey: ['timetable'] });
        } catch (error: unknown) {
            console.error('Error deleting entry:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete entry';
            toast.error(message);
        }
    };

    const startEditing = (entry: { id: string; class_id: string; day_of_week: string; start_time: string; end_time: string }) => {
        setEditingEntry({
            id: entry.id,
            class_id: entry.class_id,
            day_of_week: entry.day_of_week,
            start_time: entry.start_time.substring(0, 5),
            end_time: entry.end_time.substring(0, 5),
        });
    };

    if (classesLoading || timetableLoading) {
        return (
            <Card className="shadow-card">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Add Entry Form */}
            <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                        Add Timetable Entry
                    </CardTitle>
                    <CardDescription>
                        Manually add class slots to the timetable for <strong>{selectedDepartment} {selectedSemester} Section {selectedSection}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Toggle for Custom Subject */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 mb-4">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2 font-medium">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Create New Subject
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Add a custom subject without going to Courses Management
                            </p>
                        </div>
                        <Switch
                            checked={useCustomSubject}
                            onCheckedChange={(checked) => {
                                setUseCustomSubject(checked);
                                if (checked) setClassId('');
                            }}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {useCustomSubject ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Subject Name *</Label>
                                    <Input
                                        value={customSubjectName}
                                        onChange={(e) => setCustomSubjectName(e.target.value)}
                                        placeholder="e.g., Data Structures"
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject Code *</Label>
                                    <Input
                                        value={customSubjectCode}
                                        onChange={(e) => setCustomSubjectCode(e.target.value.toUpperCase())}
                                        placeholder="e.g., CS201"
                                        maxLength={20}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select value={customSection} onValueChange={setCustomSection}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Section A</SelectItem>
                                            <SelectItem value="B">Section B</SelectItem>
                                            <SelectItem value="C">Section C</SelectItem>
                                            <SelectItem value="D">Section D</SelectItem>
                                            <SelectItem value="E">Section E</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select Class *</Label>
                                <Select value={classId} onValueChange={setClassId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredClasses?.length === 0 ? (
                                            <SelectItem value="none" disabled>No classes found for this filter</SelectItem>
                                        ) : (
                                            filteredClasses?.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.courses?.code} - {c.courses?.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Day *</Label>
                            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map(d => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Period *</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Theory Periods</div>
                                    {PERIODS.filter(p => !p.isLab).map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label} ({p.start} - {p.end})
                                        </SelectItem>
                                    ))}
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">Lab Sessions (2 periods)</div>
                                    {PERIODS.filter(p => p.isLab).map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label} ({p.start} - {p.end})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleAddEntry} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {useCustomSubject ? 'Creating...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {useCustomSubject ? 'Create & Add' : 'Add Entry'}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Existing Entries */}
            <Card className="shadow-card">
                <CardHeader>
                    <CardTitle className="font-display text-lg">
                        Existing Timetable Entries ({existingTimetable?.length || 0})
                    </CardTitle>
                    <CardDescription>
                        View, edit, or delete existing timetable entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {existingTimetable && existingTimetable.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Section</TableHead>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {existingTimetable.map(entry => (
                                        <TableRow key={entry.id}>
                                            {editingEntry?.id === entry.id ? (
                                                <>
                                                    <TableCell colSpan={2}>
                                                        <Select
                                                            value={editingEntry.class_id}
                                                            onValueChange={(v) => setEditingEntry({ ...editingEntry, class_id: v })}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {classes?.map(c => (
                                                                    <SelectItem key={c.id} value={c.id}>
                                                                        {c.courses?.name} - {c.section}
                                                                    </SelectItem>
                                                                ))
                                                                }
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={editingEntry.day_of_week}
                                                            onValueChange={(v) => setEditingEntry({ ...editingEntry, day_of_week: v })}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {DAYS.map(d => (
                                                                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                                                ))
                                                                }
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={findPeriodByTime(editingEntry.start_time, editingEntry.end_time)}
                                                            onValueChange={(v) => {
                                                                const period = PERIODS.find(p => p.value === v);
                                                                if (period) {
                                                                    setEditingEntry({ ...editingEntry, start_time: period.start, end_time: period.end });
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full min-w-[180px]">
                                                                <SelectValue placeholder="Select period" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {PERIODS.filter(p => !p.isLab).map(p => (
                                                                    <SelectItem key={p.value} value={p.value}>
                                                                        {p.label}
                                                                    </SelectItem>
                                                                ))}
                                                                {PERIODS.filter(p => p.isLab).map(p => (
                                                                    <SelectItem key={p.value} value={p.value}>
                                                                        {p.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleUpdateEntry}
                                                                disabled={isSaving}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 text-success" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEditingEntry(null)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="font-medium">
                                                        {entry.classes?.courses?.name || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {entry.classes?.courses?.code || '---'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {entry.classes?.section || 'A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{entry.day_of_week}</TableCell>
                                                    <TableCell>
                                                        {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => startEditing(entry)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteEntry(entry.id)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                    }
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No timetable entries yet. Add your first entry above.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
