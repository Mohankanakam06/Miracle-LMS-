import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateClass, useCourses } from '@/hooks/useLMS';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePeriodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreatePeriodDialog({ open, onOpenChange }: CreatePeriodDialogProps) {
    const { user } = useAuth();
    const { data: courses } = useCourses();
    const createClass = useCreateClass();

    const [formData, setFormData] = useState({
        courseId: '',
        section: '',
        academicYear: '',
        room: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error('You must be logged in to create periods');
            return;
        }

        if (!formData.courseId || !formData.section || !formData.academicYear) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await createClass.mutateAsync({
                courseId: formData.courseId,
                teacherId: user.id,
                section: formData.section,
                academicYear: formData.academicYear,
                room: formData.room,
            });

            toast.success('Class period created successfully');
            setFormData({
                courseId: '',
                section: '',
                academicYear: '',
                room: '',
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating class period:', error);
            toast.error('Failed to create class period');
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Class Period</DialogTitle>
                    <DialogDescription>
                        Create a new class period. This will be used for attendance and assignments.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="course">Course *</Label>
                        <Select value={formData.courseId} onValueChange={(value) => handleChange('courseId', value)}>
                            <SelectTrigger id="course">
                                <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border z-50">
                                {courses?.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.code} - {course.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section">Section *</Label>
                        <Input
                            id="section"
                            placeholder="e.g., A, B, C"
                            value={formData.section}
                            onChange={(e) => handleChange('section', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="academicYear">Academic Year *</Label>
                        <Input
                            id="academicYear"
                            placeholder="e.g., 2024-2025"
                            value={formData.academicYear}
                            onChange={(e) => handleChange('academicYear', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="room">Room Number</Label>
                        <Input
                            id="room"
                            placeholder="e.g., 301, Lab-A"
                            value={formData.room}
                            onChange={(e) => handleChange('room', e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createClass.isPending}>
                            {createClass.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Period
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
