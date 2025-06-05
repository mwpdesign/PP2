import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // MASSIVE DEBUG ALERT - This should appear if DashboardRouter is called
  console.log('🚨🚨🚨 [DashboardRouter] COMPONENT CALLED - THIS IS THE ENTRY POINT 🚨🚨🚨');
  console.log('🚨🚨🚨 [DashboardRouter] If you see this, DashboardRouter is working 🚨🚨🚨');

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('='.repeat(80));
    console.log('🔍 [DashboardRouter] COMPONENT MOUNTED/UPDATED');
    console.log('='.repeat(80));
    console.log('📊 [DashboardRouter] Current state:');
    console.log('  - isLoading:', isLoading);
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user object:', user);
    console.log('  - user?.role:', user?.role);
    console.log('  - user?.role type:', typeof user?.role);
    console.log('='.repeat(80));
  }, [user, isAuthenticated, isLoading]);

  console.log('🎯 [DashboardRouter] Render - User role:', user?.role);
  console.log('🔐 [DashboardRouter] Render - Is authenticated:', isAuthenticated);
  console.log('⏳ [DashboardRouter] Render - Is loading:', isLoading);

  // Show loading while authentication is being determined
  if (isLoading) {
    console.log('⏳ [DashboardRouter] 🔄 LOADING STATE - Showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2E86AB]"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ [DashboardRouter] NOT AUTHENTICATED - Redirecting to login');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user:', user);
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  const userRole = user.role;
  console.log('🚀 [DashboardRouter] ROUTING DECISION STARTING');
  console.log('🎯 [DashboardRouter] User role for routing:', userRole);
  console.log('🔍 [DashboardRouter] User role type:', typeof userRole);
  console.log('📝 [DashboardRouter] User role JSON:', JSON.stringify(userRole));

  // Enhanced role matching with explicit logging
  console.log('🔍 [DashboardRouter] Testing role matches:');
  console.log('  - userRole === "Admin":', userRole === 'Admin');
  console.log('  - userRole === "Doctor":', userRole === 'Doctor');
  console.log('  - userRole === "IVR":', userRole === 'IVR');
  console.log('  - userRole === "Master Distributor":', userRole === 'Master Distributor');
  console.log('  - userRole === "CHP Admin":', userRole === 'CHP Admin');
  console.log('  - userRole === "Distributor":', userRole === 'Distributor');
  console.log('  - userRole === "Sales":', userRole === 'Sales');
  console.log('  - userRole === "Shipping and Logistics":', userRole === 'Shipping and Logistics');

  switch (userRole) {
    case 'Admin':
      console.log('✅ [DashboardRouter] ADMIN ROUTE: Redirecting Admin to /admin/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: Admin -> /admin/dashboard');
      return <Navigate to="/admin/dashboard" replace />;

    case 'Doctor':
      console.log('✅ [DashboardRouter] DOCTOR ROUTE: Redirecting Doctor to /doctor/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: Doctor -> /doctor/dashboard');
      return <Navigate to="/doctor/dashboard" replace />;

    case 'IVR':
      console.log('✅ [DashboardRouter] IVR ROUTE: Redirecting IVR to /ivr/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: IVR -> /ivr/dashboard');
      return <Navigate to="/ivr/dashboard" replace />;

    case 'Master Distributor':
      console.log('✅ [DashboardRouter] MASTER DISTRIBUTOR ROUTE: Redirecting Master Distributor to /distributor/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: Master Distributor -> /distributor/dashboard');
      return <Navigate to="/distributor/dashboard" replace />;

    case 'CHP Admin':
      console.log('✅ [DashboardRouter] CHP ADMIN ROUTE: Redirecting CHP Admin to /chp/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: CHP Admin -> /chp/dashboard');
      return <Navigate to="/chp/dashboard" replace />;

    case 'Distributor':
      console.log('✅ [DashboardRouter] DISTRIBUTOR ROUTE: Redirecting Distributor to /distributor-regional/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: Distributor -> /distributor-regional/dashboard');
      return <Navigate to="/distributor-regional/dashboard" replace />;

    case 'Sales':
      console.log('✅ [DashboardRouter] SALES ROUTE: Redirecting Sales to /sales/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: Sales -> /sales/dashboard');
      return <Navigate to="/sales/dashboard" replace />;

    case 'Shipping and Logistics':
      console.log('✅ [DashboardRouter] LOGISTICS ROUTE: Redirecting Shipping and Logistics to /logistics/dashboard');
      console.log('🚀 [DashboardRouter] NAVIGATION: Shipping and Logistics -> /logistics/dashboard');
      return <Navigate to="/logistics/dashboard" replace />;

    default:
      console.log('❌ [DashboardRouter] UNKNOWN ROLE "' + userRole + '", redirecting to /doctor/dashboard');
      console.log('🚀 [DashboardRouter] FALLBACK NAVIGATION: Unknown role -> /doctor/dashboard');
      console.log('⚠️  [DashboardRouter] CRITICAL: This should not happen! Check role mapping.');
      console.log('🔍 [DashboardRouter] Debug info for unknown role:');
      console.log('  - Raw role value:', userRole);
      console.log('  - Role type:', typeof userRole);
      console.log('  - Role length:', userRole?.length);
      console.log('  - Role charCodes:', userRole?.split('').map(c => c.charCodeAt(0)));
      console.log('🛑 [DashboardRouter] EMERGENCY STOP - SHOWING DEBUG SCREEN');

      // Emergency debug screen instead of redirect
      return (
        <div style={{ padding: '20px', backgroundColor: '#ff5722', color: 'white', border: '3px solid black' }}>
          <h1>🚨 CRITICAL ROUTING ERROR</h1>
          <h2>Unknown Role Detected: "{userRole}"</h2>
          <div style={{ backgroundColor: 'black', padding: '10px', margin: '10px 0' }}>
            <p><strong>Raw role value:</strong> {JSON.stringify(userRole)}</p>
            <p><strong>Role type:</strong> {typeof userRole}</p>
            <p><strong>Role length:</strong> {userRole?.length}</p>
            <p><strong>User object:</strong> {JSON.stringify(user, null, 2)}</p>
          </div>
          <p>This screen should NEVER appear if role detection is working correctly!</p>
          <button onClick={() => window.location.href = '/login'} style={{ padding: '10px', margin: '5px' }}>
            Back to Login
          </button>
          <button onClick={() => window.location.href = '/doctor/dashboard'} style={{ padding: '10px', margin: '5px' }}>
            Force Doctor Dashboard
          </button>
        </div>
      );
      // return <Navigate to="/doctor/dashboard" replace />;
  }
};