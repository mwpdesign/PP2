import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

const DistributorLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-[#2C3E50] text-white">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-start p-6 border-b border-[rgba(255,255,255,0.1)]">
            <img 
              src="/logo2.png" 
              alt="Healthcare IVR" 
              className="h-24 w-auto"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white text-2xl font-semibold">Healthcare IVR</span>';
                }
              }}
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-7 pt-4 space-y-2">
            <NavLink href="/distributor/dashboard" label="Dashboard" />
            <NavLink href="/distributor/ivr/management" label="IVR Management" />
            <NavLink href="/distributor/orders/fulfillment" label="Order Processing" />
            <NavLink href="/distributor/orders/queue" label="Order Queue" />
            <NavLink href="/distributor/logistics/shipments" label="Shipping & Logistics" />
            <NavLink href="/distributor/network" label="Manage Network" />
            <NavLink href="/distributor/analytics" label="Analytics & Reports" />
            <NavLink href="/distributor/settings" label="Settings" />
          </nav>

          {/* User Info and Sign Out */}
          <div className="mt-auto px-7 pb-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.9)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors mb-4"
            >
              <ArrowRightOnRectangleIcon className="mr-4 h-5 w-5" />
              Sign Out
            </button>
            
            <div className="border-t border-[rgba(255,255,255,0.1)] pt-4">
              <div className="flex items-center px-4">
                <div className="h-10 w-10 rounded-full bg-[#375788] flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.7)]">Master Distributor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pl-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-lg font-medium text-gray-900">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">System Status: Operational</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="min-h-screen p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Helper component for navigation links
const NavLink: React.FC<{ href: string; label: string }> = ({ href, label }) => {
  const isActive = window.location.pathname === href;
  
  return (
    <a
      href={href}
      className={`
        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
        ${isActive 
          ? 'bg-[#375788] text-white' 
          : 'text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'}
      `}
    >
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
};

export default DistributorLayout; 