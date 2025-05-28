import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { TestLogin } from './components/auth/TestLogin';

// Import components
const LoginPage = React.lazy(() => import('./pages/login'));
const TestPage = React.lazy(() => import('./pages/TestPage'));
const WoundCareDashboard = React.lazy(() => import('./pages/dashboard/WoundCareDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/dashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/users'));
const SystemAnalytics = React.lazy(() => import('./pages/admin/analytics'));
const CompliancePage = React.lazy(() => import('./pages/admin/compliance'));
const SettingsPage = React.lazy(() => import('./pages/admin/settings'));
const MainLayout = React.lazy(() => import('./components/shared/layout/Layout'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));

const App = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-600">Loading...</div>
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/test-login" element={<TestLogin />} />
            
            {/* Admin Routes - Protected by AdminRoute */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<WoundCareDashboard />} />
              </Route>
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;