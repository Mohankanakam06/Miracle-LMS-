import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Mail } from 'lucide-react';

export default function VerificationStatus() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // Fetch profile status
    const { data: profile, isLoading, refetch } = useQuery({
        queryKey: ['profile-verification', user?.id],
        queryFn: async () => {
            if (!user) return null;
            // @ts-ignore - new fields not in generated types yet
            const { data, error } = await supabase
                .from('profiles')
                .select('verification_status, verification_note, roll_number, department, section, full_name, onboarding_complete')
                .eq('id', user.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user,
        refetchInterval: 5000, // Poll every 5 seconds
    });

    useEffect(() => {
        if (profile?.verification_status === 'verified') {
            navigate('/dashboard', { replace: true });
        }
    }, [profile?.verification_status, navigate]);

    useEffect(() => {
        if (!user) {
            navigate('/auth', { replace: true });
        }
    }, [user, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Checking verification status...</p>
                </div>
            </div>
        );
    }

    const renderStatusContent = () => {
        switch (profile?.verification_status) {
            case 'verified':
                return (
                    <Card className="border-success/30 bg-success/5">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto mb-4 p-4 rounded-full bg-success/10">
                                <CheckCircle className="h-12 w-12 text-success" />
                            </div>
                            <CardTitle className="text-2xl text-success">Verification Complete!</CardTitle>
                            <CardDescription>
                                Your identity has been verified successfully
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <div className="p-4 bg-success/10 rounded-lg">
                                <p className="text-sm text-muted-foreground">Roll Number</p>
                                <p className="text-lg font-bold">{profile?.roll_number}</p>
                            </div>
                            <Button onClick={() => navigate('/dashboard')} className="w-full">
                                Go to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                );

            case 'failed':
                return (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10">
                                <XCircle className="h-12 w-12 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl text-destructive">Verification Failed</CardTitle>
                            <CardDescription>
                                We could not verify your identity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-destructive/10 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-destructive">Reason:</p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile?.verification_note || 'Unknown error. Please contact the admin office.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    If you believe this is an error, please contact the Admin Office with your student ID.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-primary">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm font-medium">admin@miraclecollege.edu</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleLogout} className="flex-1">
                                    Logout
                                </Button>
                                <Button onClick={() => navigate('/onboarding')} className="flex-1">
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'pending':
            default:
                return (
                    <Card className="border-warning/30 bg-warning/5">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto mb-4 p-4 rounded-full bg-warning/10">
                                <Clock className="h-12 w-12 text-warning animate-pulse" />
                            </div>
                            <CardTitle className="text-2xl text-warning-foreground">Verification Pending</CardTitle>
                            <CardDescription>
                                Your account is being reviewed by an administrator
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-card rounded-lg border space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Name</span>
                                    <span className="font-medium">{profile?.full_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Branch</span>
                                    <span className="font-medium">{profile?.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <span className="px-2 py-1 bg-warning/10 text-warning rounded text-sm font-medium">
                                        Pending Review
                                    </span>
                                </div>
                            </div>

                            {profile?.verification_note && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Note: {profile.verification_note}</p>
                                </div>
                            )}

                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    This page will automatically update when your account is verified.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh Status
                                </Button>
                            </div>

                            <div className="pt-4 border-t">
                                <Button variant="ghost" onClick={handleLogout} className="w-full">
                                    Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <GraduationCap className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground">Miracle LMS</h1>
                    <p className="text-muted-foreground mt-1">Secure & Verified Platform</p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-primary">Login</span>
                    </div>
                    <div className="w-8 h-0.5 bg-primary"></div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-primary">Claimed</span>
                    </div>
                    <div className="w-8 h-0.5 bg-warning"></div>
                    <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${profile?.verification_status === 'verified'
                            ? 'bg-success text-white'
                            : profile?.verification_status === 'failed'
                                ? 'bg-destructive text-white'
                                : 'bg-warning text-white'
                            }`}>
                            {profile?.verification_status === 'verified' ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : profile?.verification_status === 'failed' ? (
                                <XCircle className="h-4 w-4" />
                            ) : (
                                '3'
                            )}
                        </div>
                        <span className={`text-sm font-medium ${profile?.verification_status === 'verified'
                            ? 'text-success'
                            : profile?.verification_status === 'failed'
                                ? 'text-destructive'
                                : 'text-warning'
                            }`}>
                            {profile?.verification_status === 'verified'
                                ? 'Verified'
                                : profile?.verification_status === 'failed'
                                    ? 'Failed'
                                    : 'Pending'
                            }
                        </span>
                    </div>
                </div>

                {/* Status Card */}
                {renderStatusContent()}
            </div>
        </div>
    );
}
