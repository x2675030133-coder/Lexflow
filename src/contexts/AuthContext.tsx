import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hydrateAccountProgress, scheduleAccountUpload } from '../utils/accountProgressSync';
import { DEFAULT_SCOPE, setActiveScope } from '../utils/scopedStorage';
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
    let cancelled = false;
    let runId = 0;

    async function applySession(nextSession: Session | null) {
      const currentRun = ++runId;
      const nextUser = nextSession?.user ?? null;

      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser?.email) {
        setActiveScope(DEFAULT_SCOPE);
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setActiveScope(nextUser.email);

      try {
        await hydrateAccountProgress(nextUser.email);
      } catch {
        // Keep the session usable even if sync fails.
      } finally {
        if (!cancelled && currentRun === runId) {
          setLoading(false);
        }
      }
    }

    if (!isSupabaseConfigured) {
      setActiveScope(DEFAULT_SCOPE);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        void applySession(session);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
        setActiveScope(DEFAULT_SCOPE);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const email = user?.email;

    if (!isSupabaseConfigured || !email) {
      return undefined;
    }

    const handleProgressChange = () => {
      scheduleAccountUpload(email);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void hydrateAccountProgress(email);
      }
    };

    window.addEventListener('el-progress-changed', handleProgressChange as EventListener);
    window.addEventListener('storage', handleProgressChange as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('el-progress-changed', handleProgressChange as EventListener);
      window.removeEventListener('storage', handleProgressChange as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.email]);

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
    setActiveScope(DEFAULT_SCOPE);
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
