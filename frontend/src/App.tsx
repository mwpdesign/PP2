import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Import components
const TestPage = React.lazy(() => import('./pages/TestPage'));
const TestDashboard = React.lazy(() => import('./pages/dashboard/TestDashboard'));
const MainLayout = React.lazy(() => import('./components/layout/MainLayout').then(module => ({ default: module.MainLayout })));

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
              <Route path="dashboard" element={<TestDashboard />} />
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