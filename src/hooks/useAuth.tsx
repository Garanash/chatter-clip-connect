
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session', { session, error });
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed', { event, session });
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('AuthProvider: Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthProvider: Error loading profile:', error);
        // Create default profile if not found
        const defaultProfile: Profile = {
          id: userId,
          email: user?.email || null,
          first_name: 'Пользователь',
          last_name: '',
          avatar_url: 'https://via.placeholder.com/150/667eea/ffffff?text=П',
          role: 'user'
        };
        setProfile(defaultProfile);
      } else if (data) {
        console.log('AuthProvider: Profile loaded:', data);
        setProfile(data);
      } else {
        console.log('AuthProvider: No profile found, creating default');
        // No profile found, create default
        const defaultProfile: Profile = {
          id: userId,
          email: user?.email || null,
          first_name: 'Пользователь',
          last_name: '',
          avatar_url: 'https://via.placeholder.com/150/667eea/ffffff?text=П',
          role: 'user'
        };
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('AuthProvider: Unexpected error loading profile:', error);
      // Set default profile on error
      setProfile({
        id: userId,
        email: user?.email || null,
        first_name: 'Пользователь',
        last_name: '',
        avatar_url: 'https://via.placeholder.com/150/667eea/ffffff?text=П',
        role: 'user'
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing in user:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('AuthProvider: Sign in result:', { error });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing up user:', email);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      console.log('AuthProvider: Sign up result:', { error });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error signing up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('AuthProvider: Error signing out:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
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
