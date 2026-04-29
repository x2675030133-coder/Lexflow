import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { translateAuthError } from '../utils/authErrors';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CONFIG_ERROR = 'Supabase 配置缺失。请在 .env 文件中提供 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    return { error: translateAuthError(error?.message ?? null) };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: CONFIG_ERROR };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: translateAuthError(error?.message ?? null) };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, isConfigured: isSupabaseConfigured }}
    >
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
