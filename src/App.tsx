import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
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
import { Loader2, UtensilsCrossed } from 'lucide-react';

function FullPageSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="flex items-center gap-3 mb-2">
        <UtensilsCrossed className="w-8 h-8 text-indigo-600" />
        <span className="text-2xl font-bold text-slate-800">OrbitDine</span>
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole: 'manager' | 'owner';
}) {
  const { user, profile, loading, authError } = useAuth();

  if (loading) return <FullPageSpinner message="Setting up your account..." />;

  if (!user) return <Navigate to="/login" replace />;

  if (!profile) {
    if (authError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md px-6 space-y-4">
            <UtensilsCrossed className="w-12 h-12 text-indigo-400 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Almost ready...</h2>
            <p className="text-slate-600 text-sm">{authError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return <FullPageSpinner message="Loading your profile..." />;
  }

  if (profile.role !== allowedRole) {
    return <Navigate to={`/${profile.role}`} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullPageSpinner message="Authenticating..." />;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user && profile ? (
            <Navigate to={`/${profile.role}`} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRole="manager">
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
      </Route>

      {/* Owner Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRole="owner">
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
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
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
