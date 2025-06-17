
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/spinner';

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
    console.log('AuthProvider: Initializing');
    
    // Получаем текущую сессию
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
        }
        
        if (session?.user) {
          console.log('Found existing session:', session.user.id);
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          console.log('No existing session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile loading error:', error);
        // Создаем профиль по умолчанию при ошибке
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
        console.log('Profile loaded successfully:', data);
        setProfile(data as Profile);
      } else {
        console.log('No profile found, creating default');
        // Профиль не найден, создаем дефолтный
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
      console.error('Unexpected error loading profile:', error);
      // Устанавливаем дефолтный профиль при любой ошибке
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
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('Sign in result:', { error });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Signing up user:', email);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      console.log('Sign up result:', { error });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <LoadingSpinner message="Загрузка приложения..." />
      </div>
    );
  }

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
