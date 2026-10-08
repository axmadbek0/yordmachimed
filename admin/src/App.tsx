/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

// Super-Admin imports
import { AdminLoginPage } from './features/admin/AdminLoginPage';
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AdminSchools } from './features/admin/AdminSchools';
import { AdminSchoolProfile } from './features/admin/AdminSchoolProfile';
import { AdminUsers } from './features/admin/AdminUsers';
import { AdminAnalytics } from './features/admin/AdminAnalytics';
import { AdminInquiries } from './features/admin/AdminInquiries';
import { AdminBilling } from './features/admin/AdminBilling';
import { AdminSettings } from './features/admin/AdminSettings';

/**
 * Super-Admin route guard — role === 'super_admin' only
 */
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-deep font-bold">
        <div className="w-12 h-12 rounded-full border-4 border-deep/20 border-t-deep animate-spin mb-4" />
        Yuklanmoqda...
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Super-Admin Login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Super-Admin Protected Area */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="schools" element={<AdminSchools />} />
            <Route path="schools/:id" element={<AdminSchoolProfile />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Root Redirects */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
