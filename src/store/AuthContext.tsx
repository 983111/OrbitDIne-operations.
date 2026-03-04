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

/**
 * If the user has no restaurant_id, find or create a default restaurant
 * and assign it to their profile. This handles cases where the DB trigger
 * didn't fire or wasn't set up.
 */
async function ensureRestaurant(profile: Profile): Promise<Profile> {
  if (profile.restaurant_id) return profile;

  // Try to find an existing restaurant
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1)
    .single();

  let restaurantId: string;

  if (existing?.id) {
    restaurantId = existing.id;
  } else {
    // Create a default restaurant
    const { data: created, error: createError } = await supabase
      .from('restaurants')
      .insert({ name: 'My Restaurant', theme: 'modern', is_operational: true })
      .select('id')
      .single();

    if (createError || !created) {
      console.error('Failed to create restaurant:', createError);
      return profile;
    }
    restaurantId = created.id;
  }

  // Assign to profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ restaurant_id: restaurantId })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Failed to assign restaurant to profile:', updateError);
    return profile;
  }

  return { ...profile, restaurant_id: restaurantId };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfile = async (userId: string, isNewSignIn = false) => {
    // Small delay on new sign-in for DB trigger to fire
    if (isNewSignIn) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    let p = await fetchProfile(userId);

    if (!p) {
      // Profile doesn't exist yet — retry once more after another second
      await new Promise((r) => setTimeout(r, 1500));
      p = await fetchProfile(userId);
    }

    if (!p) {
      setAuthError(
        'Profile not found. Please try refreshing the page.'
      );
      return null;
    }

    // Ensure restaurant is assigned (fixes missing DB trigger)
    if (p.role === 'owner') {
      p = await ensureRestaurant(p);
    }

    return p;
  };

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
        const p = await loadProfile(existingSession.user.id);
        if (mounted) setProfile(p);
      }

      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAuthError(null);

      if (newSession?.user) {
        const p = await loadProfile(newSession.user.id, event === 'SIGNED_IN');
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }

      if (mounted && event !== 'SIGNED_IN') setLoading(false);
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
