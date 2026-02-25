import React from 'react';

export type Role = 'manager' | 'owner' | null;

interface AuthState {
  user: { id: string; name: string; role: Role; restaurantId?: string } | null;
  login: (role: Role) => void;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthState['user']>(null);

  const login = (role: Role) => {
    setUser({ id: '1', name: role === 'owner' ? 'Alice Owner' : 'Bob Manager', role, restaurantId: 'rest-1' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
