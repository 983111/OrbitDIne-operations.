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
import { Loader2 } from 'lucide-react';

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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

  if (loading) return <FullPageSpinner />;

  // Not logged in at all
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but profile not loaded yet (DB trigger delay)
  if (!profile) {
    if (authError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md px-6">
            <p className="text-slate-700 font-medium mb-4">{authError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return <FullPageSpinner />;
  }

  // Wrong role — redirect to correct portal
  if (profile.role !== allowedRole) {
    return <Navigate to={`/${profile.role}`} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullPageSpinner />;

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
