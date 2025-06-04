import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('[AdminRoute] ===== ADMIN ROUTE CHECK =====');
  console.log('[AdminRoute] User:', user);
  console.log('[AdminRoute] User role:', user?.role);
  console.log('[AdminRoute] Is authenticated:', isAuthenticated);
  console.log('[AdminRoute] Is loading:', isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#375788]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[AdminRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'Admin') {
    console.log('[AdminRoute] User is not Admin (role: ' + user?.role + '), redirecting to appropriate dashboard');

    // Redirect to role-appropriate dashboard instead of /dashboard to avoid loops
    switch (user?.role) {
      case 'Doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'IVR':
        return <Navigate to="/ivr/dashboard" replace />;
      case 'Master Distributor':
        return <Navigate to="/distributor/dashboard" replace />;
      case 'CHP Admin':
        return <Navigate to="/chp/dashboard" replace />;
      case 'Distributor':
        return <Navigate to="/distributor-regional/dashboard" replace />;
      case 'Sales':
        return <Navigate to="/sales/dashboard" replace />;
      case 'Shipping and Logistics':
        return <Navigate to="/logistics/dashboard" replace />;
      default:
        return <Navigate to="/doctor/dashboard" replace />;
    }
  }

  console.log('[AdminRoute] ✅ Admin access granted');
  return <Outlet />;
}