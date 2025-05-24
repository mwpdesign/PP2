import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Lazy load components with error handling
const LoginPage = lazy(() => 
  import('./pages/LoginPage').then(module => ({ default: module.default }))
);

const MainLayout = lazy(() => 
  import('./components/layout/MainLayout').then(module => ({ default: module.MainLayout }))
);

const WoundCareDashboard = lazy(() => 
  import('./pages/dashboard/WoundCareDashboard').then(module => ({ default: module.default }))
);

const NewPatientForm = lazy(() => 
  import('./components/patients/NewPatientForm').then(module => ({ default: module.NewPatientForm }))
);

const Patients = lazy(() => 
  import('./components/patients/Patients').then(module => ({ default: module.default }))
);

// Loading component with proper error handling
const Loading = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
    }}
  >
    <CircularProgress sx={{ color: '#375788' }} />
  </Box>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<WoundCareDashboard />} />
              
              {/* Patient Routes */}
              <Route path="patients">
                <Route index element={<Patients />} />
                <Route path="new" element={<NewPatientForm />} />
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;