import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'teacher' | 'student' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Admin-only: Create user account (for faculty invite)
  createUserAccount: (email: string, password: string, role: 'teacher' | 'admin', fullName: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string, currentSession: Session | null, fallbackRole?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', JSON.stringify(error, null, 2));
        if (fallbackRole) {
          console.log('Using fallback role from metadata:', fallbackRole);
          setUserRole(fallbackRole as UserRole);
        }
        return;
      }

      if (data) {
        setUserRole(data.role as UserRole);
      } else {
        // Profile verification/creation (Self-healing)
        console.log('Profile missing, attempting to create default profile...');

        const userEmail = currentSession?.user?.email;
        const userMeta = currentSession?.user?.user_metadata;

        // @ts-ignore - new fields not in generated types yet
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            role: fallbackRole || 'student',
            full_name: userMeta?.full_name || userEmail?.split('@')[0],
            onboarding_complete: fallbackRole !== 'student', // Non-students skip onboarding
            verification_status: fallbackRole !== 'student' ? 'verified' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Failed to auto-create profile:', JSON.stringify(insertError, null, 2));
          setUserRole((fallbackRole as UserRole) || 'student');
        } else {
          console.log('Profile auto-created successfully');
          setUserRole((fallbackRole as UserRole) || 'student');
        }
      }
    } catch (error) {
      console.error('Exception fetching user role:', error);
      setUserRole((fallbackRole as UserRole) || 'student');
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth state change:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => {
            const roleFromMeta = currentSession.user.user_metadata?.role;
            fetchUserRole(currentSession.user.id, currentSession, roleFromMeta);
          }, 0);
        } else {
          setUserRole(null);
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const roleFromMeta = currentSession.user.user_metadata?.role;
          fetchUserRole(currentSession.user.id, currentSession, roleFromMeta);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        await supabase.auth.signOut();
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
    }
  };

  // Admin-only function to create faculty/admin accounts
  const createUserAccount = async (email: string, password: string, role: 'teacher' | 'admin', fullName: string) => {
    // This should only be callable by admins through the admin interface
    // For now, we use the standard signup but this should ideally use admin API
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          full_name: fullName,
        }
      }
    });

    if (!error && data.user) {
      // Create profile directly for non-students (they skip onboarding)
      // @ts-ignore - new fields not in generated types yet
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        role: role,
        full_name: fullName,
        onboarding_complete: true,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signOut, createUserAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

