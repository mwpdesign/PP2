import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

// Doctor Dashboard Components - Using Advanced Versions
const PatientsPage = React.lazy(() => import('./pages/patients/PatientsPage'));
const NewPatientPage = React.lazy(() => import('./pages/patients/new'));
const WoundAssessmentPage = React.lazy(() => import('./pages/patients/assessment'));
const IVRSubmissionPage = React.lazy(() => import('./pages/ivr/submit'));
const IVRDashboardPage = React.lazy(() => import('./pages/ivr/dashboard'));
const OrderManagementPage = React.lazy(() => import('./pages/orders/OrderManagementPage'));
const ShippingPage = React.lazy(() => import('./pages/shipping'));

const App = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#2E86AB',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
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
                
                {/* Doctor Dashboard Routes - Using Advanced Components */}
                <Route path="patients" element={<PatientsPage />} />
                <Route path="patients/new" element={<NewPatientPage />} />
                <Route path="patients/assessment" element={<WoundAssessmentPage />} />
                <Route path="ivr-submissions" element={<IVRSubmissionPage />} />
                <Route path="ivr-management" element={<IVRDashboardPage />} />
                <Route path="order-management" element={<OrderManagementPage />} />
                <Route path="shipping" element={<ShippingPage />} />
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