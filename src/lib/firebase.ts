const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCMBMte9ic1EoXXUyk1bvmWh2ip_Ruv4Ek',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'orbitdine-operations.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'orbitdine-operations',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'orbitdine-operations.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '293702605865',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:293702605865:web:6c6ee01a03d3e439cf1038',
};

const AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export interface FirebaseAuthSession {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
}

export interface FirebaseProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  restaurant_id: string | null;
  role: 'owner' | 'manager';
  status: string;
  created_at: string;
  updated_at: string;
}

const parseFirebaseError = async (response: Response) => {
  const payload = await response.json().catch(() => null);
  const message = payload?.error?.message as string | undefined;
  if (!message) return 'Authentication request failed.';

  const map: Record<string, string> = {
    EMAIL_NOT_FOUND: 'No account exists for this email.',
    INVALID_PASSWORD: 'Incorrect email or password.',
    USER_DISABLED: 'This account has been disabled.',
    EMAIL_EXISTS: 'An account with this email already exists.',
    WEAK_PASSWORD: 'Password is too weak.',
  };

  return map[message] ?? message;
};

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseAuthSession> => {
  const response = await fetch(`${AUTH_BASE_URL}/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    throw new Error(await parseFirebaseError(response));
  }

  const data = await response.json();
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    localId: data.localId,
    email: data.email,
  };
};

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseAuthSession> => {
  const response = await fetch(`${AUTH_BASE_URL}/accounts:signUp?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    throw new Error(await parseFirebaseError(response));
  }

  const data = await response.json();
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    localId: data.localId,
    email: data.email,
  };
};

export const getUserByToken = async (idToken: string) => {
  const response = await fetch(`${AUTH_BASE_URL}/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error(await parseFirebaseError(response));
  }

  const data = await response.json();
  const user = data.users?.[0];
  if (!user) {
    throw new Error('Unable to load account details.');
  }

  return {
    uid: user.localId as string,
    email: (user.email as string | undefined) ?? '',
  };
};

const parseProfileDoc = (uid: string, doc: any): FirebaseProfile => ({
  id: uid,
  email: doc.fields?.email?.stringValue ?? null,
  full_name: doc.fields?.full_name?.stringValue ?? null,
  restaurant_id: doc.fields?.restaurant_id?.stringValue ?? null,
  role: (doc.fields?.role?.stringValue ?? 'manager') as 'owner' | 'manager',
  status: doc.fields?.status?.stringValue ?? 'active',
  created_at: doc.fields?.created_at?.stringValue ?? new Date().toISOString(),
  updated_at: doc.fields?.updated_at?.stringValue ?? new Date().toISOString(),
});

export const getProfile = async (uid: string, idToken: string): Promise<FirebaseProfile | null> => {
  const response = await fetch(`${FIRESTORE_BASE_URL}/profiles/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error('Failed to load user profile.');
  }

  const doc = await response.json();
  return parseProfileDoc(uid, doc);
};

export const createProfile = async (
  uid: string,
  idToken: string,
  payload: { email: string; fullName: string; role: 'owner' | 'manager' },
): Promise<FirebaseProfile> => {
  const now = new Date().toISOString();
  const body = {
    fields: {
      email: { stringValue: payload.email },
      full_name: { stringValue: payload.fullName },
      role: { stringValue: payload.role },
      status: { stringValue: 'active' },
      restaurant_id: { stringValue: '' },
      created_at: { stringValue: now },
      updated_at: { stringValue: now },
    },
  };

  const response = await fetch(`${FIRESTORE_BASE_URL}/profiles/${uid}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Account created, but profile initialization failed.');
  }

  const doc = await response.json();
  return parseProfileDoc(uid, doc);
};
