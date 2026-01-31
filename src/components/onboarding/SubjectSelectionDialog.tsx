
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
        // 4. Subject is missing/empty/null
        if (user && userRole === 'teacher' && currentProfile && !currentProfile.subject) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [user, userRole, currentProfile]);

    const handleSave = async () => {
        if (!user?.id || !selectedSubject) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subject: selectedSubject } as any)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Subject selection saved!');
            setOpen(false);
            // Optionally force reload or invalidate queries, but React Query should handle profile update if we invalidate
            // Since we are using direct supabase call, we should ideally invalidate.
            // But for this simple implementation, the local state update in settings might be needed, 
            // but here we just close the dialog. The Dashboard might re-render.

            // To be safe, reload window or rely on realtime if enabled. 
            // For now, let's assume global state update will happen eventually or refresh.
            // Invalidate profiles query to update the UI immediately without reload
            await queryClient.invalidateQueries({ queryKey: ['profiles'] });

        } catch (error: unknown) {
            console.error('Error saving subject:', error);
            const message = error instanceof Error ? error.message : 'Failed to save subject';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    // prevent closing by clicking outside if it's mandatory
    // onOpenChange={(val) => !val ? null : setOpen(val)} which effectively disables closing if we don't pass a setter that allows false
    // But for better UX, we'll allow closing but it might pop up again on refresh/nav.
    // Actually, "onOpenChange={setOpen}" allows closing. 
    // To force, we can control it and only allow closing if subject is saved (handled by internal logic)
    // or just pass `onOpenChange={() => {}}` (no-op) to prevent closing via backdrop.

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val && selectedSubject) setOpen(false); }}>
            {/* Simple hack: only allow close if value selected? No, usually false is passed on escape/backdrop.
                 To make it strictly modal (blocking): don't provide onOpenChange or provide no-op. 
                 But shadcn Dialog might require onOpenChange. 
                 Let's stick to simple open state.
             */}
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Select Your Subject</DialogTitle>
                    <DialogDescription>
                        Welcome! Please select your primary subject specialization to continue.
                        You can change this later in Settings.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border z-50 max-h-[300px]">
                                {courses?.map((course) => (
                                    <SelectItem key={course.id} value={course.name}>
                                        {course.name} ({course.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!selectedSubject || saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm Selection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
