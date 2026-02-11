import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, GraduationCap, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEPARTMENTS = [
    { value: 'CSE', label: 'Computer Science & Engineering' },
    { value: 'AI&DS', label: 'AI & Data Science' },
    { value: 'EEE', label: 'Electrical & Electronics Engineering' },
    { value: 'ECE', label: 'Electronics & Communication Engineering' },
    { value: 'MECH', label: 'Mechanical Engineering' },
];

const SEMESTERS = [
    { value: '1-1', label: '1-1' },
    { value: '1-2', label: '1-2' },
    { value: '2-1', label: '2-1' },
    { value: '2-2', label: '2-2' },
    { value: '3-1', label: '3-1' },
    { value: '3-2', label: '3-2' },
    { value: '4-1', label: '4-1' },
    { value: '4-2', label: '4-2' },
    { value: 'GRADUATED', label: 'Graduated' },
];

export default function PromoteUsers() {
    const { userRole } = useAuth();
    const [department, setDepartment] = useState('');
    const [fromSemester, setFromSemester] = useState('');
    const [toSemester, setToSemester] = useState('');
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState<number | null>(null);

    if (userRole !== 'admin') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">Only administrators can promote users.</p>
                </div>
            </DashboardLayout>
        )
    }

    const checkCount = async () => {
        if (!department || !fromSemester) return;
        const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('department', department)
            .eq('semester', fromSemester)
            .eq('role', 'student');

        if (error) {
            toast.error('Failed to check student count');
        } else {
            setCount(count);
        }
    };

    const handlePromote = async () => {
        if (!department || !fromSemester || !toSemester) {
            toast.error('Please select all fields');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ semester: toSemester })
                .eq('department', department)
                .eq('semester', fromSemester)
                .eq('role', 'student');

            if (error) throw error;

            toast.success(`Successfully promoted students to ${toSemester}!`);
            setCount(null); // Reset
        } catch (error: any) {
            toast.error(error.message || 'Promotion failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-2xl font-display font-bold">Semester Promotion</h1>
                    <p className="text-muted-foreground">Bulk promote students to the next semester</p>
                </div>

                <Card className="shadow-card border-none ring-1 ring-border/50">
                    <CardHeader>
                        <CardTitle>Promote Cohort</CardTitle>
                        <CardDescription>
                            Select the batch you want to promote. This will update their access to classes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={department} onValueChange={(val) => { setDepartment(val); setCount(null); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map(d => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                            <div className="space-y-2">
                                <Label>From Semester</Label>
                                <Select value={fromSemester} onValueChange={(val) => { setFromSemester(val); setCount(null); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Current" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEMESTERS.filter(s => s.value !== 'GRADUATED').map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pb-3 text-muted-foreground">
                                <ArrowRight className="h-5 w-5" />
                            </div>

                            <div className="space-y-2">
                                <Label>To Semester</Label>
                                <Select value={toSemester} onValueChange={setToSemester}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEMESTERS.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                            <div className="text-sm">
                                {count !== null ? (
                                    <span className="font-medium text-primary">{count} Students found</span>
                                ) : (
                                    <span className="text-muted-foreground">Select criteria to check count</span>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={checkCount} disabled={!department || !fromSemester}>
                                Check Count
                            </Button>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full"
                                    disabled={loading || count === 0 || !toSemester || !fromSemester || !department}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Promote Students
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will move <b>{count} students</b> from {department} {fromSemester} to {toSemester}.
                                        <br /><br />
                                        They will lose access to current classes and gain access to new ones.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePromote}>Confirm Promotion</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
