// ============================================
// AURA - Auth Context (Open Access / Guest User Mode)
// Provides seamless access without mandatory login
// ============================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

const GUEST_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'Guest User',
  app_metadata: {},
  user_metadata: { full_name: 'Guest User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(GUEST_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Race getSession against a 2-second timeout so the app
    // doesn't hang when Supabase is unreachable
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));

    Promise.race([sessionPromise, timeoutPromise]).then((result) => {
      if (result && 'data' in result) {
        setSession(result.data.session);
        setUser(result.data.session?.user ?? GUEST_USER);
      } else {
        // Timed out — use guest user
        setUser(GUEST_USER);
        setSession(null);
      }
      setLoading(false);
    });

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? GUEST_USER);
        setLoading(false);
      });
      subscription = data.subscription;
    } catch {}

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error: error?.message || null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(GUEST_USER);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
