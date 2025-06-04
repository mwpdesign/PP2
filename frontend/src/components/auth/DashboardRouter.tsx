import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('='.repeat(60));
    console.log('[DashboardRouter] COMPONENT MOUNTED/UPDATED');
    console.log('='.repeat(60));
    console.log('[DashboardRouter] Current state:');
    console.log('  - isLoading:', isLoading);
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user:', user);
    console.log('  - user?.role:', user?.role);
    console.log('  - user?.email:', user?.email);
    console.log('='.repeat(60));
  }, [user, isAuthenticated, isLoading]);

  console.log('[DashboardRouter] Render - User role:', user?.role);
  console.log('[DashboardRouter] Render - Is authenticated:', isAuthenticated);
  console.log('[DashboardRouter] Render - Is loading:', isLoading);

  // Show loading while authentication is being determined
  if (isLoading) {
    console.log('[DashboardRouter] 🔄 LOADING STATE - Showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2E86AB]"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('[DashboardRouter] ❌ NOT AUTHENTICATED - Redirecting to login');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user:', user);
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  const userRole = user.role;
  console.log('[DashboardRouter] 🎯 ROUTING USER - Role:', userRole);

  switch (userRole) {
    case 'Admin':
      console.log('[DashboardRouter] ✅ ADMIN ROUTE: Redirecting Admin to /admin/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: Admin -> /admin/dashboard');
      return <Navigate to="/admin/dashboard" replace />;

    case 'Doctor':
      console.log('[DashboardRouter] ✅ DOCTOR ROUTE: Redirecting Doctor to /doctor/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: Doctor -> /doctor/dashboard');
      return <Navigate to="/doctor/dashboard" replace />;

    case 'IVR':
      console.log('[DashboardRouter] ✅ IVR ROUTE: Redirecting IVR to /ivr/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: IVR -> /ivr/dashboard');
      return <Navigate to="/ivr/dashboard" replace />;

    case 'Master Distributor':
      console.log('[DashboardRouter] ✅ MASTER DISTRIBUTOR ROUTE: Redirecting Master Distributor to /distributor/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: Master Distributor -> /distributor/dashboard');
      return <Navigate to="/distributor/dashboard" replace />;

    case 'CHP Admin':
      console.log('[DashboardRouter] ✅ CHP ADMIN ROUTE: Redirecting CHP Admin to /chp/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: CHP Admin -> /chp/dashboard');
      return <Navigate to="/chp/dashboard" replace />;

    case 'Distributor':
      console.log('[DashboardRouter] ✅ DISTRIBUTOR ROUTE: Redirecting Distributor to /distributor-regional/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: Distributor -> /distributor-regional/dashboard');
      return <Navigate to="/distributor-regional/dashboard" replace />;

    case 'Sales':
      console.log('[DashboardRouter] ✅ SALES ROUTE: Redirecting Sales to /sales/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: Sales -> /sales/dashboard');
      return <Navigate to="/sales/dashboard" replace />;

    case 'Shipping and Logistics':
      console.log('[DashboardRouter] ✅ LOGISTICS ROUTE: Redirecting Shipping and Logistics to /logistics/dashboard');
      console.log('[DashboardRouter] 🚀 NAVIGATION: Shipping and Logistics -> /logistics/dashboard');
      return <Navigate to="/logistics/dashboard" replace />;

    default:
      console.log('[DashboardRouter] ❌ UNKNOWN ROLE "' + userRole + '", redirecting to /doctor/dashboard');
      console.log('[DashboardRouter] 🚀 FALLBACK NAVIGATION: Unknown role -> /doctor/dashboard');
      return <Navigate to="/doctor/dashboard" replace />;
  }
};