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
      console.error('[Auth] fetchProfile error:', error.message, 'code:', error.code);
      return null;
    }
    console.log('[Auth] fetchProfile result:', data);
    return data ?? null;
  } catch (err) {
    console.error('[Auth] fetchProfile unexpected error:', err);
    return null;
  }
}

async function fetchOrCreateRestaurant(profileId: string): Promise<string | null> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchErr) console.error('[Auth] fetchRestaurant error:', fetchErr.message);

    if (existing?.id) {
      await supabase.from('profiles').update({ restaurant_id: existing.id }).eq('id', profileId);
      return existing.id;
    }

    const { data: created, error: createErr } = await supabase
      .from('restaurants')
      .insert({ name: 'My Restaurant', theme: 'modern', is_operational: true })
      .select('id')
      .single();

    if (createErr || !created) {
      console.error('[Auth] Failed to create restaurant:', createErr?.message);
      return null;
    }

    await supabase.from('profiles').update({ restaurant_id: created.id }).eq('id', profileId);
    return created.id;
  } catch (err) {
    console.error('[Auth] fetchOrCreateRestaurant error:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Track the userId we are currently loading so we never double-load the same user
  const loadingForUserId = useRef<string | null>(null);

  const loadAndSetProfile = async (userId: string, retryOnMiss = false) => {
    // If already loading for this exact user, skip
    if (loadingForUserId.current === userId) {
      console.log('[Auth] loadAndSetProfile: already loading for', userId, '— skipping');
      return;
    }

    loadingForUserId.current = userId;
    console.log('[Auth] loadAndSetProfile start for', userId);

    try {
      let p = await fetchProfile(userId);

      // New signup: DB trigger may not have created the profile row yet — retry once
      if (!p && retryOnMiss) {
        console.log('[Auth] Profile not found, retrying in 1.5s...');
        await new Promise((r) => setTimeout(r, 1500));
        p = await fetchProfile(userId);
      }

      if (!p) {
        console.error('[Auth] Profile still not found after retry');
        setAuthError('Profile not found. Please refresh or contact support.');
        setLoading(false);
        return;
      }

      // Owner without restaurant: create/link one
      if (p.role === 'owner' && !p.restaurant_id) {
        console.log('[Auth] Owner has no restaurant — creating one...');
        const rid = await fetchOrCreateRestaurant(p.id);
        if (rid) p = { ...p, restaurant_id: rid };
      }

      console.log('[Auth] Profile loaded successfully:', p.role, p.email);
      setProfile(p);
      setAuthError(null);
    } catch (err) {
      console.error('[Auth] loadAndSetProfile threw:', err);
      setAuthError('Failed to load profile. Please refresh.');
    } finally {
      loadingForUserId.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION almost immediately on mount.
    // We use that as our single source of truth — no separate getSession() call.
    // This avoids the race condition between getSession() and onAuthStateChange.

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] event:', event, '|', newSession?.user?.email ?? 'no user');

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthError(null);
          loadingForUserId.current = null;
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token silently refreshed — just update session, keep profile
          setSession(newSession);
          return;
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (!newSession?.user) {
            // No session (e.g. INITIAL_SESSION with no logged-in user)
            setLoading(false);
            return;
          }

          setSession(newSession);
          setUser(newSession.user);

          // If we already have a profile for this user, don't reload
          if (profile && profile.id === newSession.user.id) {
            console.log('[Auth] Profile already loaded for this user, skipping fetch');
            setLoading(false);
            return;
          }

          setLoading(true);
          await loadAndSetProfile(newSession.user.id, event === 'SIGNED_IN');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setAuthError(null);
    setLoading(true); // Show spinner immediately
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }
    // onAuthStateChange SIGNED_IN will call loadAndSetProfile → setLoading(false)
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
    setProfile(null);
    setUser(null);
    setSession(null);
    setAuthError(null);
    loadingForUserId.current = null;
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
