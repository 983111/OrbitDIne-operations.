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
      console.error('[Auth] fetchProfile error:', error.message);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.error('[Auth] fetchProfile unexpected error:', err);
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

/**
 * Loads (and optionally retries) a profile, then resolves restaurant for owners.
 * Returns the fully-resolved profile or null.
 */
async function resolveProfile(userId: string, retryOnMiss: boolean): Promise<Profile | null> {
  let p = await fetchProfile(userId);

  if (!p && retryOnMiss) {
    console.log('[Auth] Profile not found, retrying in 1.5s...');
    await new Promise((r) => setTimeout(r, 1500));
    p = await fetchProfile(userId);
  }

  if (!p) return null;

  if (p.role === 'owner' && !p.restaurant_id) {
    const rid = await fetchOrCreateRestaurant(p.id);
    if (rid) p = { ...p, restaurant_id: rid };
  }

  return p;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tracks which userId we are currently fetching a profile for,
  // so we never fire two simultaneous fetches for the same user.
  const fetchingFor = useRef<string | null>(null);

  useEffect(() => {
    // `mounted` prevents state updates after the component unmounts
    // (important for React 18 Strict Mode double-invoke).
    let mounted = true;

    /**
     * Central routine: given a user object, load their profile and update state.
     * `retryOnMiss` is true right after a fresh sign-up (trigger may lag).
     */
    const handleUser = async (incomingUser: User | null, retryOnMiss = false) => {
      if (!mounted) return;

      if (!incomingUser) {
        // No session — clear everything and stop loading.
        setUser(null);
        setSession(null);
        setProfile(null);
        setAuthError(null);
        setLoading(false);
        fetchingFor.current = null;
        return;
      }

      // Avoid duplicate fetches for the same user.
      if (fetchingFor.current === incomingUser.id) {
        console.log('[Auth] Already fetching profile for', incomingUser.id, '— skipping');
        return;
      }

      fetchingFor.current = incomingUser.id;
      setLoading(true);

      try {
        const p = await resolveProfile(incomingUser.id, retryOnMiss);

        if (!mounted) return; // Unmounted while fetching — discard result.

        if (!p) {
          setAuthError('Profile not found. Please refresh or contact support.');
        } else {
          setUser(incomingUser);
          setProfile(p);
          setAuthError(null);
        }
      } catch (err) {
        console.error('[Auth] handleUser error:', err);
        if (mounted) setAuthError('Failed to load profile. Please refresh.');
      } finally {
        if (mounted) {
          fetchingFor.current = null;
          setLoading(false);
        }
      }
    };

    // ── 1. Load the initial session synchronously from storage ──────────
    // Using getSession() instead of relying solely on onAuthStateChange
    // prevents the "stuck loading" race when INITIAL_SESSION + SIGNED_IN
    // both fire on page reload.
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;

      if (existingSession?.user) {
        setSession(existingSession);
        handleUser(existingSession.user, false);
      } else {
        // No stored session → done loading immediately.
        setLoading(false);
      }
    });

    // ── 2. Listen for subsequent auth changes (sign-in, sign-out, refresh) ─
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        console.log('[Auth] event:', event, '|', newSession?.user?.email ?? 'no user');

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthError(null);
          fetchingFor.current = null;
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED' && newSession) {
          // Silently keep the session up to date — no profile reload needed.
          setSession(newSession);
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);

          // If we already finished loading this exact user (e.g. getSession() handled
          // it first), there's nothing more to do.
          if (fetchingFor.current === null) {
            // Check current profile via functional update to avoid stale closure.
            setProfile((currentProfile) => {
              if (currentProfile && currentProfile.id === newSession.user.id) {
                // Profile already loaded — nothing to do.
                return currentProfile;
              }
              // Profile not yet loaded — kick off fetch asynchronously.
              handleUser(newSession.user, true);
              return currentProfile; // keep current value for now
            });
          }
        }

        // INITIAL_SESSION is handled by getSession() above — ignore here
        // to avoid the double-fetch race condition.
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty deps — runs exactly once per mount.

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // onAuthStateChange SIGNED_IN → handleUser → setLoading(false)
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
    fetchingFor.current = null;
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
