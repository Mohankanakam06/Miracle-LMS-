import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Role-Based Access',
      description: 'Separate dashboards for students, teachers, and administrators with tailored features.',
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Course Management',
      description: 'Upload syllabi, notes, and reference materials. Share YouTube videos and resources.',
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Timetable & Scheduling',
      description: 'View class schedules, manage assignments deadlines, and track important dates.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Grades & Analytics',
      description: 'Track academic performance, view grades, and monitor progress over time.',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Attendance Tracking',
      description: 'Easy attendance marking for teachers and real-time tracking for students.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based permissions and data protection.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute top-0 -left-1/4 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rotate-12 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-accent/10 via-transparent to-transparent -rotate-12 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10 py-12 md:py-20">
          <nav className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-50">
            <div className="flex items-center gap-3 glass px-4 py-2 rounded-full">
              <img src="/logo.png" alt="Miracle" className="h-10 w-10 rounded-full" />
              <div>
                <h1 className="font-display font-bold text-lg tracking-tight">Miracle LMS</h1>
              </div>
            </div>
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:flex hover:bg-white/10" asChild>
                <span>Login</span>
              </Button>
              <Button variant="default" className="rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>

          <div className="grid lg:grid-cols-2 gap-16 items-center mt-16 md:mt-0">
            <div className="space-y-8 animate-fade-in relative z-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm animate-slide-up">
                <Sparkles className="h-4 w-4 text-accent fill-accent" />
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Reimagining Education</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
                Master Your
                <span className="block text-gradient">Academic Journey</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                Experience a seamless blend of learning and management.
                Designed for the modern educational ecosystem.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/auth">
                  <Button size="xl" className="rounded-full px-8 text-lg h-14 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
                    Student Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="xl" variant="outline" className="rounded-full px-8 text-lg h-14 bg-white/50 backdrop-blur border-white/60 hover:bg-white/80">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-8 border-t border-border/50">
                <div>
                  <p className="text-3xl font-display font-bold text-foreground">2.5k+</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div className="w-px h-10 bg-border/50" />
                <div>
                  <p className="text-3xl font-display font-bold text-foreground">98%</p>
                  <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block perspective-1000">
              <div className="relative z-10 animate-float">
                <div className="glass-heavy rounded-3xl p-2 shadow-2xl shadow-indigo-500/10 border border-white/40 ring-1 ring-white/50 rotate-y-12 rotate-x-6 transform-gpu transition-transform hover:rotate-0 duration-700">
                  <div className="bg-background rounded-2xl overflow-hidden border border-border/50">
                    <div className="bg-muted/50 p-4 flex items-center gap-3 border-b border-border/50">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                      </div>
                      <div className="h-6 w-40 bg-muted rounded-md animate-pulse ml-4" />
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="flex gap-6">
                        <div className="flex-1 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                          <p className="font-bold text-2xl">92%</p>
                          <p className="text-sm text-muted-foreground">Attendance</p>
                        </div>
                        <div className="flex-1 p-5 rounded-2xl bg-accent/5 border border-accent/10">
                          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 text-accent">
                            <BarChart3 className="h-6 w-6" />
                          </div>
                          <p className="font-bold text-2xl">4.0</p>
                          <p className="text-sm text-muted-foreground">GPA Score</p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                        <p className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Upcoming Classes</p>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">Data Structures</p>
                            <p className="text-xs text-muted-foreground">10:00 AM • Room 301</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border/50 shadow-sm opacity-60">
                          <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">Web Development</p>
                            <p className="text-xs text-muted-foreground">02:00 PM • Lab 4</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative background blobs */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
              <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30 relative">
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in">
            <h2 className="text-xl font-medium text-primary mb-3">Why Choose Miracle?</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              Everything You Need to <span className="text-gradient">Excel</span>
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We've crafted a comprehensive ecosystem that empowers students, supports teachers, and simplifies administration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-fade-in">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:scale-[1.02] transition-all duration-300 border-border/50 bg-background/50 hover:bg-background hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover-lift"
              >
                <CardContent className="p-8">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:text-white flex items-center justify-center mb-6 transition-all duration-300 transform group-hover:rotate-6">
                    {feature.icon}
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container relative z-10">
          <div className="glass-heavy rounded-[2.5rem] p-12 md:p-24 text-center border-white/20 shadow-2xl shadow-primary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />

            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-8 relative z-10">
              Ready to Transform Your <span className="text-gradient">Learning Experience?</span>
            </h2>
            <p className="text-muted-foreground text-xl mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
              Join thousands of students and teachers already using Miracle LMS to achieve academic excellence.
            </p>
            <div className="relative z-10">
              <Link to="/auth">
                <Button size="xl" className="rounded-full px-10 h-16 text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Miracle LMS</h3>
                <p className="text-xs text-muted-foreground font-medium">Educational Society Group</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Miracle Educational Society. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
