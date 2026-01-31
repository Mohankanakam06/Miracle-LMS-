import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { DAYS, TIME_SLOTS, type DayOfWeek, type GeneratedSlot } from '@/lib/timetableScheduler';

interface ClassOption {
    id: string;
    courseName: string;
    courseCode: string;
    facultyName: string;
    teacherId: string;
    section: string;
}

interface AddSlotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (newSlot: GeneratedSlot) => void;
    occupiedSlots: Map<string, GeneratedSlot>;
    availableClasses: ClassOption[];
    defaultDay?: DayOfWeek;
    defaultSlotIndex?: number;
}

export default function AddSlotDialog({
    open,
    onOpenChange,
    onAdd,
    occupiedSlots,
    availableClasses,
    defaultDay = 'Monday',
    defaultSlotIndex = 0,
}: AddSlotDialogProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [isLab, setIsLab] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);
    const [selectedStartSlot, setSelectedStartSlot] = useState<number>(defaultSlotIndex);

    const selectedClass = availableClasses.find(c => c.id === selectedClassId);

    // Get available time slots (exclude lunch and check conflicts)
    const getAvailableTimeSlots = () => {
        return TIME_SLOTS.filter(timeSlot => {
            if (timeSlot.isLunch) return false;

            // For labs, need 2 consecutive slots
            if (isLab) {
                const nextSlot = TIME_SLOTS[timeSlot.index + 1];
                if (!nextSlot || nextSlot.isLunch) return false;

                const key1 = `${selectedDay}-${timeSlot.index}`;
                const key2 = `${selectedDay}-${timeSlot.index + 1}`;

                if (occupiedSlots.has(key1) || occupiedSlots.has(key2)) {
                    return false;
                }
            } else {
                const key = `${selectedDay}-${timeSlot.index}`;
                if (occupiedSlots.has(key)) {
                    return false;
                }
            }

            return true;
        });
    };

    const availableTimeSlots = getAvailableTimeSlots();

    const handleAdd = () => {
        if (!selectedClass) {
            return;
        }

        const startTimeSlot = TIME_SLOTS[selectedStartSlot];
        let endTimeSlot: typeof startTimeSlot;
        let slotIndices: number[];

        if (isLab) {
            endTimeSlot = TIME_SLOTS[selectedStartSlot + 1];
            slotIndices = [selectedStartSlot, selectedStartSlot + 1];
        } else {
            endTimeSlot = startTimeSlot;
            slotIndices = [selectedStartSlot];
        }

        const newSlot: GeneratedSlot = {
            class_id: selectedClass.id,
            teacher_id: selectedClass.teacherId,
            day_of_week: selectedDay,
            start_time: startTimeSlot.start,
            end_time: endTimeSlot.end,
            room: '',
            courseName: isLab ? `${selectedClass.courseName} LAB` : selectedClass.courseName,
            courseCode: isLab ? `${selectedClass.courseCode}-LAB` : selectedClass.courseCode,
            section: selectedClass.section,
            facultyName: selectedClass.facultyName,
            isLab,
            slotIndices,
        };

        onAdd(newSlot);
        onOpenChange(false);

        // Reset form
        setSelectedClassId('');
        setIsLab(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset form when closing
            setSelectedClassId('');
            setIsLab(false);
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Add New Slot
                    </DialogTitle>
                    <DialogDescription>
                        Manually add a class slot to the generated timetable
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Class Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Select Course
                        </Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClasses.map(cls => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.courseCode} - {cls.courseName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedClass && (
                            <p className="text-xs text-muted-foreground">
                                Faculty: {selectedClass.facultyName}
                            </p>
                        )}
                    </div>

                    {/* Lab Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-0.5">
                            <Label>Lab Session</Label>
                            <p className="text-xs text-muted-foreground">
                                Labs take 2 consecutive periods
                            </p>
                        </div>
                        <Switch
                            checked={isLab}
                            onCheckedChange={setIsLab}
                        />
                    </div>

                    {/* Day Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Day
                        </Label>
                        <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS.map(day => (
                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time Slot Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Slot {isLab && <Badge variant="outline" className="text-xs">2 periods</Badge>}
                        </Label>
                        <Select
                            value={selectedStartSlot.toString()}
                            onValueChange={(v) => setSelectedStartSlot(parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTimeSlots.map(timeSlot => {
                                    const displayLabel = isLab
                                        ? `${timeSlot.label} - ${TIME_SLOTS[timeSlot.index + 1]?.label?.split(' - ')[1] || ''}`
                                        : timeSlot.label;
                                    return (
                                        <SelectItem key={timeSlot.index} value={timeSlot.index.toString()}>
                                            {displayLabel}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        {availableTimeSlots.length === 0 && (
                            <p className="text-xs text-destructive">No available slots for this day</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedClassId || availableTimeSlots.length === 0}
                    >
                        Add Slot
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
