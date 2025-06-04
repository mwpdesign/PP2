import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  console.log('[DashboardRouter] User role:', user?.role);
  console.log('[DashboardRouter] Is authenticated:', isAuthenticated);

  // Show loading while authentication is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2E86AB]"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('[DashboardRouter] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  const userRole = user.role;
  console.log('[DashboardRouter] Routing user with role:', userRole);

  switch (userRole) {
    case 'Admin':
      console.log('[DashboardRouter] ✅ ADMIN ROUTE: Redirecting Admin to /admin/dashboard');
      return <Navigate to="/admin/dashboard" replace />;

    case 'Doctor':
      console.log('[DashboardRouter] ✅ DOCTOR ROUTE: Redirecting Doctor to /doctor/dashboard');
      return <Navigate to="/doctor/dashboard" replace />;

    case 'IVR':
      console.log('[DashboardRouter] ✅ IVR ROUTE: Redirecting IVR to /ivr/dashboard');
      return <Navigate to="/ivr/dashboard" replace />;

    case 'Master Distributor':
      console.log('[DashboardRouter] ✅ MASTER DISTRIBUTOR ROUTE: Redirecting Master Distributor to /distributor/dashboard');
      return <Navigate to="/distributor/dashboard" replace />;

    case 'CHP Admin':
      console.log('[DashboardRouter] ✅ CHP ADMIN ROUTE: Redirecting CHP Admin to /chp/dashboard');
      return <Navigate to="/chp/dashboard" replace />;

    case 'Distributor':
      console.log('[DashboardRouter] ✅ DISTRIBUTOR ROUTE: Redirecting Distributor to /distributor-regional/dashboard');
      return <Navigate to="/distributor-regional/dashboard" replace />;

    case 'Sales':
      console.log('[DashboardRouter] ✅ SALES ROUTE: Redirecting Sales to /sales/dashboard');
      return <Navigate to="/sales/dashboard" replace />;

    case 'Shipping and Logistics':
      console.log('[DashboardRouter] ✅ LOGISTICS ROUTE: Redirecting Shipping and Logistics to /logistics/dashboard');
      return <Navigate to="/logistics/dashboard" replace />;

    default:
      console.log('[DashboardRouter] ❌ Unknown role "' + userRole + '", redirecting to /doctor/dashboard');
      return <Navigate to="/doctor/dashboard" replace />;
  }
};