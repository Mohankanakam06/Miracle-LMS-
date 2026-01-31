import { useState, useMemo } from 'react';
import { useClasses, useTimetable } from '@/hooks/useLMS';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Sparkles,
    Loader2,
    BookOpen,
    Calendar,
    Clock,
    Users,
    Save,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    FileDown,
    Info,
    Pencil,
    Trash2,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    generateOptimizedTimetable,
    DAYS,
    TIME_SLOTS,
    type SelectedClass,
    type GeneratedSlot,
    type FacultyWorkload,
    type DayOfWeek
} from '@/lib/timetableScheduler';
import { generateFacultyTimetablePdf, generateAllFacultyTimetablesPdf } from '@/lib/generateFacultyTimetablePdf'; // Assumed exist
import AddSlotDialog from './AddSlotDialog';
import EditSlotDialog from './EditSlotDialog';

export default function TimetableGenerator() {
    const { data: classes, isLoading: classesLoading } = useClasses();
    const { data: existingTimetable, isLoading: timetableLoading } = useTimetable();
    const queryClient = useQueryClient();

    const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>([]);
    const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSlot[]>([]);
    const [facultyWorkloads, setFacultyWorkloads] = useState<FacultyWorkload[]>([]);
    const [justification, setJustification] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<GeneratedSlot | null>(null);
    const [addDialogDefaultDay, setAddDialogDefaultDay] = useState<DayOfWeek>('Monday');
    const [addDialogDefaultSlot, setAddDialogDefaultSlot] = useState<number>(0);

    // Initialize selected classes from existing ones
    useMemo(() => {
        if (classes && selectedClasses.length === 0) {
            // By default, select all classes for the current semester/year context if we were filtering
            // For now, let's just picking the first 10 to clear the UI or let user select
            // Actually, we should let user select manually or "Select All"
        }
    }, [classes]);

    const toggleClass = (classId: string, isLab: boolean = false) => {
        setSelectedClasses(prev => {
            const exists = prev.find(c => c.id === classId && c.isLab === isLab);
            if (exists) {
                return prev.filter(c => !(c.id === classId && c.isLab === isLab));
            } else {
                const cls = classes?.find(c => c.id === classId);
                if (!cls) return prev;

                return [...prev, {
                    id: cls.id,
                    courseName: cls.courses?.name || 'Unknown',
                    courseCode: cls.courses?.code || '---',
                    teacherId: cls.teacher_id,
                    facultyName: cls.profiles?.full_name || 'TBA',
                    isLab,
                    section: cls.section,
                    classesPerWeek: isLab ? 1 : (cls.courses?.credits || 3),
                    classData: cls
                }];
            }
        });
    };

    const handleGenerate = async () => {
        if (selectedClasses.length === 0) {
            toast.error('Please select at least one subject');
            return;
        }

        setIsGenerating(true);

        // Slight delay to allow UI to update
        setTimeout(() => {
            try {
                const result = generateOptimizedTimetable(
                    selectedClasses,
                    [], // We allow generating from scratch or we could pass existing timetable conflicts
                    // passing empty for now to generate fresh optimal schedule from selected
                );

                setGeneratedSchedule(result.schedule);
                setFacultyWorkloads(result.facultyWorkloads);
                setJustification(result.justification);

                if (result.schedule.length < selectedClasses.length * 4) { // Rough check if some were skipped
                    toast.warning(`Generated ${result.schedule.length} slots. Some subjects might not be fully scheduled due to constraints.`);
                } else {
                    toast.success('Timetable generated successfully!');
                }
            } catch (error) {
                console.error("Generation error:", error);
                toast.error('Failed to generate timetable');
            } finally {
                setIsGenerating(false);
            }
        }, 500);
    };

    const handleSave = async () => {
        if (generatedSchedule.length === 0) return;

        setIsSaving(true);
        try {
            // 1. Delete existing entries for these classes (optional, or we append?)
            // For a fresh generation, usually we want to clear old slots for the selected classes?
            // Let's assume we are appending/upserting. But if we want to replace, we should maybe warn user.
            // For this implementation, let's just insert new slots.

            const slotsToInsert = generatedSchedule.map(slot => ({
                class_id: slot.class_id,
                day_of_week: slot.day_of_week,
                start_time: slot.start_time,
                end_time: slot.end_time,
                room: slot.room
            }));

            const { error } = await supabase
                .from('timetable')
                .insert(slotsToInsert);

            if (error) throw error;

            toast.success(`Saved ${slotsToInsert.length} timetable entries!`);
            queryClient.invalidateQueries({ queryKey: ['timetable'] });

            // Clear generated state after save? OR keep it for review?
            // keep it.
        } catch (error: unknown) {
            console.error('Save error:', error);
            const message = error instanceof Error ? error.message : 'Failed to save timetable';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        setGeneratedSchedule([]);
        setFacultyWorkloads([]);
        setJustification([]);
        setSelectedClasses([]);
    };

    const getSlotForCell = (day: string, slotIndex: number) => {
        return generatedSchedule.find(s => s.day_of_week === day && s.slotIndices.includes(slotIndex));
    };

    // Occupied slots map for conflict detection in add/edit dialogs
    const occupiedSlotsMap = useMemo(() => {
        const map = new Map<string, GeneratedSlot>();
        generatedSchedule.forEach(slot => {
            slot.slotIndices.forEach(idx => {
                map.set(`${slot.day_of_week}-${idx}`, slot);
            });
        });
        return map;
    }, [generatedSchedule]);

    const handleAddSlot = (newSlot: GeneratedSlot) => {
        setGeneratedSchedule(prev => [...prev, newSlot]);
        // Note: We might want to re-calculate workloads here if we want strictly accurate stats
        toast.success('Slot added manually');
    };

    const handleUpdateSlot = (updatedSlot: GeneratedSlot) => {
        setGeneratedSchedule(prev => prev.map(s =>
            (s.class_id === updatedSlot.class_id && s.day_of_week === editingSlot?.day_of_week && s.start_time === editingSlot?.start_time)
                ? updatedSlot
                : s
        ));
        setEditingSlot(null);
        toast.success('Slot updated');
    };

    const removeSlot = (indexToRemove: number) => {
        setGeneratedSchedule(prev => prev.filter((_, idx) => idx !== indexToRemove));
        toast.success('Slot removed');
    };

    // Prepare data for AddSlotDialog selection
    const availableClassOptions = useMemo(() => {
        return classes?.map(c => ({
            id: c.id,
            courseName: c.courses?.name || 'Unknown',
            courseCode: c.courses?.code || '---',
            facultyName: c.profiles?.full_name || 'TBA',
            teacherId: c.teacher_id,
            section: c.section
        })) || [];
    }, [classes]);

    // Derive subject-faculty map for the legend/info tab
    const subjectFacultyMapping = useMemo(() => {
        const map = new Map<string, { name: string; code: string; faculty: string; isLab: boolean }>();
        generatedSchedule.forEach(slot => {
            if (!map.has(slot.courseCode)) {
                map.set(slot.courseCode, {
                    name: slot.courseName,
                    code: slot.courseCode,
                    faculty: slot.facultyName,
                    isLab: slot.isLab
                });
            }
        });
        return map;
    }, [generatedSchedule]);

    if (classesLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Panel: Class Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="h-[calc(100vh-200px)] flex flex-col shadow-card">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg font-display flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Select Subjects
                            </CardTitle>
                            <CardDescription>
                                Choose subjects to schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pt-4 space-y-2">
                            {classes?.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No classes found.</p>
                            ) : (
                                classes?.map(cls => {
                                    const isSelected = selectedClasses.some(c => c.id === cls.id && !c.isLab);
                                    const isLabSelected = selectedClasses.some(c => c.id === cls.id && c.isLab);
                                    return (
                                        <div key={cls.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="mb-2">
                                                <div className="font-semibold text-sm">{cls.courses?.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center justify-between mt-1">
                                                    <span>{cls.courses?.code}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" /> {cls.profiles?.full_name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 text-xs">
                                                <Button
                                                    variant={isSelected ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-7 flex-1"
                                                    onClick={() => toggleClass(cls.id, false)}
                                                >
                                                    {isSelected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                                    Theory
                                                </Button>
                                                <Button
                                                    variant={isLabSelected ? "secondary" : "outline"}
                                                    size="sm"
                                                    className={cn("h-7 flex-1", isLabSelected && "bg-purple-100 text-purple-800 hover:bg-purple-200")}
                                                    onClick={() => toggleClass(cls.id, true)}
                                                >
                                                    {isLabSelected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                                                    Lab
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                        <div className="p-4 border-t bg-muted/20 space-y-2">
                            <Button
                                className="w-full gap-2"
                                onClick={handleGenerate}
                                disabled={isGenerating || selectedClasses.length === 0}
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Generate Timetable
                            </Button>
                            {selectedClasses.length > 0 && (
                                <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleClear}>
                                    Clear Selection
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Panel: Calendar/Results */}
                <div className="lg:col-span-2 space-y-4">
                    {generatedSchedule.length > 0 ? (
                        <Tabs defaultValue="grid" className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList>
                                    <TabsTrigger value="grid" className="gap-2"><Calendar className="h-4 w-4" /> Grid View</TabsTrigger>
                                    <TabsTrigger value="faculty" className="gap-2"><Users className="h-4 w-4" /> Faculty Load</TabsTrigger>
                                    <TabsTrigger value="info" className="gap-2"><Info className="h-4 w-4" /> Info</TabsTrigger>
                                </TabsList>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Slot
                                    </Button>
                                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Timetable
                                    </Button>
                                </div>
                            </div>

                            <TabsContent value="grid" className="space-y-4">
                                <Card className="shadow-card border-2 border-primary/10">
                                    <CardContent className="p-0 overflow-x-auto">
                                        <div className="min-w-[800px]">
                                            <table className="w-full border-collapse text-sm">
                                                <thead>
                                                    <tr className="bg-muted/50 text-left">
                                                        <th className="p-3 border font-semibold w-24 bg-muted text-center">Day / Time</th>
                                                        {TIME_SLOTS.map((slot, idx) => (
                                                            <th key={idx} className={cn(
                                                                "p-2 border font-semibold text-center min-w-[100px]",
                                                                slot.isLunch && "bg-amber-50"
                                                            )}>
                                                                <div className="text-xs text-muted-foreground mb-1">
                                                                    {slot.start} - {slot.end}
                                                                </div>
                                                                {slot.isLunch ? "LUNCH" : slot.label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {DAYS.map(day => (
                                                        <tr key={day}>
                                                            <td className="p-3 border font-medium bg-muted/30 text-center">{day}</td>
                                                            {TIME_SLOTS.map((slot, slotIdx) => {
                                                                if (slot.isLunch) {
                                                                    return <td key={slotIdx} className="p-2 border bg-amber-50/50 text-center text-amber-300">☕</td>;
                                                                }

                                                                const scheduledSlot = getSlotForCell(day, slot.index);
                                                                const isCellStart = scheduledSlot && scheduledSlot.start_time === slot.start;

                                                                // If this slot is part of a lab spanning multiple periods, only render on start
                                                                if (scheduledSlot && scheduledSlot.isLab && !isCellStart) {
                                                                    return null; // Don't render cell, handled by rowspan/colspan logic or just skipped if we use simple grid
                                                                    // Simpler approach: check if this index is in slotIndices. If it's not the first one, skip rendering? 
                                                                    // Wait, HTML table logic needs valid cells.
                                                                    // Let's just render usually, but maybe span?
                                                                }

                                                                // Actually, with simple grid, we can just render. The 'getSlotForCell' works.
                                                                // But for Lab spanning 2 cols:
                                                                if (scheduledSlot && scheduledSlot.isLab && scheduledSlot.slotIndices[0] === slot.index) {
                                                                    return (
                                                                        <td key={slotIdx} colSpan={2} className="p-1 border bg-purple-50 hover:bg-purple-100 transition-colors relative group">
                                                                            <div className="h-full w-full p-2 flex flex-col items-center justify-center text-center gap-1">
                                                                                <Badge variant="secondary" className="bg-purple-200 text-purple-800 border-purple-300 mb-1">LAB</Badge>
                                                                                <span className="font-bold text-xs">{scheduledSlot.courseCode}</span>
                                                                                <span className="text-[10px] text-muted-foreground line-clamp-1">{scheduledSlot.facultyName}</span>
                                                                            </div>
                                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 rounded shadow-sm p-0.5">
                                                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingSlot(scheduledSlot)}>
                                                                                    <Pencil className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeSlot(generatedSchedule.indexOf(scheduledSlot))}>
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    )
                                                                }
                                                                if (scheduledSlot && scheduledSlot.isLab) {
                                                                    return null; // Skip 2nd cell of lab
                                                                }

                                                                return (
                                                                    <td key={slotIdx} className="p-1 border hover:bg-accent/10 transition-colors relative group h-20">
                                                                        {scheduledSlot ? (
                                                                            <div className="h-full w-full p-1 flex flex-col items-center justify-center text-center">
                                                                                <span className="font-bold text-xs mb-1 text-primary">{scheduledSlot.courseCode}</span>
                                                                                <span className="text-[10px] text-muted-foreground line-clamp-2">{scheduledSlot.courseName}</span>
                                                                                <span className="text-[10px] font-medium text-muted-foreground mt-1">{scheduledSlot.facultyName.split(' ')[0]}</span>

                                                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 rounded shadow-sm p-0.5">
                                                                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingSlot(scheduledSlot)}>
                                                                                        <Pencil className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeSlot(generatedSchedule.indexOf(scheduledSlot))}>
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                                                                                onClick={() => {
                                                                                    setAddDialogDefaultDay(day);
                                                                                    setAddDialogDefaultSlot(slot.index);
                                                                                    setIsAddDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <Plus className="h-4 w-4 text-muted-foreground" />
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
                                    </CardContent>
                                </Card>

                                {/* Detailed List */}
                                <div>
                                    <h4 className="font-semibold mb-3">Detailed List:</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px]">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3 font-medium">Course</th>
                                                    <th className="text-left p-3 font-medium">Faculty</th>
                                                    <th className="text-left p-3 font-medium">Type</th>
                                                    <th className="text-left p-3 font-medium">Day</th>
                                                    <th className="text-left p-3 font-medium">Time</th>
                                                    <th className="text-left p-3 font-medium">Room</th>
                                                    <th className="text-right p-3 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {generatedSchedule.map((slot, index) => (
                                                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                                                        <td className="p-3 font-medium">{slot.courseName}</td>
                                                        <td className="p-3 text-muted-foreground">{slot.facultyName}</td>
                                                        <td className="p-3">
                                                            <Badge variant={slot.isLab ? "secondary" : "outline"}
                                                                className={slot.isLab ? "bg-purple-100 text-purple-800" : ""}>
                                                                {slot.isLab ? 'Lab' : 'Theory'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">{slot.day_of_week}</td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                                {slot.start_time} - {slot.end_time}
                                                            </div>
                                                        </td>
                                                        <td className="p-3">{slot.room}</td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setEditingSlot(slot)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeSlot(index)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="faculty">
                                <FacultyWorkloadView workloads={facultyWorkloads} />
                            </TabsContent>

                            <TabsContent value="info" className="space-y-6">
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Info className="h-4 w-4 text-primary" />
                                            Optimization Report
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm">
                                            {justification.map((note, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                    <span>{note}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                <SubjectFacultyMapping mapping={subjectFacultyMapping} />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10">
                            <div className="text-center space-y-3">
                                <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg">Ready to Generate</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Select subjects from the left panel and click "Generate Timetable" to create an optimized schedule automatically.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <AddSlotDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAdd={handleAddSlot}
                occupiedSlots={occupiedSlotsMap}
                availableClasses={availableClassOptions}
                defaultDay={addDialogDefaultDay}
                defaultSlotIndex={addDialogDefaultSlot}
            />

            <EditSlotDialog
                open={!!editingSlot}
                onOpenChange={(open) => !open && setEditingSlot(null)}
                slot={editingSlot}
                onSave={handleUpdateSlot}
                occupiedSlots={occupiedSlotsMap}
            />
        </div>
    );
}

// ---------------- Helper Components ----------------

function FacultyWorkloadView({ workloads }: { workloads: FacultyWorkload[] }) {
    const handleExportSingle = (workload: FacultyWorkload) => {
        generateFacultyTimetablePdf({ workload, departmentName: 'CSE', academicYear: '2025-26', semester: 'Sem 3-2' }); // hardcoded for demo
    };

    const handleExportAll = () => {
        generateAllFacultyTimetablesPdf({ workloads, departmentName: 'CSE', academicYear: '2025-26', semester: 'Sem 3-2' });
    };

    return (
        <div className="space-y-6">
            {workloads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No faculty workload data available</p>
                </div>
            ) : (
                <>
                    {/* Export All Button */}
                    <div className="flex justify-end">
                        <Button onClick={handleExportAll} variant="outline" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Export All Faculty PDFs
                        </Button>
                    </div>

                    {/* Summary Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">Faculty</TableHead>
                                    <TableHead className="font-bold text-center">Total Periods</TableHead>
                                    <TableHead className="font-bold text-center">Morning</TableHead>
                                    <TableHead className="font-bold text-center">Afternoon</TableHead>
                                    {DAYS.map(day => (
                                        <TableHead key={day} className="font-bold text-center text-xs">
                                            {day.substring(0, 3)}
                                        </TableHead>
                                    ))}
                                    <TableHead className="font-bold text-center">Export</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workloads.map((workload, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{workload.teacherName}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{workload.totalPeriods}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{workload.morningPeriods}</TableCell>
                                        <TableCell className="text-center text-sm">{workload.afternoonPeriods}</TableCell>
                                        {DAYS.map(day => (
                                            <TableCell key={day} className="text-center text-sm">
                                                {workload.periodsPerDay.get(day as DayOfWeek) || 0}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleExportSingle(workload)}
                                                title={`Export ${workload.teacherName}'s timetable`}
                                            >
                                                <FileDown className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Individual Faculty Timetables */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Individual Faculty Schedules:</h4>
                        {workloads.map((workload, idx) => (
                            <Card key={idx} className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        {workload.teacherName}
                                        <div className="ml-auto flex items-center gap-2">
                                            <Badge variant="outline">
                                                {workload.totalPeriods} periods/week
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleExportSingle(workload)}
                                                className="gap-1"
                                            >
                                                <FileDown className="h-3 w-3" />
                                                PDF
                                            </Button>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-muted/50">
                                                    <th className="p-2 text-left font-medium border">Day</th>
                                                    <th className="p-2 text-left font-medium border">Schedule</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {DAYS.map(day => {
                                                    const daySchedule = workload.daySchedule.get(day as DayOfWeek) || [];
                                                    return (
                                                        <tr key={day}>
                                                            <td className="p-2 border font-medium w-24">{day}</td>
                                                            <td className="p-2 border">
                                                                {daySchedule.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {daySchedule.map((slot, i) => (
                                                                            <Badge
                                                                                key={i}
                                                                                variant={slot.isLab ? "secondary" : "outline"}
                                                                                className={cn(
                                                                                    "text-xs",
                                                                                    slot.isLab && "bg-purple-100 text-purple-800"
                                                                                )}
                                                                            >
                                                                                {slot.courseCode} ({slot.start_time}-{slot.end_time})
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">Free</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function SubjectFacultyMapping({
    mapping
}: {
    mapping: Map<string, { name: string; code: string; faculty: string; isLab: boolean }>
}) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="font-bold">Subject Code</TableHead>
                        <TableHead className="font-bold">Subject Name</TableHead>
                        <TableHead className="font-bold">Type</TableHead>
                        <TableHead className="font-bold">Faculty</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from(mapping.values()).map((subject, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-mono",
                                        subject.isLab ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                                    )}
                                >
                                    {subject.code}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>
                                <Badge variant={subject.isLab ? "secondary" : "outline"}>
                                    {subject.isLab ? 'Lab' : 'Theory'}
                                </Badge>
                            </TableCell>
                            <TableCell>{subject.faculty}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
