import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const passwordStrength = (() => {
        if (!newPassword) return { level: 0, label: '', color: '' };
        let score = 0;
        if (newPassword.length >= 8) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        if (newPassword.length >= 12) score++;

        if (score <= 1) return { level: score, label: 'Weak', color: 'bg-destructive' };
        if (score <= 2) return { level: score, label: 'Fair', color: 'bg-warning' };
        if (score <= 3) return { level: score, label: 'Good', color: 'bg-info' };
        return { level: score, label: 'Strong', color: 'bg-success' };
    })();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Password updated successfully!');

            // Reset after a short delay
            setTimeout(() => {
                setOpen(false);
                setNewPassword('');
                setConfirmPassword('');
                setSuccess(false);
            }, 1500);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
                setNewPassword('');
                setConfirmPassword('');
                setSuccess(false);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    Change Password
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Change Password
                    </DialogTitle>
                    <DialogDescription>
                        Enter your new password below. Make sure it's at least 6 characters.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center py-8 gap-3 animate-fade-in">
                        <div className="p-4 rounded-full bg-success/10">
                            <CheckCircle className="h-10 w-10 text-success" />
                        </div>
                        <p className="text-lg font-semibold">Password Updated!</p>
                        <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-pw">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-pw"
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {newPassword && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passwordStrength.level ? passwordStrength.color : 'bg-muted'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Strength: <span className="font-medium">{passwordStrength.label}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-pw">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-pw"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-destructive">Passwords do not match</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && (
                                <p className="text-xs text-success flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !newPassword || newPassword !== confirmPassword}
                            >
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
