import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Sparkles } from 'lucide-react';

interface WelcomeCardProps {
  userName: string;
  role: string;
  rollNumber?: string;
  department?: string;
  greeting?: string;
  avatarUrl?: string | null;
}

export default function WelcomeCard({ userName, role, rollNumber, department, greeting, avatarUrl }: WelcomeCardProps) {
  const getGreeting = () => {
    if (greeting) return greeting;
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleMessage = () => {
    switch (role) {
      case 'student':
        return "Ready to ace your B.Tech semester?";
      case 'teacher':
        return "Empower future engineers today!";
      case 'admin':
        return "Here's your college overview.";
      default:
        return "Welcome back!";
    }
  };

  // Format display name - show roll number with name or just name
  const displayName = rollNumber ? rollNumber : userName;
  const subtitle = rollNumber && userName ? userName : null;

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground animate-gradient shadow-2xl">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-fullblur-3xl -translate-y-32 translate-x-32 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-24 -translate-x-24 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-float" />

      <div className="relative p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-500"></div>
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-white/20 ring-4 ring-white/10 shadow-xl transition-transform duration-500 group-hover:scale-105 relative z-10">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
              <AvatarFallback className="bg-white/10 backdrop-blur-md text-primary-foreground text-3xl font-bold">
                {userName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div>
              <p className="text-primary-foreground/90 text-lg font-medium animate-fade-in flex items-center justify-center md:justify-start gap-2">
                {getGreeting()} <span className="text-2xl">👋</span>
              </p>
              <h1 className="text-2xl md:text-5xl font-display font-bold mt-1 animate-slide-up text-shadow-sm tracking-tight text-white break-words">
                {userName || 'Student'}
              </h1>
            </div>

            {rollNumber && (
              <p className="text-primary-foreground/80 text-xl font-light animate-fade-in" style={{ animationDelay: '0.1s' }}>{rollNumber}</p>
            )}

            <div className="max-w-xl p-4 mt-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-primary-foreground/90 italic font-medium">"{getRoleMessage()}"</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3 stagger-enter">
          {department && (
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium hover:bg-white/20 transition-colors cursor-default whitespace-nowrap">
              {department}
            </div>
          )}
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm hover:bg-white/20 transition-colors cursor-default flex items-center gap-2 whitespace-nowrap">
            <GraduationCap className="h-4 w-4" />
            <span className="capitalize">{role} Dashboard</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm hover:bg-white/20 transition-colors cursor-default whitespace-nowrap">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
    </Card>
  );
}
