import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { DashboardRouter } from './components/auth/DashboardRouter';
import { TestLogin } from './components/auth/TestLogin';
import { ConfigProvider } from './contexts/ConfigContext';
import { MobileNavigationProvider } from './contexts/MobileNavigationContext';

// Import components
const LoginPage = React.lazy(() => import('./pages/Login'));
const TestPage = React.lazy(() => import('./pages/TestPage'));
const AuthDebugPage = React.lazy(() => import('./pages/debug/AuthDebugPage'));
const WoundCareDashboard = React.lazy(() => import('./pages/dashboard/WoundCareDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/dashboard/index'));
const IVRReviewQueue = React.lazy(() => import('./components/admin/IVRReviewQueue'));
const ProviderNetwork = React.lazy(() => import('./components/admin/ProviderNetwork'));
const UserManagement = React.lazy(() => import('./components/admin/UserManagement'));
const AuditLogs = React.lazy(() => import('./components/admin/AuditLogs'));
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
const SystemSettings = React.lazy(() => import('./components/admin/SystemSettings'));
const MasterDistributorDashboard = React.lazy(() => import('./pages/distributor/MasterDistributorDashboard'));
const DistributorLayout = React.lazy(() => import('./components/distributor/layout/DistributorLayout'));
const SegmentedIVRManagement = React.lazy(() => import('./components/distributor/ivr/SegmentedIVRManagement'));
const NetworkManagement = React.lazy(() => import('./components/distributor/network/NetworkManagement'));
const DistributorAnalytics = React.lazy(() => import('./components/distributor/analytics/DistributorAnalytics'));
const OrderFulfillmentDashboard = React.lazy(() => import('./components/distributor/orders/OrderFulfillmentDashboard'));
const ShippingLogistics = React.lazy(() => import('./components/distributor/orders/ShippingLogistics'));
const SimpleIVRDashboard = React.lazy(() => import('./components/ivr/SimpleIVRDashboard'));
const SimpleCHPAdminDashboard = React.lazy(() => import('./components/chp/SimpleCHPAdminDashboard'));
const SimpleDistributorDashboard = React.lazy(() => import('./components/distributor/SimpleDistributorDashboard'));
const SimpleSalesDashboard = React.lazy(() => import('./components/sales/SimpleSalesDashboard'));
const SimpleLogisticsDashboard = React.lazy(() => import('./components/logistics/SimpleLogisticsDashboard'));

const App = () => {
  console.log('App component rendering');

  return (
    <ConfigProvider>
      <MobileNavigationProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#333',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
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
                <Route path="/auth-debug" element={<AuthDebugPage />} />

                {/* DEBUG ROUTE - Temporary for troubleshooting */}
                <Route path="/debug-auth-state" element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Auth State Debug</h1>
                    <pre className="bg-gray-100 p-4 rounded">
                      {JSON.stringify({
                        isAuthenticated: 'Check console for auth state',
                        timestamp: new Date().toISOString()
                      }, null, 2)}
                    </pre>
                  </div>
                } />

                {/* Role-Based Dashboard Router - MOVED UP to handle /dashboard first */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<DashboardRouter />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="ivr-review" element={<IVRReviewQueue />} />
                    <Route path="providers" element={<ProviderNetwork />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SystemSettings />} />
                  </Route>
                </Route>

                {/* Doctor Routes - MOVED UP to prevent conflicts */}
                <Route element={<PrivateRoute />}>
                  <Route path="/doctor" element={<MainLayout />}>
                    <Route index element={<Navigate to="/doctor/dashboard" replace />} />
                    <Route path="dashboard" element={<WoundCareDashboard />} />

                    {/* Patient Routes */}
                    <Route path="patients">
                      <Route index element={<Navigate to="/doctor/patients/select" replace />} />
                      <Route path="select" element={<PatientSelectionPage />} />
                      <Route path="intake" element={<PatientIntakePage />} />
                      <Route path=":id" element={<PatientDetailPage />} />
                    </Route>

                    {/* IVR Routes */}
                    <Route path="ivr">
                      <Route index element={<IVRManagementPage />} />
                      <Route path="submit">
                        <Route index element={<Navigate to="/doctor/patients/select" replace />} />
                        <Route path="test/:patientId" element={<TestIVRPage />} />
                        <Route path=":patientId" element={<IVRSubmissionPage />} />
                      </Route>
                    </Route>

                    {/* Other Routes */}
                    <Route path="orders" element={<OrderManagementPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Legacy standalone routes for backward compatibility */}
                  <Route path="/patients" element={<Navigate to="/doctor/patients" replace />} />
                  <Route path="/patients/*" element={<Navigate to="/doctor/patients" replace />} />
                  <Route path="/orders" element={<Navigate to="/doctor/orders" replace />} />
                  <Route path="/shipping" element={<Navigate to="/doctor/orders" replace />} />
                  <Route path="/analytics" element={<Navigate to="/doctor/analytics" replace />} />
                  <Route path="/settings" element={<Navigate to="/doctor/settings" replace />} />
                </Route>

                {/* Master Distributor Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/distributor" element={<DistributorLayout />}>
                    <Route index element={<Navigate to="/distributor/dashboard" replace />} />
                    <Route path="dashboard" element={<MasterDistributorDashboard />} />
                    <Route path="ivr/management" element={<SegmentedIVRManagement />} />
                    <Route path="network" element={<NetworkManagement />} />
                    <Route path="orders/management" element={<OrderFulfillmentDashboard />} />
                    <Route path="orders/shipping" element={<ShippingLogistics />} />
                    <Route path="orders/*" element={<OrderManagementPage />} />
                    <Route path="shipping/*" element={<ShippingPage />} />
                    <Route path="logistics/*" element={<ShippingLogistics />} />
                    <Route path="analytics" element={<DistributorAnalytics />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* IVR Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/ivr/dashboard" element={<SimpleIVRDashboard />} />
                </Route>

                {/* CHP Admin Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/chp/dashboard" element={<SimpleCHPAdminDashboard />} />
                </Route>

                {/* Regional Distributor Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/distributor-regional/dashboard" element={<SimpleDistributorDashboard />} />
                </Route>

                {/* Sales Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/sales/dashboard" element={<SimpleSalesDashboard />} />
                </Route>

                {/* Shipping and Logistics Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/logistics/dashboard" element={<SimpleLogisticsDashboard />} />
                </Route>

                {/* Root Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
      </MobileNavigationProvider>
    </ConfigProvider>
  );
};

export default App;