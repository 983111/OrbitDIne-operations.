import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('fetchProfile error:', error.message, error.code);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.error('fetchProfile unexpected error:', err);
    return null;
  }
}

async function fetchOrCreateRestaurant(profileId: string): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('profiles').update({ restaurant_id: existing.id }).eq('id', profileId);
      return existing.id;
    }

    const { data: created, error } = await supabase
      .from('restaurants')
      .insert({ name: 'My Restaurant', theme: 'modern', is_operational: true })
      .select('id')
      .single();

    if (error || !created) {
      console.error('Failed to create restaurant:', error?.message);
      return null;
    }

    await supabase.from('profiles').update({ restaurant_id: created.id }).eq('id', profileId);
    return created.id;
  } catch (err) {
    console.error('fetchOrCreateRestaurant error:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Prevent duplicate profile loads
  const profileLoadInProgress = useRef(false);
  const initDone = useRef(false);

  const loadAndSetProfile = async (userId: string, retryOnMiss = false) => {
    if (profileLoadInProgress.current) return;
    profileLoadInProgress.current = true;

    try {
      let p = await fetchProfile(userId);

      // New signup: profile row may not exist yet — retry once after delay
      if (!p && retryOnMiss) {
        await new Promise((r) => setTimeout(r, 1500));
        p = await fetchProfile(userId);
      }

      if (!p) {
        setAuthError('Profile not found. Please refresh the page or contact support.');
        setLoading(false);
        return;
      }

      // Owner: ensure restaurant exists and is linked
      if (p.role === 'owner' && !p.restaurant_id) {
        const rid = await fetchOrCreateRestaurant(p.id);
        if (rid) p = { ...p, restaurant_id: rid };
      }

      setProfile(p);
      setAuthError(null);
    } catch (err) {
      console.error('loadAndSetProfile error:', err);
      setAuthError('Failed to load profile. Please refresh.');
    } finally {
      profileLoadInProgress.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    // Step 1: Check for existing session on mount
    supabase.auth.getSession()
      .then(({ data: { session: existingSession } }) => {
        initDone.current = true;
        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          // loadAndSetProfile will call setLoading(false)
          loadAndSetProfile(existingSession.user.id, false);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('getSession error:', err);
        initDone.current = true;
        setLoading(false);
      });

    // Step 2: Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth]', event, newSession?.user?.email ?? 'no user');

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthError(null);
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          // Just update session, keep existing profile
          setSession(newSession);
          return;
        }

        if (event === 'INITIAL_SESSION') {
          // getSession() above already handles this — skip to avoid double load
          return;
        }

        // SIGNED_IN (and any other events with a user)
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(true);
          await loadAndSetProfile(newSession.user.id, true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // onAuthStateChange SIGNED_IN will handle loading the profile
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'owner' | 'manager'
  ): Promise<{ error: string | null }> => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    // Clear state immediately for instant UI response
    setProfile(null);
    setUser(null);
    setSession(null);
    setAuthError(null);
    setLoading(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, authError, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
