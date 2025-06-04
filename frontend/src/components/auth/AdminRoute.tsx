import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('[AdminRoute] ===== ADMIN ROUTE CHECK =====');
  console.log('[AdminRoute] Current location:', location.pathname);
  console.log('[AdminRoute] User:', user);
  console.log('[AdminRoute] User role:', user?.role);
  console.log('[AdminRoute] User email:', user?.email);
  console.log('[AdminRoute] Is authenticated:', isAuthenticated);
  console.log('[AdminRoute] Is loading:', isLoading);

  if (isLoading) {
    console.log('[AdminRoute] 🔄 LOADING STATE - Showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#375788]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[AdminRoute] ❌ NOT AUTHENTICATED - Redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'Admin') {
    console.log('[AdminRoute] ❌ USER IS NOT ADMIN (role: ' + user?.role + ') - Redirecting to appropriate dashboard');

    // Redirect to role-appropriate dashboard instead of /dashboard to avoid loops
    switch (user?.role) {
      case 'Doctor':
        console.log('[AdminRoute] 🚀 REDIRECT: Doctor -> /doctor/dashboard');
        return <Navigate to="/doctor/dashboard" replace />;
      case 'IVR':
        console.log('[AdminRoute] 🚀 REDIRECT: IVR -> /ivr/dashboard');
        return <Navigate to="/ivr/dashboard" replace />;
      case 'Master Distributor':
        console.log('[AdminRoute] 🚀 REDIRECT: Master Distributor -> /distributor/dashboard');
        return <Navigate to="/distributor/dashboard" replace />;
      case 'CHP Admin':
        console.log('[AdminRoute] 🚀 REDIRECT: CHP Admin -> /chp/dashboard');
        return <Navigate to="/chp/dashboard" replace />;
      case 'Distributor':
        console.log('[AdminRoute] 🚀 REDIRECT: Distributor -> /distributor-regional/dashboard');
        return <Navigate to="/distributor-regional/dashboard" replace />;
      case 'Sales':
        console.log('[AdminRoute] 🚀 REDIRECT: Sales -> /sales/dashboard');
        return <Navigate to="/sales/dashboard" replace />;
      case 'Shipping and Logistics':
        console.log('[AdminRoute] 🚀 REDIRECT: Logistics -> /logistics/dashboard');
        return <Navigate to="/logistics/dashboard" replace />;
      default:
        console.log('[AdminRoute] 🚀 REDIRECT: Unknown role -> /doctor/dashboard');
        return <Navigate to="/doctor/dashboard" replace />;
    }
  }

  console.log('[AdminRoute] ✅ ADMIN ACCESS GRANTED - Rendering admin content');
  return <Outlet />;
}