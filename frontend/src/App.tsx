import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Import components
const TestPage = React.lazy(() => import('./pages/TestPage'));
const WoundCareDashboard = React.lazy(() => import('./pages/dashboard/WoundCareDashboard'));
const PatientIntake = React.lazy(() => import('./pages/patients/intake'));
const IVRSubmission = React.lazy(() => import('./pages/ivr/submit'));
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
              <Route path="patients/intake" element={<PatientIntake />} />
              <Route path="ivr/submit" element={<IVRSubmission />} />
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