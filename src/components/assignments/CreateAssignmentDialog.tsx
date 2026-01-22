import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateAssignment, useClasses } from '@/hooks/useLMS';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateAssignmentDialog({ open, onOpenChange }: CreateAssignmentDialogProps) {
    const { user } = useAuth();
    const { data: classes } = useClasses();
    const createAssignment = useCreateAssignment();

    const [formData, setFormData] = useState({
        classId: '',
        title: '',
        description: '',
        maxMarks: '',
        dueDate: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error('You must be logged in to create assignments');
            return;
        }

        if (!formData.classId || !formData.title || !formData.maxMarks || !formData.dueDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await createAssignment.mutateAsync({
                classId: formData.classId,
                title: formData.title,
                description: formData.description,
                maxMarks: parseInt(formData.maxMarks),
                dueDate: formData.dueDate,
                createdBy: user.id,
            });

            toast.success('Assignment created successfully');
            setFormData({
                classId: '',
                title: '',
                description: '',
                maxMarks: '',
                dueDate: '',
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error('Failed to create assignment');
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Create a new assignment for your class. Students will be able to view and submit it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="class">Class *</Label>
                        <Select value={formData.classId} onValueChange={(value) => handleChange('classId', value)}>
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border z-50">
                                {classes?.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.courses?.name} - {cls.section} ({cls.academic_year})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="Assignment title"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Assignment description and instructions"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxMarks">Max Marks *</Label>
                            <Input
                                id="maxMarks"
                                type="number"
                                min="1"
                                placeholder="100"
                                value={formData.maxMarks}
                                onChange={(e) => handleChange('maxMarks', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date *</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createAssignment.isPending}>
                            {createAssignment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Assignment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
