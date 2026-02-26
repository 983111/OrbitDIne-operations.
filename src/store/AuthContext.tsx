import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createProfile,
  getProfile,
  getUserByToken,
  signInWithEmail,
  signUpWithEmail,
  type FirebaseAuthSession,
  type FirebaseProfile,
} from '../lib/firebase';

interface AuthUser {
  uid: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: FirebaseProfile | null;
  session: FirebaseAuthSession | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'owner' | 'manager') => Promise<{ error: string | null }>;
}

const SESSION_STORAGE_KEY = 'orbitdine.firebase.session';
const AuthContext = createContext<AuthState | undefined>(undefined);

const persistSession = (session: FirebaseAuthSession | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const readSession = (): FirebaseAuthSession | null => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FirebaseAuthSession;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<FirebaseProfile | null>(null);
  const [session, setSession] = useState<FirebaseAuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const resetAuth = () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    setAuthError(null);
    persistSession(null);
  };

  const hydrateProfile = async (activeSession: FirebaseAuthSession) => {
    const account = await getUserByToken(activeSession.idToken);
    setUser(account);

    const userProfile = await getProfile(account.uid, activeSession.idToken);
    if (!userProfile) {
      setProfile(null);
      setAuthError('Your account is pending setup. Please ask an owner to complete onboarding.');
      return;
    }

    setProfile(userProfile);
    setAuthError(null);
  };

  useEffect(() => {
    const hydrate = async () => {
      const savedSession = readSession();
      if (!savedSession) {
        setLoading(false);
        return;
      }

      try {
        setSession(savedSession);
        await hydrateProfile(savedSession);
      } catch {
        resetAuth();
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const nextSession = await signInWithEmail(email, password);
      setSession(nextSession);
      persistSession(nextSession);
      await hydrateProfile(nextSession);
      return { error: null };
    } catch (err) {
      resetAuth();
      return { error: err instanceof Error ? err.message : 'Login failed.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'owner' | 'manager') => {
    try {
      const nextSession = await signUpWithEmail(email, password);
      await createProfile(nextSession.localId, nextSession.idToken, { email, fullName, role });
      await logout();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Account creation failed.' };
    }
  };

  const logout = async () => {
    resetAuth();
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
