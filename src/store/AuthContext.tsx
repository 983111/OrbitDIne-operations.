import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'owner' | 'manager'
  ) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // On mount: restore session from storage and fetch profile
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        const p = await fetchProfile(existingSession.user.id);
        if (mounted) {
          setProfile(p);
          if (!p) {
            setAuthError(
              'Profile not found. Your account may still be setting up — try refreshing in a moment.'
            );
          }
        }
      }

      if (mounted) setLoading(false);
    };

    init();

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAuthError(null);

      if (newSession?.user) {
        // Small delay to let the DB trigger create the profile on first signup
        if (event === 'SIGNED_IN') {
          await new Promise((r) => setTimeout(r, 800));
        }
        const p = await fetchProfile(newSession.user.id);
        if (mounted) {
          setProfile(p);
          if (!p) {
            setAuthError(
              'Profile not found. Your account may still be setting up — try refreshing in a moment.'
            );
          }
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // Profile is loaded via onAuthStateChange
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'owner' | 'manager'
  ) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        // No emailRedirectTo - we handle routing ourselves
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, session, loading, authError, login, logout, signUp }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
