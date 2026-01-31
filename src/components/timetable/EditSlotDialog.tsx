import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { DAYS, TIME_SLOTS, type DayOfWeek, type GeneratedSlot } from '@/lib/timetableScheduler';

interface EditSlotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slot: GeneratedSlot | null;
    onSave: (updatedSlot: GeneratedSlot) => void;
    occupiedSlots: Map<string, GeneratedSlot>; // key: "day-slotIndex"
}

export default function EditSlotDialog({
    open,
    onOpenChange,
    slot,
    onSave,
    occupiedSlots,
}: EditSlotDialogProps) {
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
    const [selectedStartSlot, setSelectedStartSlot] = useState<number>(0);

    useEffect(() => {
        if (slot) {
            setSelectedDay(slot.day_of_week);
            const startSlotIndex = TIME_SLOTS.findIndex(s => s.start === slot.start_time);
            setSelectedStartSlot(startSlotIndex !== -1 ? startSlotIndex : 0);
        }
    }, [slot]);

    if (!slot) return null;

    const isLab = slot.isLab;

    // Get available time slots (exclude lunch and check conflicts)
    const getAvailableTimeSlots = () => {
        return TIME_SLOTS.filter(timeSlot => {
            if (timeSlot.isLunch) return false;

            // For labs, need 2 consecutive slots
            if (isLab) {
                const nextSlot = TIME_SLOTS[timeSlot.index + 1];
                if (!nextSlot || nextSlot.isLunch) return false;

                // Check if both slots are available (or currently occupied by this slot)
                const key1 = `${selectedDay}-${timeSlot.index}`;
                const key2 = `${selectedDay}-${timeSlot.index + 1}`;
                const existingSlot1 = occupiedSlots.get(key1);
                const existingSlot2 = occupiedSlots.get(key2);

                const isCurrentSlot1 = existingSlot1?.class_id === slot.class_id &&
                    existingSlot1?.day_of_week === slot.day_of_week &&
                    existingSlot1?.start_time === slot.start_time;
                const isCurrentSlot2 = existingSlot2?.class_id === slot.class_id &&
                    existingSlot2?.day_of_week === slot.day_of_week &&
                    existingSlot2?.start_time === slot.start_time;

                if ((existingSlot1 && !isCurrentSlot1) || (existingSlot2 && !isCurrentSlot2)) {
                    return false;
                }
            } else {
                // For theory, check single slot availability
                const key = `${selectedDay}-${timeSlot.index}`;
                const existingSlot = occupiedSlots.get(key);

                // Allow if slot is empty OR it's the current slot being edited
                const isCurrentSlot = existingSlot?.class_id === slot.class_id &&
                    existingSlot?.day_of_week === slot.day_of_week &&
                    existingSlot?.start_time === slot.start_time;

                if (existingSlot && !isCurrentSlot) {
                    return false;
                }
            }

            return true;
        });
    };

    const availableTimeSlots = getAvailableTimeSlots();

    const handleSave = () => {
        const startTimeSlot = TIME_SLOTS[selectedStartSlot];
        let endTimeSlot: typeof startTimeSlot;
        let slotIndices: number[];

        if (isLab) {
            // Labs span 2 periods
            endTimeSlot = TIME_SLOTS[selectedStartSlot + 1];
            slotIndices = [selectedStartSlot, selectedStartSlot + 1];
        } else {
            endTimeSlot = startTimeSlot;
            slotIndices = [selectedStartSlot];
        }

        const updatedSlot: GeneratedSlot = {
            ...slot,
            day_of_week: selectedDay,
            start_time: startTimeSlot.start,
            end_time: endTimeSlot.end,
            slotIndices,
        };

        onSave(updatedSlot);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Edit Slot
                        <Badge variant={isLab ? "secondary" : "outline"} className={isLab ? "bg-purple-100 text-purple-800" : ""}>
                            {isLab ? 'Lab' : 'Theory'}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Modify the schedule for <span className="font-semibold">{slot.courseName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Course Info (Read-only) */}
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <p className="font-semibold text-sm">{slot.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                            {slot.courseCode} • Faculty: {slot.facultyName}
                        </p>
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
                            Time Slot {isLab && <span className="text-xs text-muted-foreground">(2 consecutive periods)</span>}
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
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
