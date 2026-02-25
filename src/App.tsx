/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'manager' | 'owner' }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      
      {/* Manager Routes */}
      <Route path="/manager" element={<ProtectedRoute allowedRole="manager"><ManagerLayout /></ProtectedRoute>}>
        <Route index element={<ManagerDashboard />} />
      </Route>

      {/* Owner Routes */}
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
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

