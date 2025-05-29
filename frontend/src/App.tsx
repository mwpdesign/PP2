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
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const PatientIntakePage = React.lazy(() => import('./pages/patients/intake'));
const PatientSelectionPage = React.lazy(() => import('./pages/patients/select'));
const PatientDetailPage = React.lazy(() => import('./pages/patients/[id]'));
const IVRManagementPage = React.lazy(() => import('./pages/ivr'));
const IVRSubmissionPage = React.lazy(() => import('./pages/ivr/submit/[patientId]'));
const TestIVRPage = React.lazy(() => import('./pages/ivr/submit/TestIVRPage'));
const OrderManagementPage = React.lazy(() => import('./pages/orders'));
const ShippingPage = React.lazy(() => import('./pages/shipping'));
const AnalyticsPage = React.lazy(() => import('./pages/analytics'));
const SettingsPage = React.lazy(() => import('./pages/settings'));
const MainLayout = React.lazy(() => import('./components/shared/layout/Layout'));
const AdminLayout = React.lazy(() => import('./components/admin/layout/AdminLayout'));

const App = () => {
  console.log('App component rendering');

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
            
            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              {/* Main Layout with Dashboard */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<WoundCareDashboard />} />
                
                {/* Patient Routes */}
                <Route path="patients">
                  <Route index element={<Navigate to="/patients/select" replace />} />
                  <Route path="select" element={<PatientSelectionPage />} />
                  <Route path="intake" element={<PatientIntakePage />} />
                  <Route path=":id" element={<PatientDetailPage />} />
                </Route>
                
                {/* IVR Routes */}
                <Route path="ivr">
                  <Route index element={<IVRManagementPage />} />
                  <Route path="submit">
                    <Route index element={<Navigate to="/patients/select" replace />} />
                    <Route path="test/:patientId" element={<TestIVRPage />} />
                    <Route path=":patientId" element={<IVRSubmissionPage />} />
                  </Route>
                </Route>
                
                {/* Other Routes */}
                <Route path="orders" element={<OrderManagementPage />} />
                <Route path="shipping" element={<ShippingPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
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