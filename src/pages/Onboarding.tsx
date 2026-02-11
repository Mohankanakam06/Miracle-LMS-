import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, User, Phone, Hash, Building, Loader2, CheckCircle, Calendar, Users } from 'lucide-react';

// Branch codes mapping (typical JNTU format)
const BRANCHES = [
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'ECE', name: 'Electronics & Communication Engineering' },
    { code: 'EEE', name: 'Electrical & Electronics Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'IT', name: 'Information Technology' },
];

const YEARS = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
];

const SECTIONS = [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' },
    { value: 'D', label: 'Section D' },
    { value: 'E', label: 'Section E' },
];

// Roll number regex pattern - flexible to accept various formats
// Accepts 8-12 alphanumeric characters (most college roll numbers fall in this range)
const ROLL_NUMBER_REGEX = /^[A-Z0-9]{8,12}$/i;

export default function Onboarding() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [rollNumber, setRollNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');

    // Derived state
    const [rollError, setRollError] = useState('');

    const validateRollNumber = (value: string) => {
        const upperValue = value.toUpperCase();
        setRollNumber(upperValue);

        if (upperValue.length > 0 && upperValue.length < 8) {
            setRollError('Roll number must be at least 8 characters');
        } else if (upperValue.length > 12) {
            setRollError('Roll number must be at most 12 characters');
        } else if (upperValue.length >= 8 && !ROLL_NUMBER_REGEX.test(upperValue)) {
            setRollError('Roll number can only contain letters and numbers');
        } else {
            setRollError('');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to complete onboarding.',
                variant: 'destructive',
            });
            navigate('/auth');
            return;
        }

        if (rollError) {
            toast({
                title: 'Invalid Roll Number',
                description: rollError,
                variant: 'destructive',
            });
            return;
        }

        if (phone.length !== 10 || !/^\d+$/.test(phone)) {
            toast({
                title: 'Invalid Phone Number',
                description: 'Please enter a valid 10-digit phone number.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Step 0: Check for duplicate roll number claims
            // @ts-ignore
            const { data: existingClaims, error: claimError } = await supabase
                .from('profiles')
                .select('id, full_name, verification_status, claimed_roll_number, roll_number')
                .neq('id', user.id)
                .or(`claimed_roll_number.eq.${rollNumber.toUpperCase()},roll_number.eq.${rollNumber.toUpperCase()}`);

            if (claimError) {
                console.error('Duplicate check error:', claimError);
            }

            if (existingClaims && existingClaims.length > 0) {
                const verifiedClaim = existingClaims.find(
                    (c: any) => c.verification_status === 'verified'
                );

                if (verifiedClaim) {
                    toast({
                        title: 'Roll Number Already Verified',
                        description: 'This roll number has already been verified by another student. If you believe this is an error, please contact the Admin Office.',
                        variant: 'destructive',
                    });
                    setIsLoading(false);
                    return;
                }
            }

            // Step 1: Update profile with claimed data (Self-reported)
            // @ts-ignore
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    claimed_roll_number: rollNumber.toUpperCase(),
                    phone: phone,
                    department: branch,
                    year: parseInt(year),
                    section: section,
                    // If year is 1, semester is usually 1-1 initially, but we let system handle or default
                    // We can default semester based on year if needed, e.g. "3-1" for year 3
                    semester: `${year}-1`,
                    onboarding_complete: true,
                    verification_status: 'pending',
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Step 2: Attempt auto-verification against master list
            // @ts-ignore
            const { data: masterRecord, error: masterError } = await supabase
                .from('student_master_list')
                .select('*')
                .eq('roll_number', rollNumber.toUpperCase())
                .maybeSingle();

            if (masterError) {
                console.error('Master list check error:', masterError);
            }

            if (masterRecord) {
                // Check if email matches
                if (masterRecord.email.toLowerCase() === user.email?.toLowerCase()) {
                    // Check if already claimed
                    if (masterRecord.is_claimed && masterRecord.claimed_by !== user.id) {
                        // @ts-ignore
                        await supabase
                            .from('profiles')
                            .update({
                                verification_status: 'failed',
                                verification_note: 'Roll number already claimed by another user.',
                            })
                            .eq('id', user.id);
                    } else {
                        // SUCCESS - Auto verify!
                        // @ts-ignore
                        await supabase
                            .from('student_master_list')
                            .update({
                                is_claimed: true,
                                claimed_by: user.id,
                            })
                            .eq('id', masterRecord.id);

                        // Overwrite self-reported data with Master List data
                        // @ts-ignore
                        await supabase
                            .from('profiles')
                            .update({
                                verification_status: 'verified',
                                roll_number: masterRecord.roll_number,
                                department: masterRecord.branch, // Master list authority
                                section: masterRecord.section,   // Master list authority
                                year: masterRecord.year,         // Master list authority
                                regulation: masterRecord.regulation,
                                master_list_id: masterRecord.id,
                                verified_at: new Date().toISOString(),
                            })
                            .eq('id', user.id);

                        toast({
                            title: 'Verification Successful!',
                            description: 'Your identity has been verified. Redirecting to dashboard...',
                        });

                        navigate('/dashboard');
                        return;
                    }
                } else {
                    // Email mismatch
                    // @ts-ignore
                    await supabase
                        .from('profiles')
                        .update({
                            verification_status: 'failed',
                            verification_note: 'Email does not match the college records for this roll number.',
                        })
                        .eq('id', user.id);
                }
            } else {
                // Roll number not found in master list
                // @ts-ignore
                await supabase
                    .from('profiles')
                    .update({
                        verification_status: 'pending',
                        verification_note: 'Roll number not found in master list. Awaiting admin verification.',
                    })
                    .eq('id', user.id);
            }

            toast({
                title: 'Onboarding Complete',
                description: 'Your details have been submitted for verification.',
            });

            navigate('/verification-status');

        } catch (error: any) {
            console.error('Onboarding error:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to complete onboarding.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <GraduationCap className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground">Complete Your Profile</h1>
                    <p className="text-muted-foreground mt-2">
                        Claim your academic identity to access your dashboard
                    </p>
                </div>

                <Card className="shadow-xl border-0">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Student Information
                            </CardTitle>
                            <CardDescription>
                                Enter your academic details exactly as they appear in college records
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Roll Number */}
                            <div className="space-y-2">
                                <Label htmlFor="rollNumber" className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    Roll Number
                                </Label>
                                <Input
                                    id="rollNumber"
                                    type="text"
                                    placeholder="e.g., 21A91A05H7"
                                    value={rollNumber}
                                    onChange={(e) => validateRollNumber(e.target.value)}
                                    className={`h-12 uppercase ${rollError ? 'border-destructive' : ''}`}
                                    required
                                />
                                {rollError && (
                                    <p className="text-sm text-destructive">{rollError}</p>
                                )}
                            </div>

                            {/* Branch */}
                            <div className="space-y-2">
                                <Label htmlFor="branch" className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    Branch / Department
                                </Label>
                                <Select value={branch} onValueChange={setBranch} required>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BRANCHES.map((b) => (
                                            <SelectItem key={b.code} value={b.code}>
                                                {b.name} ({b.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Year */}
                                <div className="space-y-2">
                                    <Label htmlFor="year" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Year
                                    </Label>
                                    <Select value={year} onValueChange={setYear} required>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.map((y) => (
                                                <SelectItem key={y.value} value={y.value}>
                                                    {y.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Section */}
                                <div className="space-y-2">
                                    <Label htmlFor="section" className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        Section
                                    </Label>
                                    <Select value={section} onValueChange={setSection} required>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Sec" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SECTIONS.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="h-12"
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-semibold"
                                disabled={isLoading || !!rollError}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </span>
                                ) : (
                                    'Submit for Verification'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleSignOut}
                                className="w-full text-muted-foreground hover:text-destructive transition-colors"
                            >
                                Sign Out / Go Back
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
