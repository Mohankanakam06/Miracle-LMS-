import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Mail, Lock, ArrowRight, Bell, Calendar, BookOpen, Users, User, Loader2 } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// College brand color (matching logo)
const COLLEGE_NAVY = '#1e3a5f';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Redirecting to dashboard...',
      });
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'student', // Default to student for self-signup
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile with student role and verification fields
        // @ts-ignore - new fields not in generated types yet
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: 'student',
          onboarding_complete: false,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        toast({
          title: 'Account Created!',
          description: 'Please check your email to verify your account, then log in to complete onboarding.',
        });

        // Switch to login view
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLLEGE_NAVY }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Announcements */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: COLLEGE_NAVY }}
      >
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              {/* Logo without box - displayed fully */}
              <img
                src="/logo.png"
                alt="Miracle Educational Society"
                className="h-20 w-20 object-contain"
              />
              <div>
                <h1 className="text-2xl font-display font-bold">Miracle LMS</h1>
                <p className="text-white/80 text-sm">Educational Society</p>
              </div>
            </div>

            <h2 className="text-4xl font-display font-bold leading-tight mb-4">
              Secure & Verified
              <span className="block text-white/80">Learning Platform</span>
            </h2>

            <p className="text-white/70 text-lg max-w-md">
              Your one-stop destination for academic resources, timetables, attendance, and more.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Timetable</h3>
                <p className="text-white/70 text-sm">View your personalized class schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Course Materials</h3>
                <p className="text-white/70 text-sm">Access notes, syllabus, and previous papers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Verified Identity</h3>
                <p className="text-white/70 text-sm">Secure access to your academic data</p>
              </div>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-semibold">Latest Announcement</span>
            </div>
            <p className="text-sm text-white/80">
              Welcome to the new semester! Mid-term examinations will begin from March 15th.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* Logo without box on mobile too */}
              <img
                src="/logo.png"
                alt="Miracle Educational Society"
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Miracle LMS</h1>
            <p className="text-muted-foreground">Learning Management System</p>
          </div>

          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-display">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription>
                  {isSignUp
                    ? 'Sign up to access your learning dashboard'
                    : 'Enter your credentials to access your dashboard'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold"
                  style={{ backgroundColor: COLLEGE_NAVY }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isSignUp ? 'Creating Account...' : 'Signing in...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Help Text */}
          <div className="text-center space-y-2">
            {isSignUp ? (
              <p className="text-sm text-muted-foreground">
                After signing up, you'll need to verify your identity with your roll number.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  New student? Sign up above or contact the Admin Office.
                </p>
                <p className="text-sm text-muted-foreground">
                  Having trouble? Contact the <span className="text-primary font-medium">Admin Office</span>
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>© {new Date().getFullYear()} Miracle Educational Society. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
