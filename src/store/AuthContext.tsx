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
 * and assign it to their profile.
 */
async function ensureRestaurant(profile: Profile): Promise<Profile> {
  if (profile.restaurant_id) return profile;

  try {
    // Try to find an existing restaurant
    const { data: existing, error: fetchError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .maybeSingle();

    let restaurantId: string | null = null;

    if (!fetchError && existing?.id) {
      restaurantId = existing.id;
    } else {
      // Create a default restaurant
      const { data: created, error: createError } = await supabase
        .from('restaurants')
        .insert({ name: 'My Restaurant', theme: 'modern', is_operational: true })
        .select('id')
        .single();

      if (createError || !created) {
        console.error('Failed to create restaurant:', createError?.message);
        // Return profile as-is; the UI will still load, just without restaurant data
        return profile;
      }
      restaurantId = created.id;
    }

    if (!restaurantId) return profile;

    // Assign to profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ restaurant_id: restaurantId })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to assign restaurant to profile:', updateError.message);
      return profile;
    }

    return { ...profile, restaurant_id: restaurantId };
  } catch (err) {
    console.error('ensureRestaurant unexpected error:', err);
    return profile;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfile = async (userId: string, isNewSignIn = false) => {
    // Small delay on new sign-in to allow DB trigger to fire
    if (isNewSignIn) {
      await new Promise((r) => setTimeout(r, 1200));
    }

    let p = await fetchProfile(userId);

    if (!p) {
      // Retry once after another delay
      await new Promise((r) => setTimeout(r, 1500));
      p = await fetchProfile(userId);
    }

    if (!p) {
      setAuthError('Profile not found. Please try refreshing the page.');
      return null;
    }

    // For owners: ensure they have a restaurant assigned
    // Wrap in try/catch so a RLS error doesn't block the whole auth flow
    if (p.role === 'owner') {
      try {
        p = await ensureRestaurant(p);
      } catch (err) {
        console.error('ensureRestaurant failed, continuing without restaurant:', err);
      }
    }

    return p;
  };

  // On mount: restore session from storage and fetch profile
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
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
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
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
        // Don't block loading state here — set loading false after profile loads
        const p = await loadProfile(newSession.user.id, event === 'SIGNED_IN');
        if (mounted) {
          setProfile(p);
          setLoading(false);
        }
      } else {
        setProfile(null);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true); // Show spinner during login
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }
    // loading will be set to false inside onAuthStateChange handler
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
    setLoading(false);
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
