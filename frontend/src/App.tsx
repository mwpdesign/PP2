import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Import components
const TestPage = React.lazy(() => import('./pages/TestPage'));
const WoundCareDashboard = React.lazy(() => import('./pages/dashboard/WoundCareDashboard'));
const PatientIntakePage = React.lazy(() => import('./pages/patients/intake'));
const PatientSelectionPage = React.lazy(() => import('./pages/patients/select'));
const PatientDetailPage = React.lazy(() => import('./pages/patients/[id]'));
const IVRManagementPage = React.lazy(() => import('./pages/ivr'));
const IVRSubmissionPage = React.lazy(() => import('./pages/ivr/submit'));
const OrderManagementPage = React.lazy(() => import('./pages/orders'));
const ShippingPage = React.lazy(() => import('./pages/shipping'));
const AnalyticsPage = React.lazy(() => import('./pages/analytics'));
const SettingsPage = React.lazy(() => import('./pages/settings'));
const MainLayout = React.lazy(() => import('./components/shared/layout/Layout'));

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
            {/* Test Routes */}
            <Route path="/test" element={<TestPage />} />
            
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
                <Route path="submit" element={<IVRSubmissionPage />} />
              </Route>
              
              {/* Other Routes */}
              <Route path="orders" element={<OrderManagementPage />} />
              <Route path="shipping" element={<ShippingPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Keep test route accessible */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;