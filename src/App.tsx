import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ToastProvider } from './components/Toast';
import { Login } from './pages/Login';
import { ManagerLayout } from './layouts/ManagerLayout';
import { OwnerLayout } from './layouts/OwnerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { Analytics } from './pages/owner/Analytics';
import { MenuManagement } from './pages/owner/MenuManagement';
import { TableConfig } from './pages/owner/TableConfig';
import { ManagerPermissions } from './pages/owner/ManagerPermissions';
import { Settings } from './pages/owner/Settings';
import { Feedback } from './pages/owner/Feedback';
import { Loader2, ChefHat } from 'lucide-react';

function FullPageSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07070F] gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-orange-400" />
        </div>
        <span className="text-xl font-bold text-[#F0F0FF]" style={{ fontFamily: 'Syne, sans-serif' }}>OrbitDine</span>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      <p className="text-[#7070A8] text-sm">{message}</p>
    </div>
  );
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'manager' | 'owner' }) {
  const { user, profile, loading, authError } = useAuth();

  if (loading) return <FullPageSpinner message="Setting up your account…" />;
  if (!user) return <Navigate to="/login" replace />;

  if (!profile) {
    if (authError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#07070F]">
          <div className="text-center max-w-sm px-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-[#F0F0FF]">Almost there…</h2>
            <p className="text-[#7070A8] text-sm">{authError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return <FullPageSpinner message="Loading your profile…" />;
  }

  if (profile.role !== allowedRole) return <Navigate to={`/${profile.role}`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageSpinner message="Authenticating…" />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user && profile ? <Navigate to={`/${profile.role}`} replace /> : <Login />}
      />

      <Route path="/manager" element={<ProtectedRoute allowedRole="manager"><ManagerLayout /></ProtectedRoute>}>
        <Route index element={<ManagerDashboard />} />
      </Route>

      <Route path="/owner" element={<ProtectedRoute allowedRole="owner"><OwnerLayout /></ProtectedRoute>}>
        <Route index element={<OwnerDashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="tables" element={<TableConfig />} />
        <Route path="managers" element={<ManagerPermissions />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
