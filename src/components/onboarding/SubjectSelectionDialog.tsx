
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles, useCourses } from '@/hooks/useLMS';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SubjectSelectionDialog() {
    const { user, userRole } = useAuth();
    const { data: profiles } = useProfiles();
    const { data: courses } = useCourses();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');

    const currentProfile = profiles?.find(p => p.id === user?.id);

    useEffect(() => {
        // Condition to open dialog:
        // 1. User is logged in
        // 2. User is a teacher
        // 3. Profile data is loaded
        // 4. Subject is null (not set yet, not skipped with empty string)
        if (user && userRole === 'teacher' && currentProfile && currentProfile.subject === null) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [user, userRole, currentProfile]);

    const handleSave = async () => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subject: selectedSubject || null } as any)
                .eq('id', user.id);

            if (error) throw error;

            if (selectedSubject) {
                toast.success('Subject selection saved!');
            } else {
                toast.success('You can set your subject later in Settings');
            }
            setOpen(false);

            // Invalidate profiles query to update the UI immediately
            await queryClient.invalidateQueries({ queryKey: ['profiles'] });

        } catch (error: unknown) {
            console.error('Error saving subject:', error);
            const message = error instanceof Error ? error.message : 'Failed to save subject';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        if (!user?.id) return;

        setSaving(true);
        try {
            // Set subject to empty string to mark as "skipped"
            const { error } = await supabase
                .from('profiles')
                .update({ subject: '' } as any)
                .eq('id', user.id);

            if (error) throw error;

            toast.info('Subject selection skipped. You can set it later in Settings.');
            setOpen(false);

            await queryClient.invalidateQueries({ queryKey: ['profiles'] });

        } catch (error: unknown) {
            console.error('Error skipping subject:', error);
            const message = error instanceof Error ? error.message : 'Failed to skip';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val && selectedSubject) setOpen(false); }}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Select Your Subject (Optional)</DialogTitle>
                    <DialogDescription>
                        Welcome! You can select your primary subject specialization now or skip and set it later in Settings.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select a subject (optional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border z-50 max-h-[300px]">
                                {courses && courses.length > 0 ? (
                                    courses.map((course) => (
                                        <SelectItem key={course.id} value={course.name}>
                                            {course.name} ({course.code})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-muted-foreground text-center">
                                        No courses available yet
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                        {courses && courses.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No courses found. You can skip this step and set your subject later.
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={saving}
                    >
                        Skip for Now
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {selectedSubject ? 'Confirm Selection' : 'Continue'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
